// src/controller/user/appoinmentController.ts
import { Request, Response, NextFunction  } from 'express';
import { validationResult } from 'express-validator';
import appointmentService from '../../services/appointmentService';
import Membership from '../../models/Membership';
import { Types } from 'mongoose';


interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}
interface MemberScheduleFilters {
  status?: 'confirmed' | 'pending' | 'cancelled' | 'missed';
  startDate?: Date | string;
  endDate?: Date | string;
  trainerId?: Types.ObjectId;
  timeSlot?: string; // For filtering by time of day
}

//Tạo lịch hẹn mới với PT
export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Kiểm tra lỗi validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array()
        });
        return;
      }
  
      const memberId = req.userId;
  
      if (!memberId) {
        res.status(401).json({
          success: false,
          message: 'Bạn cần đăng nhập để đặt lịch'
        });
        return;
      }
  
      const { trainer_id, membership_id, date, startTime, endTime, location, notes } = req.body;
  
      // Kiểm tra thông tin gói tập
      const membership = await Membership.findById(membership_id);
      if (!membership) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin gói tập'
        });
        return;
      }
  
      if (String(membership.member_id) !== memberId) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền sử dụng gói tập này'
        });
        return;
      }
  
      // Tạo lịch hẹn mới
      const appointment = await appointmentService.createAppointment({
        member_id: new Types.ObjectId(memberId),
        trainer_id: new Types.ObjectId(trainer_id),
        membership_id: new Types.ObjectId(membership_id),
        date,
        startTime,
        endTime,
        location,
        notes
      });
  
      res.status(201).json({
        success: true,
        message: 'Đã đặt lịch hẹn thành công',
        data: appointment
      });
    } catch (error) {
      console.error('Lỗi khi tạo lịch hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo lịch hẹn'
      });
    }
  };

 // lịch hẹn đã đã nhận
export const getMemberSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch tập'
      });
      return;
    }
    
    // Parse query parameters for filtering
    const filters: MemberScheduleFilters = {};
    
    // Date range filters
    if (req.query.startDate) {
      filters.startDate = req.query.startDate as string;
    }
    
    if (req.query.endDate) {
      filters.endDate = req.query.endDate as string;
    }
    
    // Status filter (default is 'confirmed' in the service)
    if (req.query.status) {
      // Map frontend status to backend status if needed
      const status = req.query.status as string;
      if (status === 'upcoming' || status === 'completed') {
        filters.status = 'confirmed';
      } else if (status === 'missed') {
        filters.status = 'cancelled';
      }
    }
    
    // Trainer filter
    if (req.query.trainerId) {
      filters.trainerId = new Types.ObjectId(req.query.trainerId as string);
    }
    
    // Time slot filter
    if (req.query.timeSlot) {
      filters.timeSlot = req.query.timeSlot as string;
    }
    
    // Fetch the member's schedule
    const scheduleData = await appointmentService.getMemberSchedule(memberId, filters);
    
    res.status(200).json({
      success: true,
      message: 'Lấy lịch tập thành công',
      data: scheduleData
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch tập của member:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch tập'
    });
  }
};

//Lấy tất cả các lịch hẹn của member (bất kể trạng thái)
export const getAllMemberAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch hẹn'
      });
      return;
    }
    
    // Parse query parameters for filtering
    const filters: any = {};
    
    // Date range filters
    if (req.query.startDate) {
      filters.startDate = req.query.startDate as string;
    }
    
    if (req.query.endDate) {
      filters.endDate = req.query.endDate as string;
    }
    
    // Status filter - map to backend status
    if (req.query.status && req.query.status !== 'all') {
      filters.status = req.query.status as string;
    }
    
    // Search term for trainer name or location
    if (req.query.searchTerm) {
      filters.searchTerm = req.query.searchTerm as string;
    }
    
    // Fetch all appointments
    const appointmentsData = await appointmentService.getAllMemberAppointments(memberId, filters);
    
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch hẹn thành công',
      data: appointmentsData
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn'
    });
  }
};

// Lấy thông tin chi tiết của một lịch hẹn
export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { appointmentId } = req.params;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chi tiết lịch hẹn'
      });
      return;
    }
    
    if (!appointmentId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin lịch hẹn cần xem'
      });
      return;
    }
    
    // Gọi service để lấy chi tiết lịch hẹn
    const appointment = await appointmentService.getAppointmentById(new Types.ObjectId(appointmentId));
    
    // Kiểm tra xem lịch hẹn có thuộc về member đang đăng nhập không
    if (appointment && String(appointment.member_id._id) !== memberId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch hẹn này'
      });
      return;
    }
    
    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lịch hẹn'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết lịch hẹn thành công',
      data: appointment
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết lịch hẹn:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết lịch hẹn'
    });
  }
};

//Hủy lịch hẹn
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { appointmentId } = req.params;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để hủy lịch hẹn'
      });
      return;
    }
    
    if (!appointmentId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin lịch hẹn cần hủy'
      });
      return;
    }
    
    // Gọi service để hủy lịch hẹn
    const result = await appointmentService.cancelAppointment(
      new Types.ObjectId(appointmentId), 
      new Types.ObjectId(memberId)
    );
    
    res.status(200).json({
      success: true,
      message: 'Đã hủy lịch hẹn thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi khi hủy lịch hẹn:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi hủy lịch hẹn'
    });
  }
};

// đánh dấu hoàn thành buổi tập
// Hoàn thành lịch hẹn
export const completeAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { appointmentId } = req.params;

    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để cập nhật lịch hẹn'
      });
      return;
    }

    if (!appointmentId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin lịch hẹn cần cập nhật'
      });
      return;
    }

    // Lấy thông tin lịch hẹn
    const appointment = await appointmentService.getAppointmentById(new Types.ObjectId(appointmentId));

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
      return;
    }

    // Kiểm tra quyền sở hữu
    if (!appointment.member_id.equals(new Types.ObjectId(memberId))) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lịch hẹn này'
      });
      return;
    }

    // Kiểm tra trạng thái
    if (appointment.status !== 'confirmed') {
      res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật trạng thái cho lịch hẹn đã xác nhận'
      });
      return;
    }

    const now = new Date();

    // Tính thời gian kết thúc buổi tập từ date + time.end
    const [endHour, endMinute] = appointment.time.end.split(':').map(Number);
    const appointmentEndTime = new Date(appointment.date);
    appointmentEndTime.setHours(endHour, endMinute, 0, 0);

    // Cho phép cập nhật đến 23:59:59 ngày hôm sau
    const latestAllowedTime = new Date(appointment.date);
    latestAllowedTime.setDate(latestAllowedTime.getDate() + 1);
    latestAllowedTime.setHours(23, 59, 59, 999);

    if (now < appointmentEndTime) {
      res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh dấu hoàn thành sau khi buổi tập kết thúc'
      });
      return;
    }

    if (now > latestAllowedTime) {
      res.status(400).json({
        success: false,
        message: 'Đã quá thời gian cho phép cập nhật hoàn thành buổi tập'
      });
      return;
    }

    // Cập nhật trạng thái hoàn thành
    appointment.status = 'completed';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật trạng thái lịch hẹn thành completed',
      data: appointment
    });

  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái hoàn thành:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật lịch hẹn'
    });
  }
};


export const rescheduleAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { appointmentId } = req.params;
    const { date, startTime, endTime, location, notes } = req.body;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để đổi lịch hẹn'
      });
      return;
    }
    
    if (!appointmentId || !date || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết để đổi lịch hẹn'
      });
      return;
    }
    
    // Gọi service để đổi lịch hẹn
    const result = await appointmentService.rescheduleAppointment({
      appointmentId: new Types.ObjectId(appointmentId),
      memberId: new Types.ObjectId(memberId),
      date,
      startTime,
      endTime,
      location,
      notes
    });
    
    res.status(200).json({
      success: true,
      message: 'Đã đổi lịch hẹn thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi khi đổi lịch hẹn:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi đổi lịch hẹn'
    });
  }
};

//Kiểm tra lịch trống của huấn luyện viên
export const checkTrainerAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { trainer_id, date, startTime, endTime } = req.body;
  
      if (!trainer_id || !date || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết'
        });
        return;
      }
  
      const isAvailable = await appointmentService.isTrainerAvailable(
        new Types.ObjectId(trainer_id),
        date,
        startTime,
        endTime
      );
  
      res.status(200).json({
        success: true,
        isAvailable
      });
    } catch (error) {
      console.error('Lỗi khi kiểm tra lịch trống:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý yêu cầu'
      });
    }
  };

export const getUpcomingAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch hẹn tuần tới'
      });
      return;
    }

    const nextAppointmentLogData= await appointmentService.getUpcomingAppointments(memberId);

    res.status(200).json({
      success: true,
      message: 'Lấy lịch hẹn tuần sau',
      data: nextAppointmentLogData
    });
  } catch (error: any) {
    console.error('Lỗi lấy lịch hẹn tuần sau:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch hẹn tuần sau'
    });
  }
};


export default {
  createAppointment,
  getAllMemberAppointments,
  getAppointmentById,
  cancelAppointment,
  completeAppointment,
  checkTrainerAvailability,
  rescheduleAppointment,
  getUpcomingAppointments,
  getMemberSchedule
};