"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const db = new sqlite3_1.default.Database("./gamehub.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    }
    else {
        console.log("Connected to the gamehub database.");
    }
});
// สร้าง table users ถ้ายังไม่มี
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    profile_image TEXT,
    wallet_balance REAL DEFAULT 0
  )
`);
exports.default = db;
