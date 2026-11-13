
const express = require("express");
const router = express.Router();

const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const protectManager = require("../middleware/authMiddleware");

// Public
router.get("/", getCategories);

// Manager only
router.post("/", protectManager, createCategory);
router.put("/:id", protectManager, updateCategory);
router.delete("/:id", protectManager, deleteCategory);

module.exports = router;
