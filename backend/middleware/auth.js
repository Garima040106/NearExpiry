const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify the JWT token
exports.verifyToken = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";

        const token = header.startsWith("Bearer ")
            ? header.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({
                message: "Login required"
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(payload.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};


// Check whether the logged-in user has the required role
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Not allowed for this role"
            });
        }

        next();
    };
};

