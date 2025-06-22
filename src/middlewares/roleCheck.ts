// # Kiểm tra quyền
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Member from '../models/Member';
import Role from '../models/Role';

// Middleware kiểm tra vai trò
export const checkRole = (roleNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }
      
      // Lấy thông tin người dùng
      const user = await Member.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      // Lấy thông tin vai trò
      const role = await Role.findById(user.role);
      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Người dùng không có vai trò'
        });
      }
      
      // Kiểm tra quyền
      if (!roleNames.includes(role.name)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thực hiện hành động này'
        });
      }
      
      // Lưu thông tin vai trò vào request để sử dụng ở các middleware tiếp theo
      req.userRole = role.name;
      
      next();
    } catch (error) {
      console.error('Lỗi kiểm tra quyền:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền'
      });
    }
  };
};

// Middleware chỉ cho phép Admin
export const requireAdmin = checkRole(['Admin']);

// Middleware cho phép Admin và Trainer
export const requireAdminOrTrainer = checkRole(['Admin', 'Trainer']);

// Middleware chỉ cho phép chủ sở hữu tài nguyên hoặc Admin
export const checkOwnershipOrAdmin = (modelName: string, paramIdField: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const resourceId = req.params[paramIdField];
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }
      
      // Lấy thông tin người dùng
      const user = await Member.findById(userId).populate('role');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      // Nếu là Admin, cho phép truy cập
      const role = await Role.findById(user.role);
      if (role && role.name === 'Admin') {
        req.userRole = 'Admin';
        return next();
      }
      
      // Kiểm tra nếu người dùng là chủ sở hữu tài nguyên
      const Model = mongoose.model(modelName);
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài nguyên'
        });
      }
      
      if (resource.member_id && resource.member_id.toString() === userId) {
        req.userRole = role ? role.name : 'Member';
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    } catch (error) {
      console.error('Lỗi kiểm tra quyền:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền'
      });
    }
  };
};