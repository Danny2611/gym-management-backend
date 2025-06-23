
// src/controller/user/memberController
import { Request, Response } from 'express';
import Member from '../../models/Member';
import { uploadFile } from '../../middlewares/uploadFile';
import { validateMemberUpdate } from '../../utils/validators/memberValidator';
import { AuthRequest } from '../../types/auth';
import { deleteCloudinaryFile } from '../../middlewares/uploadFile';

export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
      return;
    }

    uploadFile(req, res, async (err) => {
      if (err) {
        console.error('Upload lỗi:', err);
        res.status(400).json({
          success: false,
          message: 'Lỗi khi tải lên avatar'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Không tìm thấy file avatar'
        });
        return;
      }

      const avatarUrl = (req.file as any).path;
      const publicId = (req.file as any).filename;

      const member = await Member.findById(userId);
      if (!member) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin hội viên'
        });
        return;
      }

      // Xóa ảnh cũ nếu có
      if (member.avatarPublicId) {
        await deleteCloudinaryFile(member.avatarPublicId) ;
      }

      // Cập nhật avatar mới
      member.avatar = avatarUrl;
      member.avatarPublicId = publicId;
      member.updated_at = new Date();
      await member.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật avatar thành công',
        data: {
          avatar: avatarUrl
        }
      });
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật avatar'
    });
  }
};


/**
 * Get the current user's profile
 */
export const getCurrentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
      return;
    }

    const member = await Member.findById(userId)
      .select('-password')
      .populate('role', 'name');

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin hội viên'
      });
      return;
    }

    res.status(200).json({
      success: true,
       data: {
        ...member.toObject(),
       roleName: ((member.role as any)?.name || "").toLowerCase(), // Lấy tên role
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin hội viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin hội viên'
    });
  }
};

/**
 * Update current user's profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
      return;
    }

    // Lấy thông tin user hiện tại
    const member = await Member.findById(userId);
    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin hội viên'
      });
      return;
    }

    // Tạo object chứa chỉ các trường thay đổi
    const updateData: Record<string, any> = {};
    const currentData = {
      name: member.name,
      gender: member.gender,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      address: member.address,
      email: member.email
    };

    // Kiểm tra từng trường và chỉ thêm vào updateData nếu có thay đổi
    if (req.body.name !== undefined && req.body.name !== currentData.name) {
      updateData.name = req.body.name;
    }
    if (req.body.gender !== undefined && req.body.gender !== currentData.gender) {
      updateData.gender = req.body.gender;
    }
    if (req.body.phone !== undefined && req.body.phone !== currentData.phone) {
      updateData.phone = req.body.phone;
    }
    if (req.body.dateOfBirth !== undefined) {
      const newDate = new Date(req.body.dateOfBirth);
      if (!isNaN(newDate.getTime()) && newDate.toISOString() !== currentData.dateOfBirth?.toISOString()) {
        updateData.dateOfBirth = newDate;
      }
    }
    if (req.body.address !== undefined && req.body.address !== currentData.address) {
      updateData.address = req.body.address;
    }
    if (req.body.email !== undefined && req.body.email !== currentData.email) {
      updateData.email = req.body.email;
    }

    // Nếu không có trường nào thay đổi
    if (Object.keys(updateData).length === 0) {
      res.status(200).json({
        success: true,
        message: 'Không có thông tin nào được cập nhật',
        data: member
      });
      return;
    }

    // Validate chỉ các trường thay đổi
    req.body = updateData; // Ghi đè req.body để validation
    const isValid = await validateMemberUpdate(req, res);
    if (!isValid) return;

    // Cập nhật các trường thay đổi
    Object.assign(member, updateData);
    member.updated_at = new Date();
    await member.save();

    const updatedMember = await Member.findById(userId).select('-password');
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedMember
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin'
    });
  }
};


/**
 * Change email (requires verification)
 */
export const updateEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { email } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
      return;
    }

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email mới không được để trống'
      });
      return;
    }

    // Check if email is already used
    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng bởi tài khoản khác'
      });
      return;
    }

    // Find member
    const member = await Member.findById(userId);
    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin hội viên'
      });
      return;
    }

    // Here you would typically send verification email
    // For now, we'll update directly
    member.email = email;
    member.isVerified = false; // Require new verification
    member.updated_at = new Date();
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật email, vui lòng xác thực email mới',
      data: {
        email: email
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật email:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật email'
    });
  }
};

/**
 * Get member profile by ID (for public or authorized view)
 */
export const getMemberById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId).select('id name avatar');

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin hội viên'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin hội viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin hội viên'
    });
  }
};

/**
 * Deactivate the user account (not a full delete)
 */
export const deactivateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu để xác nhận'
      });
      return;
    }

    // Get member
    const member = await Member.findById(userId);
    
    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin hội viên'
      });
      return;
    }

    // Verify password (assuming you have a method for this)
    const isPasswordValid = await member.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu không chính xác'
      });
      return;
    }

    // Deactivate account
    member.status = 'inactive';
    member.updated_at = new Date();
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Tài khoản đã bị vô hiệu hóa'
    });
  } catch (error) {
    console.error('Lỗi khi vô hiệu hóa tài khoản:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi vô hiệu hóa tài khoản'
    });
  }
};

export default {
   getCurrentProfile,
    updateProfile,
    updateAvatar,
    updateEmail,
    getMemberById,
    deactivateAccount
}