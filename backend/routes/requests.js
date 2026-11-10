
const express = require("express");

const router = express.Router();

const {
    createRequest,
    getRequests
} = require("../controllers/requestController");

const {
    verifyToken,
    requireRole
} = require("../middleware/auth");

// Send a medicine request (staff only)
router.post(
    "/requests",
    verifyToken,
    requireRole("staff"),
    createRequest
);

// View sent and received requests (authenticated users)
router.get(
    "/requests",
    verifyToken,
    getRequests
);

module.exports = router;
