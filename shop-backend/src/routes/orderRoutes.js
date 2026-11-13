
const express = require("express");
const router = express.Router();

const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");

const {
    createCheckoutSession,
    verifyCheckoutSession
} = require("../controllers/paymentController");

const protectManager = require("../middleware/authMiddleware");

// Guest checkout
router.post("/", createOrder);

// Stripe Checkout
router.post("/checkout-session", createCheckoutSession);

// Verify successful Stripe payment
router.get("/verify-payment/:sessionId", verifyCheckoutSession);

// Manager only
router.get("/", protectManager, getOrders);
router.get("/:id", protectManager, getOrderById);
router.patch("/:id/status", protectManager, updateOrderStatus);

module.exports = router;
