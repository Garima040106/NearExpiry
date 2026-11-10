const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Facility = require("../models/Facility");


// Register a new user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, facility } = req.body;

        // Check required fields
        if (!name || !email || !password || !role || !facility) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Invalid email address"
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters"
            });
        }

        // Only staff and pharmacists can register publicly
        if (!["staff", "pharmacist"].includes(role)) {
            return res.status(403).json({
                message: "This role cannot be registered publicly"
            });
        }

        // Validate facility ID
        if (!mongoose.Types.ObjectId.isValid(facility)) {
            return res.status(400).json({
                message: "Invalid facility ID"
            });
        }

        // Check whether facility exists
        const existingFacility = await Facility.findById(facility);

        if (!existingFacility) {
            return res.status(400).json({
                message: "Facility not found"
            });
        }

        // Check whether email is already registered
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role,
            facility
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facility: user.facility
            }
        });

    } catch (error) {
        // Handle duplicate email race condition
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        next(error);
    }
};


// Login an existing user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Retrieve user and explicitly include password
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare entered password with stored hash
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facility: user.facility
            }
        });

    } catch (error) {
        next(error);
    }
};


// Get available facilities for registration
exports.getFacilities = async (req, res, next) => {
    try {
        const facilities = await Facility.find()
            .select("name city")
            .sort({ name: 1 });

        res.status(200).json(facilities);

    } catch (error) {
        next(error);
    }
};
