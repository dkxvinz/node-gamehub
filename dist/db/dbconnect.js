"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const conn = promise_1.default.createPool({
    connectionLimit: 10,
    host: "202.28.34.210",
    user: "66011212011",
    password: "66011212011",
    database: "db66011212011",
    port: 3309
});
console.log("Database connection pool created successfully.");
exports.default = conn;
