import { Router } from "express";
import conn from "../db/dbconnect";
import { authMiddleware } from "../middleware/auth_middleware";
import { ResultSetHeader } from "mysql2";
import { Games } from "../model/game_int";
import { upload } from "./upload";

export const router = Router();

//all order
router.get("/",async (req,res)=> {
   try {
    const [rows] = await conn.query("SELECT * FROM order");
    res.status(200).json(rows);
    console.log("orders on database: ", rows);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }

});
//--------------------------------------------------------
//insert order status on orderItems 
router.post("/addCart/:gameId",async (req,res) =>{
     const gid = parseInt(req.params.gameId);
     // const {uid} = req.user; //,authMiddleware  //ใข้ต้องจะใช้เส้นนี้จริงๆ

     console.log('[backend]:game id',gid);
     //  console.log('[backend]:user id',uid);

     // const {price,}
     try{

     }catch(e){

     };
     




});
//------------------------------------------------------- 


//cart page
router.post("/cart/:game_id", async (req, res) => {
  const gameId = req.params.game_id;
  const { userLogged } = req.user;

  try {
    if (!gameId || !userLogged) {
      return res
        .status(400)
        .json({ message: "gameId and userId are required." });
    }

    const [rows] = await conn.query("SELECT price FROM games WHERE id = ?", [
      gameId,
    ]);
    const game = rows as Games[];

    if (game.length === 0) {
      return res.status(404).json({ message: "Game not found." });
    }
    const priceFromGames = game[0].price;

    const insertSql =
      "INSERT INTO orderItems (game_id, user_id, price, state) VALUES (?, ?, ?, ?)";

    const insertValues = [gameId, userLogged, priceFromGames, 1];

    const [insertResult] = await conn.query(insertSql, insertValues);
    const header = insertResult as ResultSetHeader;

    if (header.insertId > 0) {
      console.log(`Item added to cart with ID: ${header.insertId}`);

      return res.status(201).json({
        message: "Item added to cart successfully!",
        itemData: {
          itemId: header.insertId,
          gameId: gameId,
          userId: userLogged,
          price: priceFromGames,
          state: 1,
        },
      });
    } else {
      throw new Error("Failed to add item to cart.");
    }
  } catch (error) {
    console.error("Error while adding item to cart:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
//-------------------------------------------------------------

router.post("/purchase/:gameId", async (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const userId = req.user?.id;
  const connection = await conn.getConnection();

  try {
    if (!gameId || !userId) {
      return res
        .status(400)
        .json({ message: "Invalid Game ID or User not authenticated." });
    }

    await connection.beginTransaction();

    const [games] = await connection.query(
      "SELECT price FROM games WHERE id = ?",
      [gameId]
    );
    const game = games as Games[];
    if (game.length === 0) {
      throw new Error("Game not found.");
    }
    const gamePrice = game[0].price;

    const orderSql =
      "INSERT INTO orders (user_id, total_price, order_date) VALUES (?, ?, ?)";
    const [orderResult] = await connection.query(orderSql, [
      userId,
      gamePrice,
      new Date(),
    ]);
    const headerOrder = orderResult as ResultSetHeader;
    const newOrderId = headerOrder.insertId;

    if (newOrderId <= 0) {
      throw new Error("Failed to create an order.");
    }

    const itemSql =
      "INSERT INTO orderItems (order_id, game_id, user_id, price, state) VALUES (?, ?, ?, ?, ?)";

    const [itemResult] = await connection.query(itemSql, [
      newOrderId,
      gameId,
      userId,
      gamePrice,
      4,
    ]);
    const headerItem = itemResult as ResultSetHeader;

    if (headerItem.insertId <= 0) {
      throw new Error("Failed to create an order item.");
    }

    await connection.commit();

    return res.status(201).json({
      message: "Purchase successful!",
      orderId: newOrderId,
      itemId: headerItem.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error during purchase transaction:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release();
  }
});

//--------------------------------------------------
router.put("/update/:id",upload.single('image'),async (req,res) =>{
const game_Id = parseInt(req.params.id);

try {
    if (!(game_Id)) {
          return res.status(400).json({ message: "not found game value!" });
        }

const {name,price,genres,detail} = req.body;

const image = req.file;

const updates:string[] = [];
const values: any[] = [];

if(name){
  updates.push("name = ?");
  values.push(name);
  console.log("new name :",name);
}else{
  return;
}
if(price){
  updates.push("price = ?");
  values.push(price);
    console.log("new price :",price);
}

if(genres){
  updates.push("genres = ?");
  values.push(genres);
}
if(image){
  updates.push("image = ?");
  values.push(image?.filename);
  console.log("New image file object:", image);
console.log("New image file path:", image?.path);
}
if(detail){
  updates.push("detail = ?");
  values.push(detail);
}
if(updates.length === 0){
  return res.status(400).json({message: "No fields to update."});
}

values.push(game_Id);
const sql = `UPDATE games SET ${updates.join(", ")} WHERE game_id = ?`;

await conn.query(sql, values);

res.json({message:  `Game with ID ${name} updated successfully.` });

} catch (error) {
  console.error("Update Games Error:", error);
        res.status(500).json({ error: "Internal Server Error" });

}

});
//-------------------------------------------------------

router.put("/update/:state", async (req, res) => {
  const { state } = req.body;
  try {
    if (!state) {
      return res.status(400).json({ message: "Invalid state value" });
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
  } catch (error) {
    console.error("Error during Update State process:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
export default router;
