import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./gamehub.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
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

export default db;