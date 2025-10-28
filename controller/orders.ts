import { Router } from "express";
import conn from "../db/dbconnect";
import { authMiddleware } from "../middleware/auth_middleware";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Games } from "../model/game_int";
import { upload } from "./upload";
import { order } from "../model/orders_int";

export const router = Router();

//all orderItems 
router.get("/onCart/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    const [rows] = await conn.query(
      "SELECT i.*, g.* FROM orderItems i JOIN games g ON i.game_id = g.game_id WHERE i.user_id = ?",
      [Number(uid)]
    );
    res.status(200).json(rows);
    console.log("game on cart: ", rows);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});
//--------------------------------------------------------
// state = add cart
router.post("/addCart/:gameId/",authMiddleware, async (req, res) => {
  const gid= parseInt(req.params.gameId);
  const uid= parseInt(req.user.userId);


  console.log("[backend]: game id", gid);
  console.log("[backend]: user id", uid);

  try {
    // ตรวจสอบค่าเบื้องต้น
    if (!gid || !uid ) {
      return res.status(400).json({
        message: "Missing gameId, userId value!",});
    }

     const [games] = await conn.query<RowDataPacket[]>('SELECT name, price FROM games WHERE game_id = ?', [gid]);
      if (games.length === 0) {
            throw new Error('Game not found');
        }
      const gamePrice = games[0].price;

    //ตรวจสอบว่า user เคยซื้อเกมนี้แล้วหรือยัง
    const [boughtItems] = await conn.query("SELECT * FROM orderItems WHERE game_id = ? AND user_id = ? AND state = 'buyed'",[gid, uid] );

    if ((boughtItems as any[]).length > 0) {
      return res.status(409).json({ message: "Conflict: You have already bought this game!",});
    }

  
    // const [checkStatus] = await conn.query("SELECT * FROM orderItems WHERE game_id = ? AND user_id = ? AND state = 'check order'",[gid, uid]);

    // if ((checkStatus as any[]).length > 0) {
    //   await conn.query("UPDATE orderItems SET state = 'add cart', price = ? WHERE game_id = ? AND user_id = ?",[gamePrice, gid, uid] );
    //   return res.status(200).json({message: "Cancel check order ,Order updated to add cart successfully.",});
    // }
    const [insertResult] = await conn.query("INSERT INTO orderItems (game_id, user_id, price, state) VALUES (?, ?, ?, ?)",[gid, uid, gamePrice, "add cart"]);

    if ((insertResult as any).affectedRows === 0) {
      return res.status(500).json({message: "Failed to add item to cart."});
    }

    res.status(200).json({ message: "Game added to cart successfully!",});
  } catch (e) {
    console.error("Error during add cart process:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
//------------------------------------------------------- 
// state = 2 :pre data order
router.put("/checkOrder/:gameId",authMiddleware, async (req, res) => {
  const gid = parseInt(req.params.gameId);
  const uid = req.user.userId; 
  const isChecked = req.body.checked
  console.log('[backend]: game id', gid);
  console.log('[backend]: user id', uid);

  try {
    if (!gid || !uid) {
      return res.status(400).json({ message: "not found gameId or userId!" });
    }

    const [games] = await conn.query<RowDataPacket[]>('SELECT name, price FROM games WHERE game_id = ?', [gid]);
    if (games.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }
    const gamePrice = games[0].price;

    
    const [checkItems] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM orderItems WHERE game_id = ? AND user_id = ? AND state = 'add cart'",
      [gid, uid]
    );

    if (checkItems.length === 0) {
      return res.status(401).json({ message: "Invalid order on cart" });
    }


    await conn.query(
      "UPDATE orderItems SET state = ?, price = ? WHERE game_id = ? AND user_id = ?",
      [isChecked?'check order':'uncheck',gamePrice, gid, uid]
    );


 const [totalResult] = await conn.query<RowDataPacket[]>(
  "SELECT SUM(price) as totalPrice FROM orderItems WHERE user_id = ? AND state = 'check order'",
  [uid]
);

    res.json({
      message: isChecked ? "Item selected" : "Item unselected",
      price: gamePrice,
      totalPrice: totalResult[0].totalPrice
    });

  } catch (e) {
    console.error("Error during check order process", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// //check order :join by oid = uid

// //-------------------------------------------------------------
// //state = check order ->buyed 
// router.put("/purchase/:gameId", async (req, res) => {
//   const gameId = parseInt(req.params.gameId);
//   const userId = req.user?.id;

//   try {
//     if (!gameId || !userId) {
//       return res
//         .status(400).json({ message: "Invalid Game ID or User not authenticated." });
//     }


//     const [games] = await conn.query("SELECT price FROM games WHERE id = ?",[gameId]);
//     const game = games as Games[];
    
//     if (game.length === 0) {
//       throw new Error("Game not found.");
//     }
//     const gamePrice = game[0].price;

//     const orderSql = "INSERT INTO orders (user_id, total_price, order_date) VALUES (?, ?, ?)";
//     const [orderResult] = await conn.query(orderSql, [userId,gamePrice,new Date(),]);
//     const headerOrder = orderResult as ResultSetHeader;
//     const newOrderId = headerOrder.insertId;

//     if (newOrderId <= 0) {
//       throw new Error("Failed to create an order.");
//     }

//     const itemSql = "INSERT INTO orderItems (order_id, game_id, user_id, price, state) VALUES (?, ?, ?, ?, ?)";

//     const [itemResult] = await conn.query(itemSql, [newOrderId,gameId,userId,gamePrice,'buyed']);
//     const headerItem = itemResult as ResultSetHeader;

//     if (headerItem.insertId <= 0) {
//       throw new Error("Failed to create an order item.");
//     }
//     return res.status(201).json({message: "Purchase successful!",
//       orderId: newOrderId,
//       itemId: headerItem.insertId,
//     });
//   } catch (error) {
//     await conn.rollback();
//     console.error("Error during purchase transaction:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   } 
// });

//--------------------------------------------------

//-------------------------------------------------------

