
const express = require("express");

const router = express.Router();

const {
    getUsers,
    updateUser,
    deleteUser,
    getFacilities,
    createFacility,
    updateFacility,
    deleteFacility
} = require("../controllers/adminController");

const {
    verifyToken,
    requireRole
} = require("../middleware/auth");

// All routes in this file require an admin
router.use(verifyToken, requireRole("admin"));

// User management
router.get("/admin/users", getUsers);
router.put("/admin/users/:id", updateUser);
router.delete("/admin/users/:id", deleteUser);

// Facility management
router.get("/admin/facilities", getFacilities);
router.post("/admin/facilities", createFacility);
router.put("/admin/facilities/:id", updateFacility);
router.delete("/admin/facilities/:id", deleteFacility);

module.exports = router;
