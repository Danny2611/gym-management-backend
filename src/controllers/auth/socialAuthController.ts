
  // controllers/auth/socialAuthController.ts
import { Request, Response } from 'express';
import { AuthRequest, asyncHandler } from '../../types/auth';
import { generateAccessToken, generateRefreshToken } from '../../config/jwt';

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;
    const callbackUrl = req.query.callbackUrl as string || `${process.env.FRONTEND_URL || 'https://gym-management-fronted.vercel.app/'}/oauth/callback`;
    
    if (!user) {
      // Redirect về client với thông báo lỗi
      return res.redirect(`${callbackUrl}?error=${encodeURIComponent('Đăng nhập Google thất bại')}`);
    }
    
    // Tạo token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Chuẩn bị dữ liệu người dùng để chuyển về client
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    // Redirect về client với token và thông tin người dùng
    return res.redirect(
      `${callbackUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&userData=${encodeURIComponent(JSON.stringify(userData))}`
    );
});

export const facebookCallback = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;
    const callbackUrl = req.query.callbackUrl as string || `${process.env.FRONTEND_URL || 'https://gym-management-fronted.vercel.app'}/oauth/callback`;
    
    if (!user) {
      // Redirect về client với thông báo lỗi
      return res.redirect(`${callbackUrl}?error=${encodeURIComponent('Đăng nhập Facebook thất bại')}`);
    }
    
    // Tạo token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Chuẩn bị dữ liệu người dùng để chuyển về client
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    // Redirect về client với token và thông tin người dùng
    return res.redirect(
      `${callbackUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&userData=${encodeURIComponent(JSON.stringify(userData))}`
    );
});