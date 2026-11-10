
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const medicineRoutes = require("./routes/medicines");
const requestRoutes = require("./routes/requests");
const auditRoutes = require("./routes/audit");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");

const sanitize = require("./middleware/sanitize");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

// CORS configuration
// CORS configuration
app.use(cors());

// Parse incoming request data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize incoming request data
app.use(sanitize);

// Serve frontend files
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        message: "NearExpiry API is running"
    });
});

// Authentication and facility routes
app.use("/api", authRoutes);

// Medicine inventory and surplus routes
app.use("/api", medicineRoutes);

// Medicine request routes
app.use("/api", requestRoutes);

// Audit trail routes
app.use("/api", auditRoutes);

// Dashboard routes
app.use("/api", dashboardRoutes);

// Admin management routes
app.use("/api", adminRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});

// Central error handler
app.use(errorHandler);

// Start the local server only when this file is run directly
if (require.main === module) {
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
}

module.exports = app;