
const express = require("express");

const router = express.Router();

const { getDashboard } = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/auth");

// Get dashboard summary for the authenticated user
router.get(
    "/dashboard",
    verifyToken,
    getDashboard
);

module.exports = router;
