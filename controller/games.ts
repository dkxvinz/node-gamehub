import {  Router } from "express";
import conn from "../db/dbconnect";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { upload } from "./upload";

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

//detail mygame && mygame show on profile user;
router.get("/mygame/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    console.log("user id:", userId);

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT g.*, i.* 
       FROM games g 
       JOIN orderItems i ON g.game_id = i.game_id  
       JOIN users u ON i.user_id = u.user_id  
       WHERE u.user_id = ? AND i.state = 4`,
      [userId]
    );

    console.log(`Found ${rows.length} games for user ID: ${userId}`);

    return res.status(200).json({
      games: rows,
      count: rows.length,
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
    const image = req.file.filename;
    console.log("imagePath: ", image);

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
      image,
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

res.json({message:  `Game with Name:${name} updated successfully.` });

} catch (error) {
  console.error("Update Games Error:", error);
        res.status(500).json({ error: "Internal Server Error" });

}

});
//-------------------------------------------------------


//------------------------------------------------------------------------------------------
router.delete("/delete/:gameID",async(req,res)=>{
  const game_Id = Number(req.params.gameID);

  try {
    if(!game_Id){
      return res.status(400).json({message:'not found game id'});
    }

    const sqlForDelete = 'DELETE FROM games WHERE game_id = ?';
    const [resultData] = await conn.query(sqlForDelete,[game_Id]);
    const header = resultData as ResultSetHeader;
if (header.affectedRows > 0) {
          
            console.log(`Game with ID ${game_Id} was deleted successfully.`);
            return res.status(204).send(); 
        } else {
            
            console.log(`Attempted to delete non-existent game with ID ${game_Id}.`);
            return res.status(404).json({ message: `Game with ID ${game_Id} not found.` });
        }
        
    } catch (error) {
        console.log("Error while deleting a game from the database:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
//---------------------------------------------------


