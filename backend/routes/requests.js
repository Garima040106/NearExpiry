
const express = require("express");

const router = express.Router();

const {
    createRequest,
    getRequests,
    decide
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

// Approve or reject a request (pharmacist only)
router.patch(
    "/requests/:id/decision",
    verifyToken,
    requireRole("pharmacist"),
    decide
);

module.exports = router;
