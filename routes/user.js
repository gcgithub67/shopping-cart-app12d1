const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");
const profileController = require("../controllers/profileController");

// User Dashboard Route
router.get("/dashboard", authenticate, dashboardController.getDashboard);

// New Profile Routes
router.get("/profile/edit", authenticate, profileController.getEditProfile);
router.post("/profile/edit", authenticate, profileController.updateProfile);
router.post("/profile/password", authenticate, profileController.updatePassword);
module.exports = router;







