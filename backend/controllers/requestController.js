
const mongoose = require("mongoose");

const Medicine = require("../models/Medicine");
const Request = require("../models/Request");
const AuditLog = require("../models/AuditLog");

// Create a request for surplus medicine from another facility
exports.createRequest = async (req, res, next) => {
    try {
        const { medicineId, quantity } = req.body;

        // Validate required fields
        if (!medicineId || quantity === undefined) {
            return res.status(400).json({
                message: "Medicine ID and quantity are required"
            });
        }

        // Validate MongoDB medicine ID
        if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({
                message: "Invalid medicine ID"
            });
        }

        // Quantity must be a positive integer
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        // Find the medicine batch
        const medicine = await Medicine.findById(medicineId);

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine batch not found"
            });
        }

        // A facility cannot request its own surplus
        if (
            String(medicine.facility) === String(req.user.facility)
        ) {
            return res.status(400).json({
                message: "You cannot request surplus from your own facility"
            });
        }

        // Do not allow requests for expired medicine
        if (new Date(medicine.expiryDate) < new Date()) {
            return res.status(400).json({
                message: "Cannot request expired medicine"
            });
        }

        // Ensure the batch has available surplus
        if (medicine.surplusQuantity <= 0) {
            return res.status(400).json({
                message: "No surplus available for this medicine"
            });
        }

        // Requested quantity cannot exceed available surplus
        if (quantity > medicine.surplusQuantity) {
            return res.status(400).json({
                message: "Requested quantity exceeds available surplus"
            });
        }

        // Create a pending request
        const newRequest = await Request.create({
            medicine: medicine._id,
            requestingFacility: req.user.facility,
            supplyingFacility: medicine.facility,
            quantity: quantity,
            status: "Pending",
            requestedBy: req.user._id
        });

        // Record request creation in the audit log
        await AuditLog.create({
            request: newRequest._id,
            action: "Created",
            performedBy: req.user._id,
            note: `Requested ${quantity} units of ${medicine.name}`
        });

        // Return the created request
        res.status(201).json({
            message: "Medicine request submitted successfully",
            request: newRequest
        });

    } catch (error) {
        next(error);
    }
};


// Get requests sent and received by the logged-in user's facility
exports.getRequests = async (req, res, next) => {
    try {
        let filter = {};

        // Admin users can view all requests
        if (req.user.role !== "admin") {

            if (!req.user.facility) {
                return res.status(400).json({
                    message: "User is not associated with a facility"
                });
            }

            // Include requests sent by and received by this facility
            filter = {
                $or: [
                    { requestingFacility: req.user.facility },
                    { supplyingFacility: req.user.facility }
                ]
            };
        }

        const requests = await Request.find(filter)
            .populate("medicine", "name batchNumber expiryDate quantity surplusQuantity")
            .populate("requestingFacility", "name city")
            .populate("supplyingFacility", "name city")
            .populate("requestedBy", "name email")
            .populate("decidedBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: requests.length,
            requests: requests
        });

    } catch (error) {
        next(error);
    }
};
