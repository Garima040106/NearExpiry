const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            required: true,
            enum: ["staff", "pharmacist", "admin"]
        },

        facility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Facility",
            required: function () {
                return this.role === "staff" || this.role === "pharmacist";
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);

