import { Express, Router } from "express";
import conn from "../db/dbconnect";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Games } from "../model/game_int";
import { upload } from "./upload";
import { authMiddleware } from "../middleware/auth_middleware";

export const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM games");
    res.status(200).json(rows);
    console.log("on database: ", rows);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});
//----------------------------------------------------------------

//show detail gamehub
router.get("/:gameId", async (req, res) => {
  const gameIdUrl = Number(req.params.gameId);

  try {
    if (!gameIdUrl) {
      return res.status(404).json({ message: "not found gameId" });
    }
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM games WHERE game_id = ?",
      [gameIdUrl]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: `Game with ID ${gameIdUrl} not found.` });
    }
    res.status(200).json(rows[0]);
    console.log("on database: ", rows);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});
//-------------------------------------------------------//
//mygame on profile
router.get("mygame/:gameId", async (req, res) => {
  try {
    const game_Id = parseInt(req.params.gameId);
    console.log("game id:", game_Id);

    if (!game_Id) {
      return res.status(403).json({ message: "Invalid Game Value" });
    }

    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT  game_id, name, price, detail FROM games WHERE game_id = ?",
      [game_Id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "game id  not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err: any) {
    console.error("error game:", err);
    return res.status(500).json({ error: err.message });
  }
});
//-----------------------------------------------------

//detail mygame;
router.get("/mygame/:gameId", authMiddleware, async (req, res) => {
  try {
    const gameIdUrl = Number(req.params.gameId);
    const userId = req.user;
    console.log("user id:", userId);

    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT  game_id, name, price, detail FROM games join orderitems on game_id = item_oid join users on item_oid = user_id  WHERE item_oid.user_id = ? AND item_oid.state",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "game id  not found" });
    }

    console.log(`Found ${rows.length} transactions for user ID: ${userId}`);
    return res.status(200).json({
      games: rows,
    });
  } catch (err: any) {
    console.error("error game:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/mygame/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("user id:", userId);

    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT  game_id, name, price, detail FROM games join orderitems on game_id = item_oid join users on item_oid = user_id  WHERE item_oid.user_id = ? AND item_oid.state",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "game id  not found" });
    }
    const gameCount = rows.length;
    console.log(`Found ${rows.length} transactions for user ID: ${userId}`);

    return res.status(200).json({
      rows,
      // count: gameCount,
      // games: rows
    });
  } catch (err: any) {
    console.error("error game:", err);
    return res.status(500).json({ error: err.message });
  }
});
//-----------------------------------------------------
// admin build //

router.post("/create", upload.single("image"), async (req, res) => {
  const { name, price, genres, detail } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }
    const imagePath = req.file.filename;
    console.log("imagePath: ", imagePath);

    if (!name || !price || !genres || !detail) {
      return res.status(400).json({ message: "Missing required text fields." });
    }
    if (price < 0) {
      return res
        .status(422)
        .json({ message: "Please enter a price of 0 or more only." });
    }

    const createNewGame =
      "INSERT INTO games (name, price, genres, image, detail, amount, sale_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const valuesGameData = [
      name,
      price,
      genres,
      imagePath,
      detail,
      0,
      new Date(),
    ];

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
      "INSERT INTO orderitems (game_id, user_id, price, state) VALUES (?, ?, ?, ?)";

    const insertValues = [gameId, userLogged, priceFromGames, 1];

    const [insertResult] = await conn.query(insertSql, insertValues);
    const header = insertResult as ResultSetHeader;

    if (header.insertId > 0) {
      console.log(`Item added to cart with ID: ${header.insertId}`);

      // --- FIX 3B & 3D: แก้ไข Response ให้ถูกต้อง ---
      return res.status(201).json({
        // ใช้ 201 Created สำหรับการสร้างข้อมูลใหม่
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
    // FIX 3D: ปรับปรุง Error message ให้ชัดเจน
    console.error("Error while adding item to cart:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

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

// router.put("/:id",authMiddleware,upload.single('profile_image'),async (req,res) =>{
// const userIdUpdate= parseInt(req.params.id);

// try {
//   const userLogged = req.user;
//     if (String(userLogged.userId) !== String(userIdUpdate) && userLogged.role !== 0) {
//           return res.status(403).json({ message: "You can only edit your own profile" });
//         }

// const {username,email,newPassword} = req.body;

// const profileImageFile = req.file;

// const updates:string[] = [];
// const values: any[] = [];

// if(username){
//   updates.push("username = ?");
//   values.push(username);
//   console.log("new name :",username);
// }else{
//   //บันทึกค่าเดิม
// }
// if(email){
//   updates.push("email = ?");
//   values.push(email);
//     console.log("new email :",email);
// }

// if(newPassword){
//   const hashedPassword = await bcrypt.hash(newPassword,10);
//   updates.push("password = ?");
//   values.push(hashedPassword);
// }
// if(profileImageFile){
//   updates.push("profile_image = ?");
//   values.push(profileImageFile?.filename);
//   console.log("New image file object:", profileImageFile);
// console.log("New image file path:", profileImageFile?.path);
// }
// if(updates.length === 0){
//   return res.status(400).json({message: "No fields to update."});
// }

// values.push(userIdUpdate);
// const sql = `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`;

// await conn.query(sql, values);

// res.json({message:  `User with ID ${userIdUpdate} updated successfully.` });

// } catch (error) {
//   console.error("Update User Error:", error);
//         res.status(500).json({ error: "Internal Server Error" });

// }

// });
// export default router;

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
