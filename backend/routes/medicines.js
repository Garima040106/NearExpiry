
const express = require("express");

const router = express.Router();

const {
    getMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    setSurplus,
    getSurplus
} = require("../controllers/medicineController");

const {
    verifyToken,
    requireRole
} = require("../middleware/auth");

// View medicine batches
router.get("/medicines", verifyToken, getMedicines);

// Add medicine batch
router.post(
    "/medicines",
    verifyToken,
    requireRole("staff"),
    addMedicine
);

// Update medicine batch
router.put(
    "/medicines/:id",
    verifyToken,
    requireRole("staff"),
    updateMedicine
);

// Delete medicine batch
router.delete(
    "/medicines/:id",
    verifyToken,
    requireRole("staff"),
    deleteMedicine
);

// Set surplus quantity
router.patch(
    "/medicines/:id/surplus",
    verifyToken,
    requireRole("staff"),
    setSurplus
);

// Browse surplus from other facilities
router.get("/surplus", verifyToken, getSurplus);

module.exports = router;
