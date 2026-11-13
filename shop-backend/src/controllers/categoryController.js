
const Category = require("../models/categoryModel");
const Item = require("../models/itemModel");

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ "name.en": 1 });

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get categories",
            error: error.message
        });
    }
};

// Create category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name?.en?.trim() || !name?.ar?.trim()) {
            return res.status(400).json({
                message: "Category name is required in English and Arabic"
            });
        }

        if (!description?.en?.trim() || !description?.ar?.trim()) {
            return res.status(400).json({
                message: "Category description is required in English and Arabic"
            });
        }

        const existingCategory = await Category.findOne({
            $or: [
                { "name.en": name.en.trim() },
                { "name.ar": name.ar.trim() }
            ]
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name: {
                en: name.en.trim(),
                ar: name.ar.trim()
            },
            description: {
                en: description.en.trim(),
                ar: description.ar.trim()
            }
        });

        res.status(201).json({
            message: "Category created successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create category",
            error: error.message
        });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name?.en?.trim() || !name?.ar?.trim()) {
            return res.status(400).json({
                message: "Category name is required in English and Arabic"
            });
        }

        if (!description?.en?.trim() || !description?.ar?.trim()) {
            return res.status(400).json({
                message: "Category description is required in English and Arabic"
            });
        }

        const existingCategory = await Category.findOne({
            _id: { $ne: id },
            $or: [
                { "name.en": name.en.trim() },
                { "name.ar": name.ar.trim() }
            ]
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Another category already uses this name"
            });
        }

        const category = await Category.findByIdAndUpdate(
            id,
            {
                name: {
                    en: name.en.trim(),
                    ar: name.ar.trim()
                },
                description: {
                    en: description.en.trim(),
                    ar: description.ar.trim()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update category",
            error: error.message
        });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const items = await Item.findOne({ category: id });

        if (items) {
            return res.status(400).json({
                message: "Cannot delete category because it contains items"
            });
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({
            message: "Category deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete category",
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
