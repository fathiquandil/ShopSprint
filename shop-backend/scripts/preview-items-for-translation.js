
require("dotenv").config();

const { MongoClient } = require("mongodb");

const PAGE_SIZE = 20;
const page = Number(process.argv[2]) || 1;

const previewItems = async () => {
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
                        description: 1,
                        category: 1
                    }
                }
            )
            .sort({ _id: 1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .toArray();

        const total = await db.collection("items").countDocuments();

        console.log(`Total products: ${total}`);
        console.log(`Page: ${page}`);
        console.log(`Products in this page: ${items.length}`);
        console.log("--------------------------------");

        items.forEach((item, index) => {
            console.log({
                number: (page - 1) * PAGE_SIZE + index + 1,
                id: item._id.toString(),
                name: item.name,
                description: item.description,
                categoryId: item.category?.toString()
            });
        });

    } catch (error) {
        console.error("Preview Error:", error.message);
    } finally {
        await client.close();
    }
};

previewItems();
