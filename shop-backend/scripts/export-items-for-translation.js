
require("dotenv").config();

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const exportItems = async () => {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();

        const db = client.db("shopDB");

        const items = await db.collection("items")
            .find(
                {},
                {
                    projection: {
                        name: 1,
                        description: 1
                    }
                }
            )
            .sort({ _id: 1 })
            .toArray();

        const content = items.map((item, index) => {
            return [
                `Product Number: ${index + 1}`,
                `ID: ${item._id}`,
                `English Name: ${item.name}`,
                `English Description: ${item.description}`,
                "----------------------------------------"
            ].join("\n");
        }).join("\n\n");

        const filePath = path.join(
            __dirname,
            "items-translation-source.txt"
        );

        fs.writeFileSync(filePath, content, "utf8");

        console.log("Export completed successfully!");
        console.log(`Total products: ${items.length}`);
        console.log(`File created: ${filePath}`);

    } catch (error) {
        console.error("Export Error:", error.message);
    } finally {
        await client.close();
    }
};

exportItems();
