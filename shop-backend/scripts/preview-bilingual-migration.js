
require("dotenv").config();
const mongoose = require("mongoose");

// Arabic translations for the 8 existing categories
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

const previewMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "shopDB"
        });

        console.log("Connected to shopDB successfully");

        const categories = await mongoose.connection.db
            .collection("categories")
            .find({})
            .toArray();

        console.log("\n========== CATEGORY MIGRATION PREVIEW ==========");

        for (const category of categories) {
            const translation = categoryTranslations[category.name];

            if (!translation) {
                console.log("\nMissing translation for:", category.name);
                continue;
            }

            console.log({
                _id: category._id,
                name: {
                    en: category.name,
                    ar: translation.name
                },
                description: {
                    en: category.description || "",
                    ar: translation.description
                }
            });
        }

        console.log("\nTotal categories:", categories.length);
        console.log("No database changes were made.");

    } catch (error) {
        console.error("Migration preview failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

previewMigration();
