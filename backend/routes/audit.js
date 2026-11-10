
const express = require("express");

const router = express.Router();

const { getAuditLogs } = require("../controllers/auditController");

const {
    verifyToken,
    requireRole
} = require("../middleware/auth");

// View audit trail (pharmacist and admin only)
router.get(
    "/audit",
    verifyToken,
    requireRole("pharmacist", "admin"),
    getAuditLogs
);

module.exports = router;
