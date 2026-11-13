
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

// Category schema
const categorySchema = new mongoose.Schema({
    name: {
        type: bilingualTextSchema,
        required: true
    },
    description: {
    type: bilingualTextSchema,
    required: true
}
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
