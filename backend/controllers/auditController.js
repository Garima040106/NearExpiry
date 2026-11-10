
const Request = require("../models/Request");
const AuditLog = require("../models/AuditLog");

// Get the audit trail
exports.getAuditLogs = async (req, res, next) => {
    try {
        let filter = {};

        // Admins can view all audit records
        if (req.user.role !== "admin") {

            // Pharmacists must belong to a facility
            if (!req.user.facility) {
                return res.status(400).json({
                    message: "User is not associated with a facility"
                });
            }

            // Find requests involving the pharmacist's facility
            const requests = await Request.find({
                $or: [
                    { requestingFacility: req.user.facility },
                    { supplyingFacility: req.user.facility }
                ]
            }).select("_id");

            const requestIds = requests.map(request => request._id);

            // Return only audit entries for those requests
            filter = {
                request: { $in: requestIds }
            };
        }

        const auditLogs = await AuditLog.find(filter)
            .populate({
                path: "request",
                populate: [
                    {
                        path: "medicine",
                        select: "name batchNumber expiryDate"
                    },
                    {
                        path: "requestingFacility",
                        select: "name city"
                    },
                    {
                        path: "supplyingFacility",
                        select: "name city"
                    }
                ]
            })
            .populate("performedBy", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: auditLogs.length,
            auditLogs: auditLogs
        });

    } catch (error) {
        next(error);
    }
};
