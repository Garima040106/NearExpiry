const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            required: true
        },

        action: {
            type: String,
            enum: ["Created", "Approved", "Rejected"],
            required: true
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        note: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

