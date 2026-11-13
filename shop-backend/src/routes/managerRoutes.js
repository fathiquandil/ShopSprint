
const express = require("express");
const router = express.Router();

const {
    loginManager
} = require("../controllers/managerController");

const protectManager = require("../middleware/authMiddleware");

// Public route
router.post("/login", loginManager);

// Protected route for testing
router.get("/profile", protectManager, (req, res) => {
    res.status(200).json({
        message: "Manager authenticated successfully",
        manager: req.manager
    });
});

module.exports = router;
