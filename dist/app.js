"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const users_1 = require("./controller/users");
const index_1 = require("./controller/index");
const trip_1 = require("./controller/trip");
const ping_1 = require("./controller/ping");
const upload_1 = require("./controller/upload");
const body_parser_1 = __importDefault(require("body-parser"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
exports.app.use(body_parser_1.default.text());
exports.app.use(body_parser_1.default.json());
exports.app.use("/users", users_1.router);
exports.app.use("/", index_1.router);
exports.app.use("/trip", trip_1.router);
exports.app.use("/ping", ping_1.router);
exports.app.use("/upload", upload_1.router);
exports.app.use("/uploads", express_1.default.static("uploads"));
