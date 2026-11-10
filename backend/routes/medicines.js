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
router.get("/", verifyToken, getMedicines);

// Add medicine batch
router.post("/", verifyToken, requireRole("staff"), addMedicine);

// Update medicine batch
router.put("/:id", verifyToken, requireRole("staff"), updateMedicine);

// Delete medicine batch
router.delete("/:id", verifyToken, requireRole("staff"), deleteMedicine);

// Set surplus quantity
router.patch(
    "/:id/surplus",
    verifyToken,
    requireRole("staff"),
    setSurplus
);

// Browse surplus from other facilities
router.get(
    "/surplus",
    verifyToken,
    getSurplus
);

module.exports = router;
