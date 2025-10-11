
import { Request, Response } from 'express';
import { AuthRequest, asyncHandler } from '../../types/auth';
import { validationResult } from 'express-validator';
import { registerUser, loginUser, refreshUserTokens } from '../../services/auth/authService';

// Đăng ký
export const register = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
  
    try {
      const result = await registerUser(req.body);
      res.status(201).json({ 
        success: true,
        message: 'OTP đã được gửi tới email của bạn',
        data: result
      });
      return;
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message 
      });
      return;
    }
  });
  

// Đăng nhập
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    res.status(200).json({ 
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
    
    return;
  } catch (error: any) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
    return;
  }
});

// Làm mới token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'Không có quyền truy cập' 
      });
      return;
    }

    try {
      const tokens = await refreshUserTokens(userId);
      res.status(200).json({ 
        success: true,
        message: 'Token đã được làm mới',
        data: tokens
      });
      return;
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message 
      });
      return;
    }
  });

export default{
  register,
  login,
  refreshToken
}