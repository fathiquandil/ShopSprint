
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const Manager = require("./models/managerModel");

const seedManager = async () => {
    try {
        await connectDB();

        // Check if a manager already exists
        const existingManager = await Manager.findOne();

        if (existingManager) {
            console.log("Manager already exists");
            return;
        }

        const username = process.env.MANAGER_USERNAME;
        const password = process.env.MANAGER_PASSWORD;

        if (!username || !password) {
            throw new Error("Manager credentials are missing from .env");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create manager
        await Manager.create({
            username,
            password: hashedPassword
        });

        console.log("Manager created successfully");

    } catch (error) {
        console.error("Manager seed failed:", error.message);

    } finally {
        await mongoose.disconnect();
    }
};

seedManager();
