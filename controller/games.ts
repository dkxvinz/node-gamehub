import { Express, Router } from "express";
import conn from "../db/dbconnect";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Games } from "../model/game_int";
import { upload } from "./upload";

export const router = Router();


router.get("/", async (req, res) => {
    try {
        const [rows] = await conn.query('SELECT * FROM games');
        res.status(200).json(rows);
        console.log("on database: ",rows);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});
//-------------------------------------------------------//
router.get("/:gameId",async (req,res) =>{
  try {
    const game_Id = parseInt(req.params.gameId);
     console.log('game id:',game_Id);

if (!game_Id) {

      return res.status(403).json({message: 'Invalid Game Value'})
    }

    const [rows] = await conn.query<RowDataPacket[]>('SELECT  game_id, name, price, detail FROM games WHERE game_id = ?',[game_Id]);
    
  if(rows.length===0){
  return res.status(404).json({message:'game id  not found'});
}
res.status(200).json(rows[0]);
  } catch (err:any) {
    console.error('error game:',err);
    return res.status(500).json({error:err.message});
  }

});
//-----------------------------------------------------
// admin build //

router.post("/create", upload.single('image'), async (req, res) => {
    const { name, price, genres, detail } = req.body;

    try {
     
        if (!req.file) {
            return res.status(400).json({ message: "Image file is required." });
        }
        const imagePath = req.file.path;
        console.log('imagePath: ',imagePath);

        if (!name || !price || !genres || !detail) {
            return res.status(400).json({ message: "Missing required text fields." });
        }

       
        const createNewGame =
            "INSERT INTO games (name, price, genres, image, detail, amount, sale_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

        const valuesGameData = [name, price, genres, imagePath, detail, 0, new Date()];

        const [result] = await conn.query(createNewGame, valuesGameData);
        const header = result as ResultSetHeader;

        if (header.insertId > 0) {
            console.log("Game created with image:", { data: valuesGameData });
            return res.status(201).json({
                message: "Create Game successfully!",
                gameId: header.insertId,
            });
        } else {
            throw new Error("Failed to insert game data.");
        }
    } catch (err) {
        console.error("Error while inserting a game into the database:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
//--------------------------------------------------------------------------------

//cart page
router.post("/cart/:game_id", async (req, res) => {
    
    const gameId = req.params.game_id;
    const {userLogged} = req.user;

    try {
        if (!gameId || !userLogged) {
            return res.status(400).json({ message: "gameId and userId are required." });
        }

   
        const [rows] = await conn.query("SELECT price FROM games WHERE id = ?", [gameId]);
        const game = rows as Games[];
        
        if (game.length === 0) {
            return res.status(404).json({ message: "Game not found." });
        }
        const priceFromGames = game[0].price; 
        
  
        const insertSql = "INSERT INTO orderitems (game_id, user_id, price, state) VALUES (?, ?, ?, ?)";
        
        
        const insertValues = [gameId, userLogged, priceFromGames, 1];

        const [insertResult] = await conn.query(insertSql, insertValues);
        const header = insertResult as ResultSetHeader;

        if (header.insertId > 0) {
            console.log(`Item added to cart with ID: ${header.insertId}`);
            
            // --- FIX 3B & 3D: แก้ไข Response ให้ถูกต้อง ---
            return res.status(201).json({ // ใช้ 201 Created สำหรับการสร้างข้อมูลใหม่
                message: "Item added to cart successfully!",
                itemData: {
                    itemId: header.insertId,
                    gameId: gameId,
                    userId: userLogged,
                    price: priceFromGames,
                    state: 1
                }
            });
        } else {
            throw new Error("Failed to add item to cart.");
        }

    } catch (error) {
        // FIX 3D: ปรับปรุง Error message ให้ชัดเจน
        console.error("Error while adding item to cart:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/purchase/:gameId/:userId", async (req, res) => {
  const gameIdOrder = parseInt(req.params.gameId);
  const userIdOrder = parseInt(req.params.userId);
  const { price, state } = req.body;
  try {
    if (!gameIdOrder && !userIdOrder && !price && !state) {
      return res
        .status(400)
        .json({ message: "Invalid user or game or price or state value" });
    }

    const insertSql = "INSERT INTO orderitems (game_id,user_id,price,state) VALUE(?,?,?,?)";
    const insertValues = [gameIdOrder, userIdOrder, price, 3];
    const [insertResult] = await conn.query(insertSql, insertValues);
    const headerOrderItems = insertResult as ResultSetHeader;

    if (headerOrderItems.insertId > 0) {
      console.log(
        `OrderItem successfully with ID: ${headerOrderItems.insertId}`
      );
     }

      return res.status(200).json({
           message: "Top up successful and wallet updated!",insertValues,
           OrdersItemsId: headerOrderItems.insertId
     });

    
  
  
}catch (error) {
    console.error("Error during top-up process:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});



router.put("/update/:state", async (req, res) => {
  const { state } = req.body;
  try {
    if (!state) {
      return res
        .status(400)
        .json({ message: "Invalid state value" });
    }


      const updates: string[] = [];
      const values: any[] = [];

       if (state == 1) {
        updates.push("state = ?");
        values.push(2);
        console.log("update state 2 => check order");

      } else if (state == 2) {
        updates.push("state = ?");
        values.push(3);
        console.log("update state 3 => purchased");
      }
      if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }
      values.push(state);
      const updatesOrderItems = `UPDATE orderItems SET ${updates.join(
        ", "
      )} WHERE state = ?`;

      const [resultsOrdersItems] = await conn.query(updatesOrderItems, values);
      const header = resultsOrdersItems as ResultSetHeader;
      res.json({
        message: `Order  state:  ${state} updated successfully.`,
      });

    }catch (error) {
    console.error("Error during Update State process:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
export default router;
