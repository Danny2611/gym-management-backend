// # Quản lý đăng ký thành viên
// controller/admin/membershipController.ts
import { Request, Response } from 'express';
import membershipService from '../../services/admin/membershipService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all memberships with pagination, filtering and sorting
export const getAllMemberships = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      memberId,
      packageId,
      sortBy,
      sortOrder,
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'active' | 'expired' | 'pending' | 'paused' | undefined,
      memberId: memberId as string | undefined,
      packageId: packageId as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const membershipsData = await membershipService.getAllMemberships(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đăng ký thành viên thành công',
      data: membershipsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đăng ký thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đăng ký thành viên',
    });
  }
};

// Get membership by ID
export const getMembershipById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID đăng ký thành viên không hợp lệ',
      });
      return;
    }

    const membership = await membershipService.getMembershipById(id);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin đăng ký thành viên thành công',
      data: membership,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin đăng ký thành viên:', error);
    res.status(error.message === 'Không tìm thấy đăng ký thành viên' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin đăng ký thành viên',
    });
  }
};

// Delete membership
export const deleteMembership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.body;

    await membershipService.deleteMembership(id);

    res.status(200).json({
      success: true,
      message: 'Xóa đăng ký thành viên thành công',
    });
  } catch (error: any) {
    console.error('Lỗi khi xóa đăng ký thành viên:', error);
    
    // Handle specific error for deleting pending memberships
    if (error.message === 'Chỉ được xóa các đăng ký đang chờ và đã tạo hơn 1 tuần') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(error.message === 'Không tìm thấy đăng ký thành viên' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa đăng ký thành viên',
    });
  }
};

// Get membership statistics
export const getMembershipStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await membershipService.getMembershipStats();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê đăng ký thành viên thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê đăng ký thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đăng ký thành viên',
    });
  }
};

export default {
  getAllMemberships,
  getMembershipById,
  deleteMembership,
  getMembershipStats,
};