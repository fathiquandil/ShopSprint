
require("dotenv").config();
const mongoose = require("mongoose");

const categoryTranslations = {
    "Electronics": {
        name: "الإلكترونيات",
        description: "الأجهزة الإلكترونية وملحقاتها"
    },
    "Fashion": {
        name: "الأزياء والموضة",
        description: "الملابس والأحذية وإكسسوارات الموضة"
    },
    "Home Appliances": {
        name: "الأجهزة المنزلية",
        description: "الأجهزة المنزلية والكهربائية"
    },
    "Computers & Laptops": {
        name: "الكمبيوتر واللابتوب",
        description: "أجهزة الكمبيوتر واللابتوب وملحقاتها"
    },
    "Mobiles & Accessories": {
        name: "الهواتف المحمولة وإكسسواراتها",
        description: "الهواتف المحمولة وإكسسواراتها"
    },
    "Tools & Equipment": {
        name: "الأدوات والمعدات",
        description: "الأدوات والآلات والمعدات"
    },
    "Home & Furniture": {
        name: "المنزل والأثاث",
        description: "الأثاث وديكورات المنزل"
    },
    "Sports & Outdoors": {
        name: "الرياضة والأنشطة الخارجية",
        description: "المعدات الرياضية ومنتجات الأنشطة الخارجية"
    }
};

const migrateCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "shopDB"
        });

        const collection = mongoose.connection.db.collection("categories");
        const categories = await collection.find({}).toArray();

        // Validate all categories before making any changes
        if (categories.length !== 8) {
            throw new Error(`Expected 8 categories, found ${categories.length}. No changes made.`);
        }

        const operations = [];

        for (const category of categories) {
            if (typeof category.name !== "string") {
                throw new Error(`Unexpected name format for category ${category._id}. No changes made.`);
            }

            const translation = categoryTranslations[category.name];

            if (!translation) {
                throw new Error(`Missing Arabic translation for ${category.name}. No changes made.`);
            }

            operations.push({
                updateOne: {
                    filter: { _id: category._id },
                    update: {
                        $set: {
                            name: {
                                en: category.name,
                                ar: translation.name
                            },
                            description: {
                                en: category.description || "",
                                ar: translation.description
                            }
                        }
                    }
                }
            });
        }

        // Apply all category updates
        const result = await collection.bulkWrite(operations);

        console.log("Category migration completed successfully.");
        console.log("Matched:", result.matchedCount);
        console.log("Modified:", result.modifiedCount);

        const updatedCategories = await collection.find({}).toArray();

        console.log("\nUpdated categories:");
        updatedCategories.forEach(category => {
            console.log(category.name.en, "|", category.name.ar);
        });

    } catch (error) {
        console.error("Category migration failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

migrateCategories();
