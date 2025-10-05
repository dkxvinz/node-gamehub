"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
exports.handleResponse = handleResponse;
const express_1 = __importDefault(require("express"));
const dbconnect_1 = __importDefault(require("../db/dbconnect"));
exports.router = express_1.default.Router();
exports.router.get("/", (req, res) => {
    dbconnect_1.default.all("SELECT * FROM users", [], (err, rows) => {
        handleResponse(res, err, { message: "User created successfully", rows }, 500, "not found data on users table!!");
    });
});
//create a new user
exports.router.post("/register", (req, res) => {
    const { username, email, password } = req.body;
    dbconnect_1.default.run("INSERT INTO users (username,email,password) VALUES (?,?,?)", [username, email, password], function (err) {
        handleResponse(res, err, { message: "User created successfully", id: this.lastID }, 500, "Failed to create user");
    });
});
// Helper function to handle API responses
function handleResponse(res, err, data, notFoundStatusCode = 404, notFoundMessage = "Not found", changes = null) {
    if (err) {
        res.status(500).json({ error: err.message });
        return;
    }
    if (!data && !changes) {
        res.status(notFoundStatusCode).json({ error: notFoundMessage });
        return;
    }
    res.json(data);
}
