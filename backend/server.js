require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const sanitize = require("./middleware/sanitize");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5000"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize incoming data
app.use(sanitize);

// Serve frontend files
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

// Basic health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        message: "NearExpiry API is running"
    });
});

// API routes will be mounted here in the next phases

// Handle unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});

// Central error handler
app.use(errorHandler);

// Connect database before starting server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`NearExpiry server running on port ${PORT}`);
            console.log(`Open http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;
