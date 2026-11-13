
const express = require("express");
const cors = require("cors");

const categoryRoutes = require("./routes/categoryRoutes");
const itemRoutes = require("./routes/itemRoutes");
const orderRoutes = require("./routes/orderRoutes");
const managerRoutes = require("./routes/managerRoutes");

const {
    handleStripeWebhook
} = require("./controllers/paymentController");

const app = express();

app.use(cors());

// Stripe Webhook must come before express.json()
app.post(
    "/api/orders/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

// Parse JSON requests
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
    res.json({
        message: "Shop API is running successfully"
    });
});

// API Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/manager", managerRoutes);

module.exports = app;
