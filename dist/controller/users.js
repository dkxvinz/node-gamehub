"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const dbconnect_1 = __importDefault(require("../src/db/dbconnect"));
const auth_middleware_1 = require("../src/middleware/auth_middleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'GameHub123';
exports.router.get("/", async (req, res) => {
    try {
        const [rows] = await dbconnect_1.default.query('SELECT * FROM users');
        res.status(200).json(rows);
        console.log("on database: ", rows);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});
exports.router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const sql = "INSERT INTO users(username, email, password, role) VALUES (?, ?, ?, ?)";
        const values = [username, email, hashedPassword, 1]; // ใช้ 'user' แทน 1
        const [result] = await dbconnect_1.default.query(sql, values);
        const header = result;
        console.log("welcome: ", values);
        return res.status(201).json({
            message: "Register successfully! =>", values,
            userId: header.insertId,
        });
    }
    catch (error) {
        console.log("Error while inserting a user into the database", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("LOGIN TRY:", email, password);
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        const sql = "SELECT * FROM users WHERE email = ?";
        const [rows] = await dbconnect_1.default.query(sql, [email]);
        const users = rows;
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const user = users[0];
        let isMatch = false;
        if (user.email === "admin@gmail.com") {
            if (password === user.password) {
                isMatch = true;
            }
        }
        else {
            isMatch = await bcryptjs_1.default.compare(password, user.password);
        }
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const payload = { userId: user.user_id, role: user.role };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({
            message: `Login successful! Welcome back: ${user.username}`,
            token: token,
            user: {
                userId: user.user_id,
                role: user.role,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.log("Error during login process", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.router.put("/:id", auth_middleware_1.authMiddleware, async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        const userId_logged = req.user.user_id;
        const role_logged = req.user.role;
        if (role_logged !== 'admin' && userId_logged !== userId) {
            return res.status(403).json({ message: " You cat only edit your own profile" });
        }
        const { username, email, newPassword, profile_image } = req.body;
        const updates = [];
        const values = [];
        if (username) {
            updates.push("username = ?");
            values.push(username);
        }
        if (email) {
            updates.push("email = ?");
            values.push(username);
        }
        if (newPassword) {
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
            updates.push("password = ?");
            values.push(hashedPassword);
        }
        if (profile_image) {
            updates.push("profile_image = ?");
            values.push(profile_image);
        }
        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update." });
        }
        values.push(userId);
        const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
        await dbconnect_1.default.query(sql, values);
        res.json({ message: `User with ID ${userId} updated successfully.` });
    }
    catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = exports.router;
exports.router.get("/logout", (req, res) => {
    res.status(200).json({ message: "logout successful" });
});
