
const express = require("express");
const router = express.Router();

const {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem
} = require("../controllers/itemController");

const protectManager = require("../middleware/authMiddleware");
const { optionalManager } = require("../middleware/authMiddleware");

// Public routes with optional manager authentication
router.get("/", optionalManager, getItems);
router.get("/:id", optionalManager, getItemById);

// Manager only routes
router.post("/", protectManager, createItem);
router.put("/:id", protectManager, updateItem);
router.delete("/:id", protectManager, deleteItem);

module.exports = router;
