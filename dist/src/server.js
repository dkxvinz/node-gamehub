"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const dbconnect_1 = __importDefault(require("./db/dbconnect"));
const PORT = process.env.port || 3000;
const server = http_1.default.createServer(app_1.app);
const testDatabaseConnection = async () => {
    try {
        await dbconnect_1.default.query("SELECT 1");
        console.log("Database connected successfully!");
    }
    catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
};
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
