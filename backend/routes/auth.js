const express = require("express");

const router = express.Router();

const {
    register,
    login,
    getFacilities
} = require("../controllers/authController");

// Authentication routes
router.post("/auth/register", register);
router.post("/auth/login", login);

// Facility list for registration form
router.get("/facilities", getFacilities);

module.exports = router;
