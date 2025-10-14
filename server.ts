import http from "http";
import { app } from "./app";
import conn from "./db/dbconnect";

const PORT  = process.env.port || 3012;
const server = http.createServer(app);

const testDatabaseConnection = async () => {
  try {
    await conn.query("SELECT 1");
    console.log("Database connected successfully!");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1); 
  }
};





server.listen(PORT , async () => {
  console.log(`Server is running on port ${PORT}`);
await testDatabaseConnection();
});
