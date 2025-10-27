import bcrypt from 'bcryptjs';
import { ResultSetHeader } from 'mysql2';
import { RowDataPacket } from 'mysql2';
import { Router } from 'express';
import conn from '../db/dbconnect';
import { authMiddleware } from '../middleware/auth_middleware';
import  jwt  from 'jsonwebtoken';
import {User} from '../model/user';
import { upload } from './upload';

export const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ||  'GameHub123';



router.get("/", async (req, res) => {
    try {
        const [rows] = await conn.query('SELECT * FROM users');
        res.status(200).json(rows);
        console.log("on database: ",rows);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/profile/:id",authMiddleware,async (req,res) =>{
  try {
    const userId = req.params.id;
    const userLogged = req.user;


if (String(userLogged.userId) !== String(userId) && userLogged.role !== 0) {

      return res.status(403).json({message: 'You do not have permission to access this profile.'})
    }

    const [rows] = await conn.query<RowDataPacket[]>('SELECT user_id, username, email, profile_image, wallet_balance FROM users WHERE user_id = ?',[userId]);
    
  if(rows.length===0){
  return res.status(404).json({message:'user not found'});
}
res.status(200).json(rows[0]);
  } catch (err:any) {
    console.error('error profile:',err);
    return res.status(500).json({error:err.message});
  }

});
//-------------Register-------------------------
router.post("/register", async (req, res) => {
  const { username, email, password} = req.body;

    try {
        if (!username || !email || !password ) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

 
        const sql = "INSERT INTO users(username, email, password,wallet_balance, role) VALUES (?, ?, ?,?,?)";
     
        const values = [username, email, hashedPassword,0, 1]; 

        const [result] = await conn.query(sql, values);
        const header = result as ResultSetHeader;
        console.log("welcome: ",values);
        return res.status(201).json({
            message: "Register successfully! =>",values ,
            userId: header.insertId
            
        });
       

    } catch (error) {
        console.log("Error while inserting a user into the database", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//-------------Login---------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("LOGIN :", email, password);

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    const [rows] = await conn.query(sql, [email]);
    const users = rows as User[];

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    let isMatch = false;

    
    if (user.email === "admin@gmail.com") {
      if (password === user.password) {
        isMatch = true; 
      }
    } else {
    
      isMatch = await bcrypt.compare(password, user.password!);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { userId: user.user_id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return res.status(200).json({
      message: `Login successful! Welcome back: ${user.username}`,
      token: token,
      user: {
        userId: user.user_id,
        role: user.role,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image
      },
    });
  } catch (error) {
    console.log("Error during login process", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//-------------Update----------------------

router.put("/:id",authMiddleware,upload.single('profile_image'),async (req,res) =>{
const userIdUpdate= parseInt(req.params.id);

try {
  const userLogged = req.user;
    if (String(userLogged.userId) !== String(userIdUpdate) && userLogged.role !== 0) {
          return res.status(403).json({ message: "You can only edit your own profile" });
        }

const {username,email,newPassword} = req.body;

const profile_image = req.file;

const updates:string[] = [];
const values: any[] = [];

if(username){
  updates.push("username = ?");
  values.push(username);
  console.log("new name :",username);
}
if(email){
  updates.push("email = ?");
  values.push(email);
    console.log("new email :",email);
}

if(newPassword){
  const hashedPassword = await bcrypt.hash(newPassword,10);
  updates.push("password = ?");
  values.push(hashedPassword);
}
if(profile_image){
  updates.push("profile_image = ?");
  values.push(profile_image?.filename);
  console.log("New image file object:", profile_image);
console.log("New image file path:", profile_image?.path);
}
if(updates.length === 0){
  return res.status(400).json({message: "No fields to update."});
}

values.push(userIdUpdate);
const sql = `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`;

await conn.query(sql, values);

res.json({message:  `User with ID ${userIdUpdate} updated successfully.` });
  
} catch (error) {
  console.error("Update User Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
  
}


});
export default router;

//----------------Logout-------------------
router.get("/logout",(req, res) => {
   res.status(200).json({ message: "logout successful" });
});


