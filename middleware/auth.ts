import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import conn from '../db/dbconnect'; // ✅ ใช้ connection จาก mysql2/promise

const JWT_SECRET = process.env.JWT_SECRET || 'GameHub123';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // ✅ ตรวจสอบ user จาก database
    const [rows]: any = await conn.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // ✅ ตรวจสอบรหัสผ่าน (กรณีรหัสผ่านเก็บ plain-text)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ สร้าง token หมดอายุใน 10 วินาที
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {  expiresIn: '1h'  }
    );

    return res.status(200).json({
      message: 'Login success',
      token,
      userData: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_image: user.profile_image,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
