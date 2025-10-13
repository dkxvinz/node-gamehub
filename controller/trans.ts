import { Router } from "express";
import conn from "../db/dbconnect";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { error } from "console";
import { authMiddleware } from "../middleware/auth_middleware";

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

router.get("/mytrans/:id",async (req,res) => {
      const  userId = req.params.id;
     try {

          const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM wallet_transaction WHERE user_id = ?',[userId]);

            if(rows.length===0){
                return res.status(404).json({message:'game id  not found'});
            }
           console.log(`Found ${rows.length} transactions for user ID: ${userId}`);

       
        return res.status(200).json({rows});

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

router.post("/pay/:id",authMiddleware, async (req, res) => {
  
    const { userId } = req.user;
    const gameId = parseInt(req.params.id);

    console.log('userId:',userId);
   
    const connection = await conn.getConnection(); 

    try {
        if (!gameId)  {
            return res.status(400).json({ message: "Game ID is required." });
        }

      
        await connection.beginTransaction();

       
        const [games] = await connection.query<RowDataPacket[]>('SELECT name, price FROM games WHERE game_id = ? FOR UPDATE', [gameId]);
        const [users] = await connection.query<RowDataPacket[]>('SELECT wallet_balance FROM users WHERE user_id = ? FOR UPDATE', [userId]);
        
        if (games.length === 0) {
            throw new Error('Game not found');
        }
        if (users.length === 0) {
           return res.status(400).json({ message: "not found your wallet balance!!!!" });
        }
        
        const gamePrice = games[0].price;
        const userBalance = users[0].wallet_balance;

        
        if (userBalance < gamePrice) {
              await connection.rollback(); 
            return res.status(400).json({ message: "Please check your wallet balance!!" });
        }

      
        const statement = `${games[0].name}`; 
       
        const insertSql = "INSERT INTO wallet_transaction(statements, price, type, trans_date, user_id) VALUES (?, ?, ?, ?, ?)";
        const [insertResult] = await connection.query(insertSql, [statement, gamePrice, 0, new Date(), userId]);
        const header = insertResult as ResultSetHeader;

        if (header.insertId <= 0) {
            throw new Error("Failed to log the transaction.");
        }

        // --- Step 5: FIX 1 - UPDATE (หักเงิน) wallet ของ user ---
        const updateSql = "UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?";
        await connection.query(updateSql, [gamePrice, userId]);

        // --- Step 6: ถ้าทุกอย่างสำเร็จ ให้ Commit ---
        await connection.commit();

        return res.status(200).json({ 
            message: "Payment successful!",
            transactionId: header.insertId,
            newBalance: userBalance - gamePrice
        });

    } catch (err) {
        // --- ถ้ามี Error ใดๆ เกิดขึ้น ให้ Rollback ---
        await connection.rollback();
        console.error("Error during payment transaction, rolled back.", error);

     
        return res.status(500).json({ message: "Internal Server Error" });
    } finally {
   
        connection.release();
    }
});