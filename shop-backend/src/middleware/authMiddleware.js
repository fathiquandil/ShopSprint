const jwt = require("jsonwebtoken");
const Manager = require("../models/managerModel");

// Protect manager routes
const protectManager = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. No token provided."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Authentication configuration error."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "manager" || !decoded.id) {
            return res.status(403).json({
                message: "Access denied. Manager only."
            });
        }

        const manager = await Manager.findById(decoded.id);

        if (!manager || manager.isActive === false) {
            return res.status(401).json({
                message: "Manager account is unavailable."
            });
        }

        req.manager = {
            id: manager._id,
            role: "manager",
            username: manager.username
        };

        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Invalid or expired token."
            });
        }

        return res.status(500).json({
            message: "Authentication failed."
        });
    }
};

// Optional manager authentication
const optionalManager = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        return protectManager(req, res, next);

    } catch (error) {
        return res.status(500).json({
            message: "Authentication failed."
        });
    }
};

module.exports = protectManager;
module.exports.optionalManager = optionalManager;