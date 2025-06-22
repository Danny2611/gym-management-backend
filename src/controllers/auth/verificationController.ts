import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyUserOTP } from '../../services/authService';
import Member from '../../models/Member';
import { sendOTPEmail } from '../../services/emailService';

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  
  try {
    const result = await verifyUserOTP(email, otp);
    res.json({ 
      success: true,
      message: 'Xác thực email thành công. Bạn có thể đăng nhập!',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    const user = await Member.findOne({ email });
    
    if (!user) {
      res.status(400).json({ 
        success: false,
        message: 'Email không tồn tại' 
      });
      return;
    }
    
    if (user.isVerified) {
      res.status(400).json({ 
        success: false,
        message: 'Tài khoản đã được xác thực' 
      });
      return;
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    await sendOTPEmail(email, otp);
    
    res.status(200).json({ 
      success: true,
      message: 'OTP mới đã được gửi tới email của bạn' 
    });
    return;
  });
  