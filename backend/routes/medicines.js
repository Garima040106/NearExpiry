const express = require("express");

const router = express.Router();

const {
    getMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine
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

module.exports = router;
