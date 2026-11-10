
const mongoose = require("mongoose");

const Medicine = require("../models/Medicine");
const Request = require("../models/Request");
const AuditLog = require("../models/AuditLog");

// Get the end of the current day.
// Medicine expiry dates are treated as calendar dates.
const getEndOfToday = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
};

// Create a request for surplus medicine from another facility
exports.createRequest = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const { medicineId, quantity } = req.body;

        if (!medicineId || quantity === undefined) {
            return res.status(400).json({
                message: "Medicine ID and quantity are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({
                message: "Invalid medicine ID"
            });
        }

        if (
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        if (!req.user.facility) {
            return res.status(400).json({
                message: "User is not associated with a facility"
            });
        }

        let createdRequestId;

        await session.withTransaction(async () => {
            const medicine = await Medicine.findById(medicineId)
                .session(session);

            if (!medicine) {
                const error = new Error("Medicine batch not found");
                error.statusCode = 404;
                throw error;
            }

            if (
                String(medicine.facility) ===
                String(req.user.facility)
            ) {
                const error = new Error(
                    "You cannot request surplus from your own facility"
                );
                error.statusCode = 400;
                throw error;
            }

            if (medicine.expiryDate > getEndOfToday()) {
                // Continue: medicine is not expired.
            } else if (
                new Date(medicine.expiryDate).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
            ) {
                const error = new Error(
                    "Cannot request expired medicine"
                );
                error.statusCode = 400;
                throw error;
            }

            if (medicine.surplusQuantity <= 0) {
                const error = new Error(
                    "No surplus available for this medicine"
                );
                error.statusCode = 400;
                throw error;
            }

            if (quantity > medicine.surplusQuantity) {
                const error = new Error(
                    "Requested quantity exceeds available surplus"
                );
                error.statusCode = 400;
                throw error;
            }

            const [newRequest] = await Request.create(
                [{
                    medicine: medicine._id,
                    requestingFacility: req.user.facility,
                    supplyingFacility: medicine.facility,
                    quantity,
                    status: "Pending",
                    requestedBy: req.user._id
                }],
                { session }
            );

            await AuditLog.create(
                [{
                    request: newRequest._id,
                    action: "Created",
                    performedBy: req.user._id,
                    note: `Requested ${quantity} units of ${medicine.name}`
                }],
                { session }
            );

            createdRequestId = newRequest._id;
        });

        const populatedRequest = await Request.findById(
            createdRequestId
        )
            .populate("medicine", "name batchNumber expiryDate quantity surplusQuantity")
            .populate("requestingFacility", "name city")
            .populate("supplyingFacility", "name city")
            .populate("requestedBy", "name email");

        return res.status(201).json({
            message: "Medicine request submitted successfully",
            request: populatedRequest
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }

        next(error);

    } finally {
        await session.endSession();
    }
};


// Get requests sent and received by the logged-in user's facility
exports.getRequests = async (req, res, next) => {
    try {
        let filter = {};

        if (req.user.role !== "admin") {
            if (!req.user.facility) {
                return res.status(400).json({
                    message: "User is not associated with a facility"
                });
            }

            filter = {
                $or: [
                    { requestingFacility: req.user.facility },
                    { supplyingFacility: req.user.facility }
                ]
            };
        }

        const requests = await Request.find(filter)
            .populate(
                "medicine",
                "name batchNumber expiryDate quantity surplusQuantity"
            )
            .populate("requestingFacility", "name city")
            .populate("supplyingFacility", "name city")
            .populate("requestedBy", "name email")
            .populate("decidedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: requests.length,
            requests
        });

    } catch (error) {
        next(error);
    }
};


// Approve or reject a medicine request (pharmacist only)
exports.decide = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const { decision, reason } = req.body;
        const { id } = req.params;

        if (!["Approved", "Rejected"].includes(decision)) {
            return res.status(400).json({
                message: "Invalid decision"
            });
        }

        if (
            !reason ||
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                message: "A reason is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid request ID"
            });
        }

        if (!req.user.facility) {
            return res.status(400).json({
                message: "Pharmacist is not assigned to a facility"
            });
        }

        await session.withTransaction(async () => {
            const request = await Request.findById(id).session(session);

            if (!request) {
                const error = new Error("Request not found");
                error.statusCode = 404;
                throw error;
            }

            if (request.status !== "Pending") {
                const error = new Error("Request is not pending");
                error.statusCode = 400;
                throw error;
            }

            if (
                String(request.supplyingFacility) !==
                String(req.user.facility)
            ) {
                const error = new Error("Not your facility");
                error.statusCode = 403;
                throw error;
            }

            const medicine = await Medicine.findById(request.medicine)
                .session(session);

            if (!medicine) {
                const error = new Error(
                    "Associated medicine batch not found"
                );
                error.statusCode = 404;
                throw error;
            }

            if (decision === "Approved") {
                if (
                    new Date(medicine.expiryDate).setHours(0, 0, 0, 0) <
                    new Date().setHours(0, 0, 0, 0)
                ) {
                    const error = new Error(
                        "Expired medicines cannot be approved"
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // Conditional update prevents stock from becoming negative.
                const updatedMedicine = await Medicine.findOneAndUpdate(
                    {
                        _id: medicine._id,
                        facility: req.user.facility,
                        quantity: { $gte: request.quantity },
                        surplusQuantity: { $gte: request.quantity }
                    },
                    {
                        $inc: {
                            quantity: -request.quantity,
                            surplusQuantity: -request.quantity
                        }
                    },
                    {
                        new: true,
                        runValidators: true,
                        session
                    }
                );

                if (!updatedMedicine) {
                    const error = new Error(
                        "Not enough available stock or surplus"
                    );
                    error.statusCode = 400;
                    throw error;
                }
            }

            // Only one decision can change a pending request.
            const updatedRequest = await Request.findOneAndUpdate(
                {
                    _id: id,
                    status: "Pending"
                },
                {
                    $set: {
                        status: decision,
                        reason: reason.trim(),
                        decidedBy: req.user._id
                    }
                },
                {
                    new: true,
                    runValidators: true,
                    session
                }
            );

            if (!updatedRequest) {
                const error = new Error(
                    "Request has already been decided"
                );
                error.statusCode = 409;
                throw error;
            }

            await AuditLog.create(
                [{
                    request: updatedRequest._id,
                    action: decision,
                    performedBy: req.user._id,
                    note: reason.trim()
                }],
                { session }
            );
        });

        const finalRequest = await Request.findById(id)
            .populate(
                "medicine",
                "name batchNumber expiryDate quantity surplusQuantity"
            )
            .populate("requestingFacility", "name city")
            .populate("supplyingFacility", "name city")
            .populate("requestedBy", "name email")
            .populate("decidedBy", "name email");

        return res.status(200).json({
            message: `Request ${decision.toLowerCase()} successfully`,
            request: finalRequest
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }

        next(error);

    } finally {
        await session.endSession();
    }
};
