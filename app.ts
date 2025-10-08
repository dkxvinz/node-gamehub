import express from "express";
import cors from "cors";
import {router as index} from "./controller/index";
import { router as users } from "./controller/users";
import bodyParser from "body-parser";

export const app = express();


const allowedOrigins = [
  "https://my-gamehub-project.firebaseapp.com",
  "https://my-gamehub-project.web.app",
   "http://localhost:4200" 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // สำหรับ Postman หรือ server-side request
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(bodyParser.text());
app.use(bodyParser.json());
app.use("/",index);
app.use("/users",users);
