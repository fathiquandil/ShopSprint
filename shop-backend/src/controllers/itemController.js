
const mongoose = require("mongoose");
const Item = require("../models/itemModel");
const Category = require("../models/categoryModel");

// Check if the request belongs to an authenticated manager
const isManager = (req) => {
    return req.manager && req.manager.role === "manager";
};

// Validate bilingual text
const isValidBilingualText = (value) => {
    return (
        value &&
        typeof value.en === "string" &&
        value.en.trim() &&
        typeof value.ar === "string" &&
        value.ar.trim()
    );
};

// Get all items
const getItems = async (req, res) => {
    try {
        let query = Item.find().populate("category", "name description");

        // Hide quantity from public users
        if (!isManager(req)) {
            query = query.select("-quantity");
        }

        const items = await query;

        res.status(200).json(items);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch items"
        });
    }
};

// Get one item
const getItemById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid item ID"
            });
        }

        let query = Item.findById(req.params.id)
            .populate("category", "name description");

        // Hide quantity from public users
        if (!isManager(req)) {
            query = query.select("-quantity");
        }

        const item = await query;

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        res.status(200).json(item);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch item"
        });
    }
};

// Create item
const createItem = async (req, res) => {
    try {
        const { name, description, price, quantity, category, image } = req.body;

        if (
            !isValidBilingualText(name) ||
            !isValidBilingualText(description) ||
            price == null ||
            quantity == null ||
            !category ||
            typeof image !== "string" ||
            !image.trim()
        ) {
            return res.status(400).json({
                message: "All fields are required in English and Arabic"
            });
        }

        if (
            !Number.isFinite(Number(price)) ||
            !Number.isFinite(Number(quantity)) ||
            Number(price) < 0 ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                message: "Price and quantity must be valid non-negative numbers"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        const categoryExists = await Category.findById(category);

        if (!categoryExists) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const item = await Item.create({
            name: {
                en: name.en.trim(),
                ar: name.ar.trim()
            },
            description: {
                en: description.en.trim(),
                ar: description.ar.trim()
            },
            price: Number(price),
            quantity: Number(quantity),
            category,
            image: image.trim()
        });

        await item.populate("category", "name description");

        res.status(201).json({
            message: "Item created successfully",
            item
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create item",
            error: error.message
        });
    }
};

// Update item
const updateItem = async (req, res) => {
    try {
        const { name, description, price, quantity, category, image } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid item ID"
            });
        }

        if (name !== undefined && !isValidBilingualText(name)) {
            return res.status(400).json({
                message: "Name is required in English and Arabic"
            });
        }

        if (description !== undefined && !isValidBilingualText(description)) {
            return res.status(400).json({
                message: "Description is required in English and Arabic"
            });
        }

        if (price != null && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
            return res.status(400).json({
                message: "Price must be a valid non-negative number"
            });
        }

        if (quantity != null && (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)) {
            return res.status(400).json({
                message: "Quantity must be a valid non-negative number"
            });
        }

        if (category !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    message: "Invalid category ID"
                });
            }

            const categoryExists = await Category.findById(category);

            if (!categoryExists) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }
        }

        const updates = {};

        if (name !== undefined) {
            updates.name = {
                en: name.en.trim(),
                ar: name.ar.trim()
            };
        }

        if (description !== undefined) {
            updates.description = {
                en: description.en.trim(),
                ar: description.ar.trim()
            };
        }

        if (price !== undefined) updates.price = Number(price);
        if (quantity !== undefined) updates.quantity = Number(quantity);
        if (category !== undefined) updates.category = category;

        if (image !== undefined) {
            if (typeof image !== "string" || !image.trim()) {
                return res.status(400).json({
                    message: "Image must be a valid non-empty string"
                });
            }

            updates.image = image.trim();
        }

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        ).populate("category", "name description");

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        res.status(200).json({
            message: "Item updated successfully",
            item
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update item",
            error: error.message
        });
    }
};

// Delete item
const deleteItem = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid item ID"
            });
        }

        const item = await Item.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        res.status(200).json({
            message: "Item deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete item"
        });
    }
};

module.exports = {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem
};
