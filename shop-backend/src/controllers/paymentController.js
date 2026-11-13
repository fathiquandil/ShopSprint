
const stripe = require("../config/stripe");
const Order = require("../models/orderModel");
const mongoose = require("mongoose");
const sendEmail = require("../services/emailService");


// Create Stripe Embedded Checkout Session
const createCheckoutSession = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Validate Order ID
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid or missing order ID"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.paymentMethod !== "stripe") {
            return res.status(400).json({
                message: "This order does not use Stripe payment"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                message: "Cannot create payment session for a cancelled order"
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                message: "This order has already been paid"
            });
        }

        let previousSessionId = null;

        // Check Existing Session
        if (order.stripeDetails.sessionId) {
            const existingSession =
                await stripe.checkout.sessions.retrieve(
                    order.stripeDetails.sessionId
                );

            if (
                existingSession.status === "open" &&
                existingSession.ui_mode === "embedded_page"
            ) {
                return res.status(200).json({
                    message: "Existing checkout session returned",
                    sessionId: existingSession.id,
                    clientSecret: existingSession.client_secret
                });
            }

            if (existingSession.status === "complete") {
                return res.status(409).json({
                    message: "Payment session completed. Waiting for payment confirmation."
                });
            }

            previousSessionId = existingSession.id;
        }

        // Generate a stable key for this payment attempt
        const idempotencyKey = previousSessionId
            ? `order-${order._id}-retry-${previousSessionId}`
            : `order-${order._id}-initial`;

        // Create Embedded Checkout Session
        const session = await stripe.checkout.sessions.create(
            {
                ui_mode: "embedded_page",

                mode: "payment",

                line_items: order.items.map((item) => ({
                    price_data: {
                        currency: process.env.STRIPE_CURRENCY || "egp",

                        product_data: {
                            name: item.name.en,
                            images: item.image?.startsWith("https://")
                                ? [item.image]
                                : []
                        },

                        unit_amount: Math.round(item.price * 100)
                    },

                    quantity: item.quantity
                })),

                return_url:
                    `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

                metadata: {
                    orderId: order._id.toString()
                }
            },
            {
                idempotencyKey
            }
        );

        // Save Stripe Session Details
        order.stripeDetails.sessionId = session.id;
        order.paymentStatus = "pending";

        await order.save();

        return res.status(200).json({
            message: "Embedded checkout session created successfully",
            sessionId: session.id,
            clientSecret: session.client_secret
        });

    } catch (error) {
        console.error("Create Checkout Session Error:", error);

        return res.status(500).json({
            message: "Failed to create checkout session",
            error: error.message
        });
    }
};



// Handle Stripe Webhook
const handleStripeWebhook = async (req, res) => {
    let event;

    // Verify Stripe webhook signature
    try {
        const signature = req.headers["stripe-signature"];

        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {
        console.error("Webhook Signature Error:", error.message);

        return res.status(400).send("Invalid webhook signature");
    }

    try {
        // Handle successful payment
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            if (session.payment_status !== "paid") {
                return res.status(200).json({
                    received: true,
                    message: "Payment is not completed yet"
                });
            }

            const orderId = session.metadata?.orderId;

            if (!orderId) {
                return res.status(400).json({
                    message: "Order ID is missing from Stripe session"
                });
            }

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            // Make sure this session belongs to this order
            if (order.stripeDetails.sessionId !== session.id) {
                return res.status(200).json({
                    received: true,
                    message: "Session does not match the current order session"
                });
            }

            // Process payment only once
            if (order.paymentStatus !== "paid") {
                order.paymentStatus = "paid";

                order.stripeDetails.paymentIntentId =
                    session.payment_intent || null;

                await order.save();

                // Send payment confirmation email
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
                            subject: "ShopSprint - Payment Confirmation",
                            html: `
                                <div style="font-family: Arial; padding: 25px;">
                                    <h1 style="color: #16a34a;">
                                        Payment Successful!
                                    </h1>

                                    <p>Hello ${order.customer.name},</p>

                                    <p>
                                        Your payment has been received successfully.
                                    </p>

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

                                    <h3>Total Paid: ${order.totalPrice} EGP</h3>

                                    <p>Payment Status: Paid</p>
                                    <p>Order Status: ${order.status}</p>

                                    <p>
                                        Thank you for shopping with ShopSprint!
                                    </p>
                                </div>
                            `
                        });

                    } catch (emailError) {
                        console.error(
                            "Payment Confirmation Email Error:",
                            emailError.message
                        );
                    }
                }
            }
        }

        // Handle expired Checkout Session
        else if (event.type === "checkout.session.expired") {
            const session = event.data.object;
            const orderId = session.metadata?.orderId;

            if (!orderId) {
                return res.status(200).json({
                    received: true,
                    message: "Order ID is missing from expired session"
                });
            }

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(200).json({
                    received: true,
                    message: "Order not found"
                });
            }

            // Make sure this is still the current session
            if (order.stripeDetails.sessionId !== session.id) {
                return res.status(200).json({
                    received: true,
                    message: "Expired session does not match current session"
                });
            }

            // Never change a successfully paid order back to unpaid
            if (order.paymentStatus !== "paid") {
                order.paymentStatus = "unpaid";
                await order.save();
            }
        }

        res.status(200).json({
            received: true
        });

    } catch (error) {
        console.error("Stripe Webhook Error:", error);

        res.status(500).json({
            message: "Webhook processing failed"
        });
    }
};


// Verify Stripe Checkout Session
const verifyCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId || !sessionId.startsWith("cs_")) {
            return res.status(400).json({
                message: "Invalid checkout session ID"
            });
        }

        // Retrieve the real session directly from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (
            session.status !== "complete" ||
            session.payment_status !== "paid"
        ) {
            return res.status(400).json({
                message: "Payment has not been completed",
                paid: false
            });
        }

        const orderId = session.metadata?.orderId;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid order information"
            });
        }

        const order = await Order.findById(orderId);

        if (!order || order.paymentMethod !== "stripe") {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Verify that this session belongs to the current order
        if (order.stripeDetails.sessionId !== session.id) {
            return res.status(400).json({
                message: "Session does not match this order"
            });
        }

        // Confirm the payment in the database as well
        if (order.paymentStatus !== "paid") {
            order.paymentStatus = "paid";
            order.stripeDetails.paymentIntentId =
                session.payment_intent || null;

            await order.save();
        }

        return res.status(200).json({
            paid: true,
            orderId: order._id,
            items: order.items.map(orderItem => ({
                itemId: orderItem.item.toString(),
                quantity: orderItem.quantity
            }))
        });

    } catch (error) {
        console.error("Verify Checkout Session Error:", error);

        return res.status(500).json({
            message: "Failed to verify payment"
        });
    }
};

module.exports = {
    createCheckoutSession,
    handleStripeWebhook,
    verifyCheckoutSession
};