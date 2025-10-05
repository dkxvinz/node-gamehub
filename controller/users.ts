import express, { Request, Response } from "express";
import db from "../db/dbconnect";

export interface Users {
  user_is: number;
  username: string;
  email: string;
  password: string;
  profile_image: string;
  wallet_balance: number;
}

export const router = express.Router();

router.get("/", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    handleResponse(
      res,
      err,
      { message: "User created successfully",rows },
      500,
      "not found data on users table!!"
    );
  });
});

//create a new user
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  db.run(
    "INSERT INTO users (username,email,password) VALUES (?,?,?)",
    [username, email, password],
    function (err) {
      handleResponse(
        res,
        err,
        { message: "User created successfully", id: this.lastID },
        500,
        "Failed to create user"
      );
    }
  );
});

// Helper function to handle API responses
export function handleResponse(
  res: Response,
  err: Error | null,
  data?: any,
  notFoundStatusCode: number = 404,
  notFoundMessage: string = "Not found",
  changes: number | null = null
): void {
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
