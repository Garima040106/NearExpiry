
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Facility = require("../models/Facility");
const Medicine = require("../models/Medicine");

// ===============================
// USER MANAGEMENT
// ===============================

// Get all users
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate("facility", "name city")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};


// Update a user
exports.updateUser = async (req, res, next) => {
    try {
        const { name, email, role, facility, password } = req.body;
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Validate role if supplied
        if (
            role !== undefined &&
            !["staff", "pharmacist", "admin"].includes(role)
        ) {
            return res.status(400).json({
                message: "Invalid user role"
            });
        }

        // Prevent an admin from accidentally removing their own admin access
        if (
            String(user._id) === String(req.user._id) &&
            role !== undefined &&
            role !== "admin"
        ) {
            return res.status(400).json({
                message: "You cannot change your own admin role"
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Name cannot be empty"
                });
            }

            user.name = name.trim();
        }

        if (email !== undefined) {
            if (
                typeof email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ) {
                return res.status(400).json({
                    message: "Enter a valid email address"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: "Email already registered"
                });
            }

            user.email = normalizedEmail;
        }

        if (role !== undefined) {
            user.role = role;
        }

        // Staff and pharmacists must belong to a valid facility
        if (facility !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(facility)) {
                return res.status(400).json({
                    message: "Invalid facility ID"
                });
            }

            const facilityExists = await Facility.findById(facility);

            if (!facilityExists) {
                return res.status(404).json({
                    message: "Facility not found"
                });
            }

            user.facility = facility;
        }

        if (
            ["staff", "pharmacist"].includes(user.role) &&
            !user.facility
        ) {
            return res.status(400).json({
                message: "Staff and pharmacists must be assigned to a facility"
            });
        }

        // Admin users do not require a facility
        if (user.role === "admin") {
            user.facility = undefined;
        }

        // Hash a new password if one is supplied
        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 8) {
                return res.status(400).json({
                    message: "Password must contain at least 8 characters"
                });
            }

            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select("-password")
            .populate("facility", "name city");

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        next(error);
    }
};


// Delete a user
exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        // Prevent an admin from deleting their own account
        if (String(userId) === String(req.user._id)) {
            return res.status(400).json({
                message: "You cannot delete your own account"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: "User deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};


// ===============================
// FACILITY MANAGEMENT
// ===============================

// Get all facilities
exports.getFacilities = async (req, res, next) => {
    try {
        const facilities = await Facility.find()
            .sort({ name: 1 });

        res.status(200).json({
            count: facilities.length,
            facilities
        });

    } catch (error) {
        next(error);
    }
};


// Create a facility
exports.createFacility = async (req, res, next) => {
    try {
        const { name, city } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof city !== "string" ||
            !city.trim()
        ) {
            return res.status(400).json({
                message: "Facility name and city are required"
            });
        }

        const facility = await Facility.create({
            name: name.trim(),
            city: city.trim()
        });

        res.status(201).json({
            message: "Facility created successfully",
            facility
        });

    } catch (error) {
        next(error);
    }
};


// Update a facility
exports.updateFacility = async (req, res, next) => {
    try {
        const facilityId = req.params.id;
        const { name, city } = req.body;

        if (!mongoose.Types.ObjectId.isValid(facilityId)) {
            return res.status(400).json({
                message: "Invalid facility ID"
            });
        }

        if (
            (name !== undefined &&
                (typeof name !== "string" || !name.trim())) ||
            (city !== undefined &&
                (typeof city !== "string" || !city.trim()))
        ) {
            return res.status(400).json({
                message: "Facility name and city cannot be empty"
            });
        }

        const facility = await Facility.findById(facilityId);

        if (!facility) {
            return res.status(404).json({
                message: "Facility not found"
            });
        }

        if (name !== undefined) {
            facility.name = name.trim();
        }

        if (city !== undefined) {
            facility.city = city.trim();
        }

        await facility.save();

        res.status(200).json({
            message: "Facility updated successfully",
            facility
        });

    } catch (error) {
        next(error);
    }
};


// Delete a facility
exports.deleteFacility = async (req, res, next) => {
    try {
        const facilityId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(facilityId)) {
            return res.status(400).json({
                message: "Invalid facility ID"
            });
        }

        const facility = await Facility.findById(facilityId);

        if (!facility) {
            return res.status(404).json({
                message: "Facility not found"
            });
        }

        // Do not delete a facility assigned to users
        const assignedUsers = await User.exists({
            facility: facilityId
        });

        if (assignedUsers) {
            return res.status(400).json({
                message: "Cannot delete a facility that has assigned users"
            });
        }

        // Do not delete a facility that owns medicine batches
        const existingMedicines = await Medicine.exists({
            facility: facilityId
        });

        if (existingMedicines) {
            return res.status(400).json({
                message: "Cannot delete a facility that has medicine batches"
            });
        }

        await Facility.findByIdAndDelete(facilityId);

        res.status(200).json({
            message: "Facility deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};
