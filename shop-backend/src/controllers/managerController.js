const Manager = require("../models/managerModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Manager login
const loginManager = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const manager = await Manager.findOne({ username });
if (!manager || manager.isActive === false) {
    return res.status(401).json({
        message: "Invalid username or password"
    });
}

        const passwordMatch = await bcrypt.compare(
            password,
            manager.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            { id: manager._id, role: "manager" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            manager: {
                id: manager._id,
                username: manager.username
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginManager
};