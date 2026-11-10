const mongoose = require("mongoose");
const Medicine = require("../models/Medicine");

// Check whether a value is a valid MongoDB ObjectId
const isValidId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Get the start of the current day
const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};
// Get medicine batches
exports.getMedicines = async (req, res, next) => {
    try {
        const { q, status, days, facility } = req.query;

        const filter = {};

        // Restrict staff and pharmacists to their own facility
        if (req.user.role !== "admin") {
            if (!req.user.facility) {
                return res.status(400).json({
                    message: "User is not assigned to a facility"
                });
            }

            filter.facility = req.user.facility;
        } else if (facility) {
            if (!isValidId(facility)) {
                return res.status(400).json({
                    message: "Invalid facility ID"
                });
            }

            filter.facility = facility;
        }

        // Search by medicine name
        if (q && q.trim()) {
            const searchText = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.name = {
            $regex: searchText,
            $options: "i"
            };
        }

        // Filter by expiry status
        const now = new Date();
        const ninetyDaysLater = new Date(
            now.getTime() + 90 * 86400000
        );

        if (status === "Expired") {
            filter.expiryDate = { $lt: now };

        } else if (status === "Near Expiry") {
            filter.expiryDate = {
                $gte: now,
                $lte: ninetyDaysLater
            };

        } else if (status === "Safe") {
            filter.expiryDate = {
                $gt: ninetyDaysLater
            };

        } else if (status) {
            return res.status(400).json({
                message: "Invalid expiry status"
            });
        }

        // Filter batches expiring within a specified number of days
        if (days !== undefined) {
            const numberOfDays = Number(days);

            if (
                !Number.isInteger(numberOfDays) ||
                numberOfDays < 0 ||
                numberOfDays > 3650
            ) {
                return res.status(400).json({
                    message: "Days must be a valid number between 0 and 3650"
                });
            }

            const startDate = getToday();
            const endDate = new Date(
                startDate.getTime() + numberOfDays * 86400000
            );
            endDate.setHours(23, 59, 59, 999);

            const daysFilter = {
                $gte: startDate,
                $lte: endDate
            };

            if (filter.expiryDate) {
                const existingFilter = filter.expiryDate;

                filter.expiryDate = {
                    ...existingFilter,
                    $gte: existingFilter.$gte
                        ? new Date(Math.max(
                            existingFilter.$gte,
                            daysFilter.$gte
                        ))
                        : daysFilter.$gte,
                    $lte: existingFilter.$lte
                        ? new Date(Math.min(
                            existingFilter.$lte,
                            daysFilter.$lte
                        ))
                        : daysFilter.$lte
                };
            } else {
                filter.expiryDate = daysFilter;
            }
        }

        const medicines = await Medicine.find(filter)
            .populate("facility", "name city")
            .sort({ expiryDate: 1 });

        res.status(200).json({
            count: medicines.length,
            medicines
        });

    } catch (error) {
        next(error);
    }
};

// Add a new medicine batch
exports.addMedicine = async (req, res, next) => {
    try {
        const {
            name,
            batchNumber,
            quantity,
            expiryDate
        } = req.body;

        if (!name || !batchNumber || quantity === undefined || !expiryDate) {
            return res.status(400).json({
                message: "All medicine fields are required"
            });
        }

        if (!req.user.facility) {
            return res.status(400).json({
                message: "User is not assigned to a facility"
            });
        }

        const parsedQuantity = Number(quantity);
        const parsedDate = new Date(expiryDate);

        if (
            !Number.isSafeInteger(parsedQuantity) ||
            parsedQuantity < 0
        ) {
            return res.status(400).json({
                message: "Quantity must be a non-negative whole number"
            });
        }

        if (!Number.isFinite(parsedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid expiry date"
            });
        }

        const medicine = await Medicine.create({
            name: name.trim(),
            batchNumber: batchNumber.trim(),
            quantity: parsedQuantity,
            expiryDate: parsedDate,
            surplusQuantity: 0,
            facility: req.user.facility
        });

        res.status(201).json({
            message: "Medicine batch added successfully",
            medicine
        });

    } catch (error) {
        next(error);
    }
};

// Update an existing medicine batch
exports.updateMedicine = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid medicine ID"
            });
        }

        const medicine = await Medicine.findOne({
            _id: id,
            facility: req.user.facility
        });

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine batch not found"
            });
        }

        const { name, batchNumber, quantity, expiryDate } = req.body;

        // Update only permitted fields
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Invalid medicine name"
                });
            }

            medicine.name = name.trim();
        }

        if (batchNumber !== undefined) {
            if (
                typeof batchNumber !== "string" ||
                !batchNumber.trim()
            ) {
                return res.status(400).json({
                    message: "Invalid batch number"
                });
            }

            medicine.batchNumber = batchNumber.trim();
        }

        if (quantity !== undefined) {
            const parsedQuantity = Number(quantity);

            if (
                !Number.isSafeInteger(parsedQuantity) ||
                parsedQuantity < 0
            ) {
                return res.status(400).json({
                    message: "Quantity must be a non-negative whole number"
                });
            }

            if (parsedQuantity < medicine.surplusQuantity) {
                return res.status(400).json({
                    message: "Quantity cannot be less than listed surplus"
                });
            }

            medicine.quantity = parsedQuantity;
        }

        if (expiryDate !== undefined) {
            const parsedDate = new Date(expiryDate);

            if (!Number.isFinite(parsedDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid expiry date"
                });
            }

            medicine.expiryDate = parsedDate;
        }

        await medicine.save();

        res.status(200).json({
            message: "Medicine batch updated successfully",
            medicine
        });

    } catch (error) {
        next(error);
    }
};

// Delete a medicine batch
exports.deleteMedicine = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid medicine ID"
            });
        }

        const medicine = await Medicine.findOneAndDelete({
            _id: id,
            facility: req.user.facility
        });

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine batch not found"
            });
        }

        res.status(200).json({
            message: "Medicine batch deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

// Set surplus quantity for a medicine batch
exports.setSurplus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { surplusQuantity } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid medicine ID"
            });
        }

        const parsedSurplus = Number(surplusQuantity);

        if (
            surplusQuantity === undefined ||
            !Number.isSafeInteger(parsedSurplus) ||
            parsedSurplus < 0
        ) {
            return res.status(400).json({
                message: "Surplus quantity must be a non-negative whole number"
            });
        }

        const medicine = await Medicine.findOne({
            _id: id,
            facility: req.user.facility
        });

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine batch not found"
            });
        }

        // Prevent expired medicines from being listed
        if (medicine.status === "Expired" && parsedSurplus > 0) {
            return res.status(400).json({
                message: "Expired medicines cannot be listed as surplus"
            });
        }

        // Surplus cannot exceed available stock
        if (parsedSurplus > medicine.quantity) {
            return res.status(400).json({
                message: "Surplus quantity cannot exceed available stock"
            });
        }

        medicine.surplusQuantity = parsedSurplus;

        await medicine.save();

        res.status(200).json({
            message: "Surplus quantity updated successfully",
            medicine
        });

    } catch (error) {
        next(error);
    }
};

// Browse surplus medicines from other facilities
exports.getSurplus = async (req, res, next) => {
    try {
        const { q, days } = req.query;

        const filter = {
            facility: { $ne: req.user.facility },
            surplusQuantity: { $gt: 0 },
            expiryDate: { $gte: new Date() }
        };

        // Search by medicine name
        if (q && q.trim()) {
            const searchText = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.name = {
                $regex: searchText,
                $options: "i"
            };
        }

        // Filter medicines expiring within the given number of days
        if (days !== undefined) {
            const numberOfDays = Number(days);

            if (
                !Number.isInteger(numberOfDays) ||
                numberOfDays < 0 ||
                numberOfDays > 3650
            ) {
                return res.status(400).json({
                    message: "Days must be a valid number between 0 and 3650"
                });
            }

            const endDate = new Date(
                Date.now() + numberOfDays * 86400000
            );

            filter.expiryDate.$lte = endDate;
        }

        const medicines = await Medicine.find(filter)
            .populate("facility", "name city")
            .sort({ expiryDate: 1 });

        res.status(200).json({
            count: medicines.length,
            medicines
        });

    } catch (error) {
        next(error);
    }
};