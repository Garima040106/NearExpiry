
const app = require("../backend/server");
const connectDB = require("../backend/config/db");

let connectionPromise = null;

module.exports = async (req, res) => {
    try {
        if (!connectionPromise) {
            connectionPromise = connectDB().catch(error => {
                connectionPromise = null;
                throw error;
            });
        }

        await connectionPromise;

        return app(req, res);

    } catch (error) {
        console.error("Vercel API error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

