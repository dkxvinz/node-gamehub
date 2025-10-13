import express from "express";
import cors from "cors";
import {router as index} from "./controller/index";
import { router as users } from "./controller/users";
import { router as upload} from "./controller/upload";
import { router as trans} from "./controller/trans";
import { router as games} from "./controller/games";
import bodyParser from "body-parser";
import path from "path";

export const app = express();

// app.use(cors()); //localhost

const allowedOrigins = [
  "*",
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(bodyParser.text());
app.use(bodyParser.json());
app.use("/",index);
app.use("/files",upload);
app.use("/users",users);
app.use("/trans",trans);
app.use("/games",games);


