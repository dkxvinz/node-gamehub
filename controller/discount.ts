import { Router } from "express";
import conn from "../db/dbconnect"
import { error } from "console";
import { ResultSetHeader, RowDataPacket } from "mysql2";


export const router = Router();
// 
//for search,display discount data 
router.get("/",async (req,res)=>{
     try{
          const [rows] = await conn.query('SELECT * FROM discount');
          res.status(200).json(rows);
          console.log("discount on database:",rows);

     }catch(err:any){
          console.error(err);
          return res.status(500).json({error:err.message});
     }
});
//--------------------------------------------------
//for display specific data from discount table
router.get("/:discountId",async (req,res) =>{

     try {
          const did = req.params.discountId;
          if(!did){
               return res.status(400).json({message:'not found this discount id!'})
          }
          const [rows] = await conn.query<RowDataPacket[]>('SELECT discount_id,discount_code,discount_price,max_quantity,limit_user FROM discount WHERE  discount_id,',[did]);
          if (rows.length===0){
               return res.status(404).json({message:'discount not fond'})
          }

          res.status(200).json(rows);


     } catch (err:any) {
          console.error('error discount:',error);
          return res.status(500).json({error:err.message});
          

          
     }

});

//for create discount
router.post("/create",async (req,res) =>{
     const {discountCode,discountPrice,maxQuantity} =req.body;
     try {
          if(!discountCode&& !discountPrice  && !maxQuantity){
               return res.status(400).json({message:'please check discount code or max quantity or limit user are required'})
          }
          const sql = "INSERT INTO discount(discount_code,discount_price,max_quantity) VALUES (?,?,?)";
          const  values = [discountCode,discountPrice,maxQuantity];
          
          const [result] = await conn.query(sql,values);
          const header = result as ResultSetHeader;
          return res.status(201).json({message:"Create Discount Successfully!!",values,
               discountId:header.insertId
          });
     } catch (err) {
         console.log("Error while inserting a user into the database", error);
          return res.status(500).json({ message: "Internal Server Error" });
    
          
     }
});

//for edit
router.put("/update/:discountId",async (req,res)=>{
     const did = req.params.discountId;
     try {
          if(!did){
               return res.status(400).json({message:" not found  this discount"})
          }

          const {discount_code,discount_price,max_quantity} = req.body;

          const updates:string[] = [];
          const values: any[] = [];
     if(discount_code){
     updates.push("discount_code = ?");
     values.push(discount_code);
     console.log("new discount_code :",discount_code);
     }
     if(discount_price){
     updates.push("discount_price = ?");
     values.push(discount_price);
     console.log("new discount_price :",discount_price);
     }
      if(max_quantity){
     updates.push("discount_code = ?");
     values.push(max_quantity);
     console.log("new max_quantity :",max_quantity);
     }
    

          values.push(did);
          const sql = `UPDATE discount SET ${updates.join(", ")} WHERE discount_id = ?`;

          await conn.query(sql, values);

          res.json({message:  `discount: ${discount_code} updated successfully.` });

          } catch (error) {
          console.error("Update Discount Error:", error);
               res.status(500).json({ error: "Internal Server Error" });

          }

     
});

//-----------------------------------------------------------------
//delete

router.delete("/delete/:discId",async(req,res)=>{
  const discountId = Number(req.params.discId);

  try {
    if(!discountId){
      return res.status(400).json({message:'not found discount id'});
    }

    const sqlForDelete = 'DELETE FROM discount WHERE discount_id = ?';
    const [resultData] = await conn.query(sqlForDelete,[discountId]);
    const header = resultData as ResultSetHeader;
     if (header.affectedRows > 0) {
          
            console.log(`Game with ID ${discountId} was deleted successfully.`);
            return res.status(204).send(); 
        } else {
            
            console.log(`Attempted to delete non-existent game with ID ${discountId}.`);
            return res.status(404).json({ message: `Game with ID ${discountId} not found.` });
        }
        
    } catch (error) {
        console.log("Error while deleting a game from the database:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
