// controller/admin/appointmentController.ts
import { Request, Response } from 'express';
import appointmentService from '~/services/admin/appoinmentService copy';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all appointments with pagination, filtering and sorting
export const getAllAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      startDate,
      endDate,
      member_id,
      trainer_id,
      sortBy,
      sortOrder,
    } = req.query;

    // Parse dates if they are provided
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed' | undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      member_id: member_id as string | undefined,
      trainer_id: trainer_id as string | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const appointmentsData = await appointmentService.getAllAppointments(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch hẹn thành công',
      data: appointmentsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn',
      error: (error as Error).message
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ',
      });
      return;
    }

    const appointment = await appointmentService.getAppointmentById(id);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin lịch hẹn thành công',
      data: appointment,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin lịch hẹn:', error);
    res.status(error instanceof Error && error.message === 'Không tìm thấy lịch hẹn' ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi lấy thông tin lịch hẹn',
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ',
      });
      return;
    }

    if (!status || !['confirmed', 'pending', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ',
      });
      return;
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(
      id,
      status as 'confirmed' | 'pending' | 'cancelled' 
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái lịch hẹn thành công',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    res.status(error instanceof Error && error.message === 'Không tìm thấy lịch hẹn' ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi server khi cập nhật trạng thái lịch hẹn',
    });
  }
};

// Get member appointments
export const getMemberAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const {
      page = '1',
      limit = '10',
      search,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    if (!Types.ObjectId.isValid(memberId)) {
      res.status(400).json({
        success: false,
        message: 'ID hội viên không hợp lệ',
      });
      return;
    }

    // Parse dates if they are provided
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed' | undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const appointmentsData = await appointmentService.getMemberAppointments(memberId, options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch hẹn của hội viên thành công',
      data: appointmentsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn của hội viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn của hội viên',
      error: (error as Error).message
    });
  }
};

// Get trainer appointments
export const getTrainerAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { trainerId } = req.params;
    const {
      page = '1',
      limit = '10',
      search,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    if (!Types.ObjectId.isValid(trainerId)) {
      res.status(400).json({
        success: false,
        message: 'ID huấn luyện viên không hợp lệ',
      });
      return;
    }

    // Parse dates if they are provided
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed' | undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const appointmentsData = await appointmentService.getTrainerAppointments(trainerId, options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch hẹn của huấn luyện viên thành công',
      data: appointmentsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn của huấn luyện viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn của huấn luyện viên',
      error: (error as Error).message
    });
  }
};

// Get appointment statistics
export const getAppointmentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await appointmentService.getAppointmentStats();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê lịch hẹn thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê lịch hẹn',
      error: (error as Error).message
    });
  }
};

export default {
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getMemberAppointments,
  getTrainerAppointments,
  getAppointmentStats,
};