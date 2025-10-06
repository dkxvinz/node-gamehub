import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'GameHub123';

declare global {
    namespace Express {
        interface Request {
            user?: any; 
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
     console.log(token);
    try {

        const decodedPayload = jwt.verify(token, JWT_SECRET);
        req.user = decodedPayload; 
       

        next(); 
    } catch (err) {
      
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};