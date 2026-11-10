
const Medicine = require("../models/Medicine");
const Request = require("../models/Request");

// Get dashboard summary for the logged-in user
exports.getDashboard = async (req, res, next) => {
    try {
        const now = new Date();

        // Calculate the date 90 days from today
        const nearExpiryLimit = new Date(now);
        nearExpiryLimit.setDate(nearExpiryLimit.getDate() + 90);

        // Build the medicine filter
        let medicineFilter = {};

        // Build the request filter
        let requestFilter = {};

        // Staff and pharmacists see their facility's data
        if (req.user.role !== "admin") {
            if (!req.user.facility) {
                return res.status(400).json({
                    message: "User is not associated with a facility"
                });
            }

            medicineFilter.facility = req.user.facility;

            // Include requests sent and received by this facility
            requestFilter = {
                $or: [
                    { requestingFacility: req.user.facility },
                    { supplyingFacility: req.user.facility }
                ]
            };
        }

        // Count near-expiry medicine batches
        const nearExpiryCount = await Medicine.countDocuments({
            ...medicineFilter,
            expiryDate: {
                $gte: now,
                $lte: nearExpiryLimit
            }
        });

        // Count expired medicine batches
        const expiredCount = await Medicine.countDocuments({
            ...medicineFilter,
            expiryDate: {
                $lt: now
            }
        });

        // Count pending requests
        const pendingCount = await Request.countDocuments({
            ...requestFilter,
            status: "Pending"
        });

        // Count approved requests
        const approvedCount = await Request.countDocuments({
            ...requestFilter,
            status: "Approved"
        });

        // Return dashboard summary
        res.status(200).json({
            nearExpiry: nearExpiryCount,
            expired: expiredCount,
            pending: pendingCount,
            approved: approvedCount
        });

    } catch (error) {
        next(error);
    }
};
