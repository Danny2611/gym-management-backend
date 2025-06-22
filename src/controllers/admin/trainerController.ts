// # Quản lý PT
// controllers/admin/trainerController.ts
import { Request, Response } from 'express';
import trainerService from '~/services/admin/trainerService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all trainers with pagination, filtering and sorting
export const getAllTrainers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
       status,
      specialization,
      experience,
      sortBy,
      sortOrder,
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'active' | 'inactive' | undefined,
      specialization: specialization as string | undefined,
      experience: experience ? parseInt(experience as string, 10) : undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const trainersData = await trainerService.getAllTrainers(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách huấn luyện viên thành công',
      data: trainersData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách huấn luyện viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách huấn luyện viên',
      error: (error as Error).message,
    });
  }
};

// Get trainer by ID
export const getTrainerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID huấn luyện viên không hợp lệ',
      });
      return;
    }

    const trainer = await trainerService.getTrainerById(id);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin huấn luyện viên thành công',
      data: trainer,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin huấn luyện viên:', error);
    res.status(error instanceof Error && error.message === 'Không tìm thấy huấn luyện viên' ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi lấy thông tin huấn luyện viên',
    });
  }
};

// Create a new trainer
export const createTrainer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trainerData = req.body;

    // Basic validation
    if (!trainerData.name || !trainerData.email) {
      res.status(400).json({
        success: false,
        message: 'Tên và email là bắt buộc',
      });
      return;
    }

    const newTrainer = await trainerService.createTrainer(trainerData);

    res.status(201).json({
      success: true,
      message: 'Tạo huấn luyện viên thành công',
      data: newTrainer,
    });
  } catch (error) {
    console.error('Lỗi khi tạo huấn luyện viên:', error);
    res.status(error instanceof Error && error.message.includes('Email đã tồn tại') ? 400 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi tạo huấn luyện viên',
    });
  }
};

// Update an existing trainer
export const updateTrainer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const trainerData = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID huấn luyện viên không hợp lệ',
      });
      return;
    }

    const updatedTrainer = await trainerService.updateTrainer(id, trainerData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật huấn luyện viên thành công',
      data: updatedTrainer,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật huấn luyện viên:', error);
    const status = error instanceof Error ? 
      (error.message === 'Không tìm thấy huấn luyện viên' ? 404 : 
       error.message.includes('Email đã tồn tại') ? 400 : 500) : 500;
    
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi cập nhật huấn luyện viên',
    });
  }
};

// Delete a trainer
export const deleteTrainer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID huấn luyện viên không hợp lệ',
      });
      return;
    }

    await trainerService.deleteTrainer(id);

    res.status(200).json({
      success: true,
      message: 'Xóa huấn luyện viên thành công',
    });
  } catch (error) {
    console.error('Lỗi khi xóa huấn luyện viên:', error);
    res.status(error instanceof Error && error.message === 'Không tìm thấy huấn luyện viên' ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi xóa huấn luyện viên',
    });
  }
};


// Toggle trainer status (active/inactive)
export const toggleTrainerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('id:', id)
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID trainer không hợp lệ',
      });
      return;
    }

    const updatedTrainer = await trainerService.toggleTrainerStatus(id);

    res.status(200).json({
      success: true,
      message: `Trainer đã được ${updatedTrainer.status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: updatedTrainer,
    });
  } catch (error: any) {
    console.error('Lỗi khi thay đổi trạng thái trainer:', error);
    res.status(error.message === 'Không tìm thấy trainer' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi thay đổi trạng thái trainer',
    });
  }
};

// Update trainer schedule
export const updateTrainerSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID huấn luyện viên không hợp lệ',
      });
      return;
    }

    if (!Array.isArray(schedule)) {
      res.status(400).json({
        success: false,
        message: 'Lịch làm việc phải là một mảng',
      });
      return;
    }

    const updatedTrainer = await trainerService.updateTrainerSchedule(id, schedule);

    res.status(200).json({
      success: true,
      message: 'Cập nhật lịch làm việc thành công',
      data: updatedTrainer,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch làm việc:', error);
    let status = 500;
    if (error instanceof Error) {
      if (error.message === 'Không tìm thấy huấn luyện viên') {
        status = 404;
      } else if (
        error.message.includes('Lịch làm việc phải') ||
        error.message.includes('Ngày trong tuần phải') ||
        error.message.includes('Phải cung cấp thời gian') ||
        error.message.includes('Thời gian phải theo định dạng') ||
        error.message.includes('Thời gian kết thúc phải sau')
      ) {
        status = 400;
      }
    }
    
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi cập nhật lịch làm việc',
    });
  }
};

// Get trainer availability by date range
export const getTrainerAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID huấn luyện viên không hợp lệ',
      });
      return;
    }

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và kết thúc là bắt buộc',
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ',
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu phải trước ngày kết thúc',
      });
      return;
    }

    const availability = await trainerService.getTrainerAvailability(id, start, end);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin khả dụng của huấn luyện viên thành công',
      data: availability,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khả dụng của huấn luyện viên:', error);
    res.status(error instanceof Error && error.message === 'Không tìm thấy huấn luyện viên' ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi lấy thông tin khả dụng của huấn luyện viên',
    });
  }
};

// Get trainer statistics
export const getTrainerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await trainerService.getTrainerStats();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê huấn luyện viên thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê huấn luyện viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê huấn luyện viên',
      error: (error as Error).message,
    });
  }
};

export default {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  updateTrainerSchedule,
  getTrainerAvailability,
  getTrainerStats,
  toggleTrainerStatus
};