// # Xử lý đổi mật khẩu, quên mật khẩu
import { Request, Response, } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import Member from '~/models/Member';
import { sendNewPasswordEmail } from '~/services/emailService';

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    const user = await Member.findOne({ email });
    
    if (!user) {
      res.status(400).json({ 
        success: false,
        message: 'Email không tồn tại' 
      });
      return;
    }
    
    const newPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    await sendNewPasswordEmail(email, newPassword);
    
    res.status(200).json({ 
      success: true,
      message: 'Mật khẩu mới đã được gửi tới email của bạn' 
    });
    return;
  });
  
  export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'Không có quyền truy cập' 
      });
      return;
    }
    
    const user = await Member.findById(userId);
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy người dùng' 
      });
      return;
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      res.status(400).json({ 
        success: false,
        message: 'Mật khẩu hiện tại không đúng' 
      });
      return;
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Đổi mật khẩu thành công' 
    });
    return;
  });



  export const validateCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword } = req.body;
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ 
            success: false,
            message: 'Không có quyền truy cập' 
        });
        return;
    }

    const user = await Member.findById(userId);

    if (!user) {
        res.status(404).json({ 
            success: false,
            message: 'Không tìm thấy người dùng' 
        });
        return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        res.status(400).json({ 
            success: false,
            message: 'Mật khẩu hiện tại không đúng' 
        });
        return;
    }

    res.status(200).json({ 
        success: true,
        message: 'Mật khẩu hiện tại chính xác' 
    });
    return;
});
