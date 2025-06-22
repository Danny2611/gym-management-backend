// # Quản lý gói tập
// controller/admin/packageController.ts
import { Request, Response } from 'express';
import packageService from '~/services/admin/packageService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all packages with pagination, filtering and sorting
export const getAllPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      category,
      popular,
      sortBy,
      sortOrder,
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'active' | 'inactive' | undefined,
      category: category as 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip' | undefined,
      popular: popular === 'true' ? true : popular === 'false' ? false : undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const packagesData = await packageService.getAllPackages(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách gói dịch vụ thành công',
      data: packagesData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách gói dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách gói dịch vụ',
    });
  }
};

// Get package by ID
export const getPackageById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;
    if (!Types.ObjectId.isValid(packageId)) {
      res.status(400).json({
        success: false,
        message: 'ID gói dịch vụ không hợp lệ',
      });
      return;
    }

    const packageData = await packageService.getPackageById(packageId);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin gói dịch vụ thành công',
      data: packageData,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin gói dịch vụ:', error);
    res.status(error.message === 'Không tìm thấy gói dịch vụ' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin gói dịch vụ',
    });
  }
};

// Create a new package
export const createPackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      max_members,
      price,
      duration,
      description,
      benefits,
      status,
      category,
      popular,
      training_sessions,
      session_duration,
      packageDetail
    } = req.body;

    if (!name || price === undefined || duration === undefined) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc của gói dịch vụ',
      });
      return;
    }

    const packageData = {
      name,
      max_members,
      price,
      duration,
      description,
      benefits: benefits || [],
      status: status || 'active',
      category,
      popular,
      training_sessions,
      session_duration
    };

    const newPackage = await packageService.createPackage(packageData, packageDetail);

    res.status(201).json({
      success: true,
      message: 'Tạo gói dịch vụ mới thành công',
      data: newPackage,
    });
  } catch (error) {
    console.error('Lỗi khi tạo gói dịch vụ mới:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo gói dịch vụ mới',
    });
  }
};

// Update an existing package
export const updatePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;    
    const {
      name,
      max_members,
      price,
      duration,
      description,
      benefits,
      status,
      category,
      popular,
      training_sessions,
      session_duration,
      packageDetail
    } = req.body;

    if (!Types.ObjectId.isValid(packageId)) {
      res.status(400).json({
        success: false,
        message: 'ID gói dịch vụ không hợp lệ',
      });
      return;
    }

    const packageData = {
      name,
      max_members,
      price,
      duration, 
      description,
      benefits,
      status,
      category,
      popular,
      training_sessions,
      session_duration
    };

    // Remove undefined fields
    Object.keys(packageData).forEach(key => {
      if (packageData[key as keyof typeof packageData] === undefined) {
        delete packageData[key as keyof typeof packageData];
      }
    });

    const updatedPackage = await packageService.updatePackage(packageId, packageData, packageDetail);

    res.status(200).json({
      success: true,
      message: 'Cập nhật gói dịch vụ thành công',
      data: updatedPackage,
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật gói dịch vụ:', error);
    res.status(error.message === 'Không tìm thấy gói dịch vụ' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật gói dịch vụ',
    });
  }
};

// Delete (soft delete) a package
export const deletePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;    
    if (!Types.ObjectId.isValid(packageId)) {
      res.status(400).json({
        success: false,
        message: 'ID gói dịch vụ không hợp lệ',
      });
      return;
    }

    await packageService.deletePackage(packageId);

    res.status(200).json({
      success: true,
      message: 'Xóa gói dịch vụ thành công',
    });
  } catch (error: any) {
    console.error('Lỗi khi xóa gói dịch vụ:', error);
    res.status(error.message === 'Không tìm thấy gói dịch vụ' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa gói dịch vụ',
    });
  }
};

// Toggle package status (active/inactive)
export const togglePackageStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;
    
    if (!Types.ObjectId.isValid(packageId)) {
      res.status(400).json({
        success: false,
        message: 'ID gói dịch vụ không hợp lệ',
      });
      return;
    }

    const updatedPackage = await packageService.togglePackageStatus(packageId);

    res.status(200).json({
      success: true,
      message: `Gói dịch vụ đã được ${updatedPackage.status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: updatedPackage,
    });
  } catch (error: any) {
    console.error('Lỗi khi thay đổi trạng thái gói dịch vụ:', error);
    res.status(error.message === 'Không tìm thấy gói dịch vụ' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi thay đổi trạng thái gói dịch vụ',
    });
  }
};

// Get package statistics
export const getPackageStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await packageService.getPackageStats();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê gói dịch vụ thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê gói dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê gói dịch vụ',
    });
  }
};

export default {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  getPackageStats,
};