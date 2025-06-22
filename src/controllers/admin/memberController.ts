// # Quản lý hội viên
// controller/admin/memberController.ts
import { Request, Response } from 'express';
import memberService from '~/services/admin/memberService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all members with pagination and filters

export const getAllMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  

  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      sortBy,
      sortOrder,
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const membersData = await memberService.getAllMembers(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách hội viên thành công',
      data: membersData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hội viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hội viên',
    });
  }
};

// Get member by ID
export const getMemberById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu ID hội viên'
      });
      return;
    }

    const member = await memberService.getMemberById(memberId);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin hội viên thành công',
      data: member
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin hội viên:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin hội viên'
    });
  }
};

// Create new member
export const createMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberData = req.body;

    if (!memberData.name || !memberData.email || !memberData.password ) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (tên, email, mật khẩu )'
      });
      return;
    }

    const newMember = await memberService.createMember(memberData);

    res.status(201).json({
      success: true,
      message: 'Tạo hội viên mới thành công',
      data: newMember
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo hội viên mới:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo hội viên mới'
    });
  }
};

// Update member by ID
export const updateMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const updateData = req.body;

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu ID hội viên'
      });
      return;
    }

    const updatedMember = await memberService.updateMember(memberId, updateData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật hội viên thành công',
      data: updatedMember
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật hội viên:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật hội viên'
    });
  }
};

// Update member status
export const updateMemberStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { status } = req.body;

    if (!memberId || !status) {
      res.status(400).json({
        success: false,
        message: 'Thiếu ID hội viên hoặc trạng thái'
      });
      return;
    }

    const updatedMember = await memberService.updateMemberStatus(memberId, status);

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái hội viên thành công',
      data: updatedMember
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái hội viên:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật trạng thái hội viên'
    });
  }
};

// Delete member by ID
export const deleteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu ID hội viên'
      });
      return;
    }

    await memberService.deleteMember(memberId);

    res.status(200).json({
      success: true,
      message: 'Xóa hội viên thành công'
    });
  } catch (error: any) {
    console.error('Lỗi khi xóa hội viên:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa hội viên'
    });
  }
};

// Get member statistics
export const getMemberStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await memberService.getMemberStats();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê hội viên thành công',
      data: stats
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê hội viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê hội viên'
    });
  }
};

// Export the controller functions
export default {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getMemberStats,
  updateMemberStatus
};