// src/controllers/user/workoutController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import workoutService from '../../services/workoutService';
import { Types } from 'mongoose';
import { MonthComparison, WeeklyWorkout } from '../../types/workoutSchedule';
import { AuthRequest } from '../../types/auth';


export const getWorkoutSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để sử dụng chức năng này'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { muscleGroup, goal, level, equipment } = req.body;

    const suggestions = await workoutService.createWorkoutSuggestion({
      muscleGroup,
      goal,
      level,
      equipment
    });

    res.status(200).json({
      success: true,
      message: 'Lấy gợi ý bài tập thành công',
      data: suggestions
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy gợi ý bài tập:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy gợi ý bài tập'
    });
  }
};

export const createWorkoutSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để tạo lịch tập'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { 
      date, 
      timeStart, 
      duration, 
      muscle_groups, 
      location, 
      notes, 
      exercises, 
      workout_suggestion_id 
    } = req.body;

    const workoutSchedule = await workoutService.createWorkoutSchedule({
      member_id: new Types.ObjectId(memberId),
      date: new Date(date),
      timeStart: new Date(timeStart),
      duration,
      muscle_groups,
      location,
      notes,
      exercises,
      workout_suggestion_id: workout_suggestion_id ? new Types.ObjectId(workout_suggestion_id) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lịch tập cá nhân thành công',
      data: workoutSchedule
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch tập cá nhân:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo lịch tập cá nhân'
    });
  }
};

export const getMemberWorkoutSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const filters: any = {};
    
    // Date range filters
    if (req.query.startDate) {
      filters.startDate = req.query.startDate as string;
    }
    
    if (req.query.endDate) {
      filters.endDate = req.query.endDate as string;
    }
    
    // Status filter
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    const schedules = await workoutService.getMemberWorkoutSchedules(memberId, filters);
    
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch tập thành công',
      data: schedules
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách lịch tập:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách lịch tập'
    });
  }
};

export const getWorkoutScheduleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { scheduleId } = req.params;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chi tiết lịch tập'
      });
      return;
    }
    
    if (!scheduleId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin lịch tập cần xem'
      });
      return;
    }
    
    const schedule = await workoutService.getWorkoutScheduleById(scheduleId);
    
    if (!schedule) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lịch tập'
      });
      return;
    }
    
    // Kiểm tra xem lịch tập có thuộc về member đang đăng nhập không
    if (schedule.member_id && String(schedule.member_id._id) !== memberId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch tập này'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết lịch tập thành công',
      data: schedule
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết lịch tập:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết lịch tập'
    });
  }
};

export const updateWorkoutScheduleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { scheduleId } = req.params;
    const { status } = req.body;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để cập nhật trạng thái lịch tập'
      });
      return;
    }
    
    if (!scheduleId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin lịch tập cần cập nhật'
      });
      return;
    }
    
    if (!status || !['upcoming', 'completed', 'missed'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
      return;
    }
    
    // Kiểm tra xem lịch tập có tồn tại và thuộc về member không
    const existingSchedule = await workoutService.getWorkoutScheduleById(scheduleId);
    if (!existingSchedule) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin lịch tập'
      });
      return;
    }
    
    if (String(existingSchedule.member_id._id) !== memberId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lịch tập này'
      });
      return;
    }
    
    const updatedSchedule = await workoutService.updateWorkoutScheduleStatus(scheduleId, status as any);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái lịch tập thành công',
      data: updatedSchedule
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái lịch tập:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật trạng thái lịch tập'
    });
  }
};


export const getWeeklyWorkoutStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem thống kê tập luyện tuần'
      });
      return;
    }

    const weeklyWorkoutData: WeeklyWorkout[] = await workoutService.getWeeklyWorkoutStats(
      memberId, 
      req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      req.query.endDate ? new Date(req.query.endDate as string) : undefined
    );

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê tập luyện tuần thành công',
      data: weeklyWorkoutData
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thống kê tập luyện tuần:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thống kê tập luyện tuần'
    });
  }
};

export const getMonthComparisonStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem thống kê so sánh tháng'
      });
      return;
    }

    const monthComparisonData: MonthComparison = await workoutService.getMonthComparisonStats(memberId);

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê so sánh tháng thành công',
      data: monthComparisonData
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thống kê so sánh tháng:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thống kê so sánh tháng'
    });
  }
};

export const getLast7DaysWorkouts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch tập gần đây'
      });
      return;
    }

    const RecentWorkoutLogData= await workoutService.getLast7DaysWorkouts(memberId);

    res.status(200).json({
      success: true,
      message: 'Lấy lịch tập 7 ngày gần đây thành công',
      data: RecentWorkoutLogData
    });
  } catch (error: any) {
    console.error('Lỗi lấy lịch tập 7 ngày gần đây:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch tập 7 ngày gần đây'
    });
  }
};

export const getUpcomingWorkouts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch tập gần đây'
      });
      return;
    }

    const nextWorkoutLogData= await workoutService.getUpcomingWorkouts(memberId);

    res.status(200).json({
      success: true,
      message: 'Lấy lịch tập tuần sau',
      data: nextWorkoutLogData
    });
  } catch (error: any) {
    console.error('Lỗi lấy lịch tập tuần sau:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch tập tuần sau'
    });
  }
};




export default {
  getWorkoutSuggestions,
  createWorkoutSchedule,
  getMemberWorkoutSchedules,
  getWorkoutScheduleById,
  updateWorkoutScheduleStatus,
  getWeeklyWorkoutStats,
  getMonthComparisonStats,
  getUpcomingWorkouts,
  getLast7DaysWorkouts
  
};