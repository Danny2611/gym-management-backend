import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}




export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(401).json({
        success: false, 
        message: 'Không tìm thấy token xác thực' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      
      if (decoded.type !== 'access') {
        res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
        return;
      }


      req.userRole = decoded.role; // Lưu vai trò vào request
      req.userId = decoded.userId;
      
      next();
    } catch (error) {
      res.status(403).json({  
        success: false,message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  };
  
export const authenticateRefreshToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({ message: 'Không tìm thấy refresh token' });
      return;
    }
    
    try {
      const decoded = verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        res.status(401).json({ message: 'Refresh token không hợp lệ' });
        return;
      }
      
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }
  };

  
  