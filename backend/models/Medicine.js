const mongoose = require("mongoose");

const NEAR_DAYS = 90;

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        batchNumber: {
            type: String,
            required: true,
            trim: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        expiryDate: {
            type: Date,
            required: true
        },

        surplusQuantity: {
            type: Number,
            default: 0,
            min: 0
        },

        facility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Facility",
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        }
    }
);

// Calculate medicine expiry status
medicineSchema.virtual("status").get(function () {
    const days = (this.expiryDate - Date.now()) / 86400000;

    if (days < 0) {
        return "Expired";
    }

    return days <= NEAR_DAYS ? "Near Expiry" : "Safe";
});

module.exports = mongoose.model("Medicine", medicineSchema);

