// import { Router } from "express";
// import conn from "../db/dbconnect";
// import { authMiddleware } from "../middleware/auth_middleware";
// import { ResultSetHeader, RowDataPacket } from "mysql2";
// import { Games } from "../model/game_int";
// import { upload } from "./upload";
// import { order } from "../model/orders_int";
// import { MAX } from "uuid";
// import { kMaxLength } from "buffer";
// import { count } from "console";

// export const router = Router();

// //all orderItems 
// router.get("/onCart/:uid", async (req, res) => {
//   const { uid } = req.params;
//   try {
//     const [rows] = await conn.query(
//       "SELECT i.*, g.* FROM orderItems i JOIN games g ON i.game_id = g.game_id WHERE i.user_id = ?",
//       [Number(uid)]
//     );
//     res.status(200).json(rows);
//     console.log("game on cart: ", rows);
//   } catch (err: any) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// });
// //--------------------------------------------------------
// // state = add cart
// router.post("/addCart/:gameId/",authMiddleware, async (req, res) => {
//   const gid= parseInt(req.params.gameId);
//   const uid= parseInt(req.user.userId);


//   console.log("[backend]: game id", gid);
//   console.log("[backend]: user id", uid);

//   try {
//     // ตรวจสอบค่าเบื้องต้น
//     if (!gid || !uid ) {
//       return res.status(400).json({
//         message: "Missing gameId, userId value!",});
//     }

//      const [games] = await conn.query<RowDataPacket[]>('SELECT name, price FROM games WHERE game_id = ?', [gid]);
//       if (games.length === 0) {
//             throw new Error('Game not found');
//         }
//       const gamePrice = games[0].price;

//     //ตรวจสอบว่า user เคยซื้อเกมนี้แล้วหรือยัง
//     const [boughtItems] = await conn.query("SELECT * FROM orderItems WHERE game_id = ? AND user_id = ? AND state = 'buyed'",[gid, uid] );

//     if ((boughtItems as any[]).length > 0) {
//       return res.status(409).json({ message: "Conflict: You have already bought this game!",});
//     }

  
//     // const [checkStatus] = await conn.query("SELECT * FROM orderItems WHERE game_id = ? AND user_id = ? AND state = 'check order'",[gid, uid]);

//     // if ((checkStatus as any[]).length > 0) {
//     //   await conn.query("UPDATE orderItems SET state = 'add cart', price = ? WHERE game_id = ? AND user_id = ?",[gamePrice, gid, uid] );
//     //   return res.status(200).json({message: "Cancel check order ,Order updated to add cart successfully.",});
//     // }
//     const [insertResult] = await conn.query("INSERT INTO orderItems (game_id, user_id, price, state) VALUES (?, ?, ?, ?)",[gid, uid, gamePrice, "add cart"]);

//     if ((insertResult as any).affectedRows === 0) {
//       return res.status(500).json({message: "Failed to add item to cart."});
//     }

//     res.status(200).json({ message: "Game added to cart successfully!",});
//   } catch (e) {
//     console.error("Error during add cart process:", e);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// });
// //------------------------------------------------------- 
// // state = 2 :pre data order
// router.put("/purchase/:orderId", authMiddleware, async (req, res) => {
//   const orderId = parseInt(req.params.orderId);
//   const userId = req.user.userId;
//   const discount = Number(req.body.discount) || 0; 

//   if (!orderId || !userId) {
//     return res.status(400).json({ message: "Invalid orderId or userId" });
//   }

//   try {

//     const [alreadyBuyed] = await conn.query<RowDataPacket[]>(
//       "SELECT * FROM orderItems WHERE order_id = ? AND user_id = ? AND state = 'buyed'",
//       [orderId, userId]
//     );

//     if (alreadyBuyed.length > 0) {
//       await conn.rollback();
//       return res.status(409).json({ message: "You already own this game" });
//     }

//     const [totalResult] = await conn.query<RowDataPacket[]>(
//       "SELECT SUM(price) as totalPrice FROM orderItems WHERE user_id = ? AND state = 'check order' AND order_id = ?",
//       [userId, orderId]
//     );

//     const totalPrice = totalResult[0].totalPrice || 0;
//     const finalPrice = totalPrice - discount;

//     if (totalPrice <= 0) {
//       await conn.rollback();
//       return res.status(400).json({ message: "No items selected to purchase" });
//     }


//     const [updateResult] = await conn.query<ResultSetHeader>(
//       "UPDATE orderItems SET state = 'buyed', orderPrice = ? WHERE state = 'check order' AND user_id = ? AND order_id = ?",
//       [finalPrice, userId, orderId]
//     );

//     if (updateResult.affectedRows === 0) {
//       await conn.rollback();
//       return res.status(404).json({ message: "Failed to update order items" });
//     }

    
//     const [orderResult] = await conn.query<ResultSetHeader>(
//       "INSERT INTO orders (user_id, total_price, order_date) VALUES (?, ?, ?)",
//       [userId, finalPrice, new Date()]
//     );
//     const newOrderId = orderResult.insertId;

//     if (!newOrderId) {
//       await conn.rollback();
//       return res.status(500).json({ message: "Failed to create order" });
//     }


//     const [gameUpdate] = await conn.query<ResultSetHeader>(
//       "UPDATE games g JOIN orderItems oi ON g.game_id = oi.game_id SET g.amount = g.amount - 1 WHERE oi.order_id = ? AND g.amount > 0",
//       [orderId]
//     );

//     if (gameUpdate.affectedRows === 0) {
//       await conn.rollback();
//       return res.status(400).json({ message: "Game is out of stock" });
//     }


//     const [rankCount] = await conn.query<RowDataPacket[]>(
//       "SELECT oi.game_id, COUNT(rg.rank_no) as cnt FROM rank_game rg RIGHT JOIN orderItems oi ON rg.game_id = oi.game_id WHERE oi.order_id = ? GROUP BY oi.game_id",
//       [orderId]
//     );

//     for (const row of rankCount) {
//       const rankNo = (row.cnt || 0) + 1;
//       await conn.query(
//         "INSERT INTO rank_game (rank_no, game_id, rank_date) VALUES (?, ?, ?)",
//         [rankNo, row.game_id, new Date()]
//       );
//     }

//     await conn.commit();
//     res.status(201).json({ message: "Purchase successful", orderId: newOrderId, totalPrice: finalPrice });
//   } catch (err) {
//     await conn.rollback();
//     console.error("Error during purchase:", err);
//     res.status(500).json({ message: "Internal Server Error" });
//   } 
// });


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