import express from "express";
import cors from "cors";
import {router as index} from "./controller/index";
import { router as users } from "./controller/users";
import bodyParser from "body-parser";

export const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);



app.use(bodyParser.text());
app.use(bodyParser.json());
app.use("/",index);
app.use("/users",users);
