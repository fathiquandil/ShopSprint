
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const translations = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "product-translations.json"),
        "utf8"
      )
    );

    const collection = mongoose.connection.db.collection("items");
    const products = await collection.find({}).toArray();

    if (products.length !== 164) {
      throw new Error("Expected exactly 164 products.");
    }

    if (Object.keys(translations).length !== 164) {
      throw new Error("Expected exactly 164 translations.");
    }

    const operations = [];

    for (const product of products) {
      const id = product._id.toString();
      const translation = translations[id];

      if (!translation) {
        throw new Error(`Missing translation: ${id}`);
      }

      if (
        typeof product.name !== "string" ||
        typeof product.description !== "string"
      ) {
        throw new Error(`Unexpected product format: ${id}`);
      }

      operations.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              name: {
                en: product.name,
                ar: translation.name
              },
              description: {
                en: product.description,
                ar: translation.description
              }
            }
          }
        }
      });
    }

    const result = await collection.bulkWrite(operations);

    console.log("Migration completed successfully!");
    console.log("Matched:", result.matchedCount);
    console.log("Modified:", result.modifiedCount);

    const sample = await collection.findOne({});
    console.log("Sample product after migration:");
    console.log(JSON.stringify({
      name: sample.name,
      description: sample.description
    }, null, 2));

  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

migrateProducts();
