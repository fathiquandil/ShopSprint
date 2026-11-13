
const mongoose = require("mongoose");

// Reusable schema for English and Arabic text
const bilingualTextSchema = new mongoose.Schema({
    en: {
        type: String,
        required: true,
        trim: true
    },
    ar: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({

    customer: {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        phone: {
            type: String,
            required: true,
            trim: true
        }
    },

    address: {
        city: {
            type: String,
            required: true,
            trim: true
        },

        street: {
            type: String,
            required: true,
            trim: true
        },

        details: {
            type: String,
            default: ""
        }
    },

    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        name: {
            type: bilingualTextSchema,
            required: true
        },

        image: {
            type: String,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },

    notes: {
        type: String,
        default: ""
    },

    paymentMethod: {
        type: String,
        enum: ["cash_on_delivery", "stripe"],
        default: "cash_on_delivery"
    },

    paymentStatus: {
        type: String,
        enum: ["unpaid", "pending", "paid", "refunded"],
        default: "unpaid"
    },

    stripeDetails: {
        sessionId: {
            type: String,
            default: null
        },

        paymentIntentId: {
            type: String,
            default: null
        }
    },

    status: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ],
        default: "pending"
    }

}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
