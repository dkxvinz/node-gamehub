import express from "express";
import cors from "cors";
import {router as index} from "./controller/index";
import { router as users } from "./controller/users";
import { router as trans} from "./controller/trans";
import { router as games} from "./controller/games";
import { router as orders } from "./controller/orders";
import {router as discount} from "./controller/discount";
import bodyParser from "body-parser";
import path from "path";

export const app = express();

// app.use(cors()); //localhost

const allowedOrigins = [
  "http://localhost:4200" ,
  "https://my-gamehub-project.firebaseapp.com",
  "https://my-gamehub-project.web.app",
   
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(bodyParser.text());
app.use(bodyParser.json());
app.use("/",index);
app.use("/users",users);
app.use("/trans",trans);
app.use("/games",games);
app.use("/orders",orders);
app.use("/discount",discount);


