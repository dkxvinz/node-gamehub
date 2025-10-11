import { Express, Router } from "express";
import conn from "../db/dbconnect";
import { ResultSetHeader } from "mysql2";

export const router = Router();

router.get("/",async (req,res) => {
     try {
          const [rows] = await conn.query('SELECT * FROM wallet_transaction');
          res.status(200).json(rows);
          console.log("on database: ",rows);
     } catch (err:any) {
          console.error(err);
          return res.status(500).json({error:err.message});
          
     }
});



//---------Insert----------
router.post("/topup/:id", async (req, res) => {
    const { price } = req.body;
    const userId = parseInt(req.params.id);

    try {
        if (!price || price <= 0) {
            return res.status(400).json({ message: "Invalid price value" });
        }

      
        const insertSql = "INSERT INTO wallet_transaction(statements, price, type, trans_date, user_id) VALUES (?, ?, ?, ?, ?)";
        const insertValues = ["เติมเงิน", price, 1, new Date(), userId];
        const [insertResult] = await conn.query(insertSql, insertValues);
        const header = insertResult as ResultSetHeader;

       
        if (header.insertId > 0) {
            console.log(`Transaction logged successfully with ID: ${header.insertId}`);

           
            const updateSql = "UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?";
            const updateValues = [price, userId];
            
            const [updateResult] = await conn.query(updateSql, updateValues);
            const updateHeader = updateResult as ResultSetHeader;

           
            if (updateHeader.affectedRows > 0) {
                console.log(`User ${userId}'s wallet has been updated.`);
                return res.status(201).json({
                    message: "Top up successful and wallet updated!",
                    transactionId: header.insertId,
                });
            } else {
            
                console.error(`Failed to update wallet for user ${userId}. User might not exist.`);
                return res.status(500).json({ message: "Transaction logged, but failed to update wallet." });
            }
        } else {
          
            console.error('Top-up failed: Could not insert transaction database.');
            return res.status(500).json({ message: "Failed to log the transaction." });
        }

    } catch (error) {
        console.error("Error during top-up process:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});