const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Medicine",
            required: true
        },

        requestingFacility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Facility",
            required: true
        },

        supplyingFacility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Facility",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },

        reason: {
            type: String,
            trim: true
        },

        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        decidedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Request", requestSchema);
