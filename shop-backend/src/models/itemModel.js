
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

// Item schema
const itemSchema = new mongoose.Schema({
    name: {
        type: bilingualTextSchema,
        required: true
    },
    description: {
        type: bilingualTextSchema,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }
}, { timestamps: true });

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
