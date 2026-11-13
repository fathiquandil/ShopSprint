const mongoose = require("mongoose");
require("dotenv").config();

async function migrateOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const ordersCollection = db.collection("orders");
    const itemsCollection = db.collection("items");

    const orders = await ordersCollection.find({}).toArray();
    const products = await itemsCollection.find({}).toArray();

    const productsMap = new Map(
      products.map(product => [product.name.en, product.name])
    );

    const operations = [];

    for (const order of orders) {
      const updatedItems = [];

      for (const orderItem of order.items || []) {
        if (
          typeof orderItem.name === "object" &&
          orderItem.name?.en &&
          orderItem.name?.ar
        ) {
          updatedItems.push(orderItem);
          continue;
        }

        const translatedName = productsMap.get(orderItem.name);

        if (!translatedName) {
          throw new Error(
            `Product translation not found: ${orderItem.name}`
          );
        }

        updatedItems.push({
          ...orderItem,
          name: {
            en: translatedName.en,
            ar: translatedName.ar
          }
        });
      }

      operations.push({
        updateOne: {
          filter: { _id: order._id },
          update: {
            $set: { items: updatedItems }
          }
        }
      });
    }

    if (operations.length > 0) {
      const result = await ordersCollection.bulkWrite(operations);

      console.log("Orders migration completed!");
      console.log("Matched:", result.matchedCount);
      console.log("Modified:", result.modifiedCount);
    }

  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
}

migrateOrders();
