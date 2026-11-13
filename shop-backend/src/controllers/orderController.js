
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Item = require("../models/itemModel");
const sendEmail = require("../services/emailService");

// Create order (Guest Checkout)
const createOrder = async (req, res) => {
    try {
        const {
            customer,
            address,
            items,
            notes,
            paymentMethod = "cash_on_delivery"
        } = req.body;

        // Validate required customer and order data
        if (
            !customer ||
            !customer.name?.trim() ||
            !customer.phone?.trim() ||
            !address ||
            !address.city?.trim() ||
            !address.street?.trim() ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message: "Customer details, address and order items are required"
            });
        }

        // Validate payment method
        if (!["cash_on_delivery", "stripe"].includes(paymentMethod)) {
            return res.status(400).json({
                message: "Invalid payment method"
            });
        }

        const orderItems = [];
        let totalPrice = 0;

        // Validate items and calculate total price on backend
        for (const orderItem of items) {
            if (!mongoose.Types.ObjectId.isValid(orderItem.item)) {
                return res.status(400).json({
                    message: "Invalid item ID"
                });
            }

            const quantity = Number(orderItem.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                    message: "Invalid item quantity"
                });
            }

            const item = await Item.findById(orderItem.item);

            if (!item) {
                return res.status(404).json({
                    message: "One of the items was not found"
                });
            }

            if (item.quantity < quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${item.name.en}`
                });
            }

            orderItems.push({
                item: item._id,
                name: {
                    en: item.name.en,
                    ar: item.name.ar
                },
                image: item.image,
                quantity,
                price: item.price
            });

            totalPrice += item.price * quantity;
        }

        // Create order
        const order = await Order.create({
            customer: {
                name: customer.name.trim(),
                email: customer.email || "",
                phone: customer.phone.trim()
            },
            address: {
                city: address.city.trim(),
                street: address.street.trim(),
                details: address.details || ""
            },
            items: orderItems,
            totalPrice,
            notes: notes || "",
            paymentMethod,
            paymentStatus: paymentMethod === "stripe" ? "pending" : "unpaid",
            status: "pending"
        });

        // Send order confirmation email in English
        if (order.customer.email) {
            try {
                const itemsHtml = order.items.map(item => `
                    <tr>
                        <td>${item.name.en}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price} EGP</td>
                    </tr>
                `).join("");

                await sendEmail({
                    to: order.customer.email,
                    subject: "ShopSprint - Order Confirmation",
                    html: `
                        <div style="font-family: Arial; padding: 25px;">
                            <h1 style="color: #2563eb;">
                                Thank you for your order!
                            </h1>

                            <p>Hello ${order.customer.name},</p>
                            <p>Your order has been created successfully.</p>

                            <h3>Order Details</h3>
                            <p>Order ID: ${order._id}</p>

                            <table border="1" cellpadding="10" cellspacing="0">
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                </tr>
                                ${itemsHtml}
                            </table>

                            <h3>Total: ${order.totalPrice} EGP</h3>
                            <p>Payment Method: ${order.paymentMethod}</p>
                            <p>Order Status: ${order.status}</p>

                            <p>Thank you for shopping with ShopSprint!</p>
                        </div>
                    `
                });

            } catch (emailError) {
                console.error(
                    "Order Confirmation Email Error:",
                    emailError.message
                );
            }
        }

        res.status(201).json({
            message: "Order created successfully",
            order
        });

    } catch (error) {
        console.error("Create Order Error:", error);

        res.status(500).json({
            message: "Failed to create order",
            error: error.message
        });
    }
};


// Get all orders (Manager only)
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("items.item", "name price image")
            .sort({ createdAt: -1 });

        res.status(200).json(orders);

    } catch (error) {
        console.error("Get Orders Error:", error);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }
};


// Get one order (Manager only)
const getOrderById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id)
            .populate("items.item", "name price image");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json(order);

    } catch (error) {
        console.error("Get Order Error:", error);

        res.status(500).json({
            message: "Failed to fetch order"
        });
    }
};


// Update order status (Manager only)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const allowedTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["processing", "cancelled"],
            processing: ["shipped", "cancelled"],
            shipped: ["delivered", "cancelled"],
            delivered: [],
            cancelled: []
        };

        if (!Object.keys(allowedTransitions).includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Prevent confirming unpaid Stripe orders
        if (
            status === "confirmed" &&
            order.paymentMethod === "stripe" &&
            order.paymentStatus !== "paid"
        ) {
            return res.status(400).json({
                message: "Cannot confirm this order before successful payment"
            });
        }

        if (!allowedTransitions[order.status].includes(status)) {
            return res.status(400).json({
                message: `Cannot change order status from ${order.status} to ${status}`
            });
        }

        // Confirm order: deduct stock
        if (status === "confirmed") {
            const updatedItems = [];

            for (const orderItem of order.items) {
                const updatedItem = await Item.findOneAndUpdate(
                    {
                        _id: orderItem.item,
                        quantity: { $gte: orderItem.quantity }
                    },
                    {
                        $inc: { quantity: -orderItem.quantity }
                    },
                    { new: true }
                );

                if (!updatedItem) {
                    // Restore stock deducted during this attempt
                    for (const previousItem of updatedItems) {
                        await Item.findByIdAndUpdate(previousItem.id, {
                            $inc: { quantity: previousItem.quantity }
                        });
                    }

                    return res.status(400).json({
                        message: `Not enough stock for ${orderItem.name.en}`
                    });
                }

                updatedItems.push({
                    id: orderItem.item,
                    quantity: orderItem.quantity
                });
            }
        }

        // Cancel order: restore stock if it was already deducted
        if (status === "cancelled" && order.status !== "pending") {
            for (const orderItem of order.items) {
                await Item.findByIdAndUpdate(orderItem.item, {
                    $inc: { quantity: orderItem.quantity }
                });
            }
        }

        const previousStatus = order.status;

        order.status = status;
        await order.save();

        // Send order status update email
        if (order.customer.email) {
            try {
                const statusMessages = {
                    confirmed: "Your order has been confirmed.",
                    processing: "Your order is now being prepared.",
                    shipped: "Your order has been shipped.",
                    delivered: "Your order has been delivered successfully.",
                    cancelled: "Your order has been cancelled."
                };

                await sendEmail({
                    to: order.customer.email,
                    subject: `ShopSprint - Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    html: `
                        <div style="font-family: Arial; padding: 25px;">
                            <h1 style="color: #2563eb;">
                                Order Status Updated
                            </h1>

                            <p>Hello ${order.customer.name},</p>

                            <p>
                                The status of your order has been updated.
                            </p>

                            <h3>Order Details</h3>

                            <p>Order ID: ${order._id}</p>
                            <p>Previous Status: ${previousStatus}</p>
                            <p>New Status: ${status}</p>

                            <p>${statusMessages[status] || "Your order status has changed."}</p>

                            <h3>Total: ${order.totalPrice} EGP</h3>

                            <p>Thank you for shopping with ShopSprint!</p>
                        </div>
                    `
                });

            } catch (emailError) {
                console.error(
                    "Order Status Email Error:",
                    emailError.message
                );
            }
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);

        res.status(500).json({
            message: "Failed to update order status",
            error: error.message
        });
    }
};


module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};
