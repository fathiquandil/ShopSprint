
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const Item = require("./models/itemModel");
const Category = require("./models/categoryModel");

dotenv.config({ path: path.join(__dirname, "../.env") });

const categoryMapping = {
    smartphones: "Mobiles & Accessories",
    "mobile-accessories": "Mobiles & Accessories",
    laptops: "Computers & Laptops",
    tablets: "Computers & Laptops",

    "mens-shirts": "Fashion",
    "mens-shoes": "Fashion",
    "mens-watches": "Fashion",
    tops: "Fashion",
    "womens-dresses": "Fashion",
    "womens-shoes": "Fashion",
    "womens-bags": "Fashion",
    "womens-jewellery": "Fashion",
    "womens-watches": "Fashion",
    sunglasses: "Fashion",

    furniture: "Home & Furniture",
    "home-decoration": "Home & Furniture",
    "kitchen-accessories": "Home Appliances",

    "sports-accessories": "Sports & Outdoors",

    motorcycle: "Tools & Equipment",
    vehicle: "Tools & Equipment"
};

const electronicsProducts = [
    {
        name: "Wireless Bluetooth Headphones",
        description: "Wireless headphones with comfortable ear cushions and clear sound.",
        price: 2500,
        quantity: 25,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    },
    {
        name: "Professional Digital Camera",
        description: "Digital camera for high-quality photography.",
        price: 18000,
        quantity: 8,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32"
    },
    {
        name: "Smart LED Monitor",
        description: "High-resolution monitor suitable for work and entertainment.",
        price: 7500,
        quantity: 12,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"
    },
    {
        name: "Portable Bluetooth Speaker",
        description: "Portable wireless speaker with powerful sound.",
        price: 1800,
        quantity: 30,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1"
    },
    {
        name: "Wireless Gaming Controller",
        description: "Wireless controller designed for comfortable gaming.",
        price: 2200,
        quantity: 15,
        image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48"
    },
    {
        name: "Mechanical Gaming Keyboard",
        description: "Mechanical keyboard suitable for gaming and productivity.",
        price: 3200,
        quantity: 20,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3"
    },
    {
        name: "Wireless Computer Mouse",
        description: "Ergonomic wireless mouse for everyday computer use.",
        price: 950,
        quantity: 35,
        image: "https://images.unsplash.com/photo-1527814050087-3793815479db"
    },
    {
        name: "USB-C Charging Hub",
        description: "Multi-port USB-C hub for connecting and charging devices.",
        price: 1400,
        quantity: 18,
        image: "https://images.unsplash.com/photo-1625842268584-8f3296236761"
    }
];

const importProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        const filePath = path.join(__dirname, "../products.json");
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

        const categories = await Category.find();
        const categoryIds = new Map(
            categories.map(category => [category.name, category._id])
        );

        let imported = 0;
        let existing = 0;
        let skipped = 0;

        const saveProduct = async (product) => {
            const result = await Item.updateOne(
                { name: product.name },
                { $setOnInsert: product },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                imported++;
            } else {
                existing++;
            }
        };

        for (const product of fileData.products) {
            const categoryName = categoryMapping[product.category];

            if (!categoryName || !categoryIds.has(categoryName)) {
                skipped++;
                continue;
            }

            const image = product.thumbnail || product.images?.[0];

            if (!image) {
                skipped++;
                continue;
            }

            await saveProduct({
                name: product.title,
                description: product.description,
                price: Math.round(product.price * 50),
                quantity: product.stock,
                category: categoryIds.get(categoryName),
                image
            });
        }

        const electronicsCategoryId = categoryIds.get("Electronics");

        if (electronicsCategoryId) {
            for (const product of electronicsProducts) {
                await saveProduct({
                    ...product,
                    category: electronicsCategoryId
                });
            }
        } else {
            console.log("Electronics category not found");
        }

        console.log("\nImport completed successfully");
        console.log("New products:", imported);
        console.log("Already existing:", existing);
        console.log("Skipped:", skipped);

    } catch (error) {
        console.error("Import failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

importProducts();
