// src/controllers/user/progressController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import progressTrackingService from '../../services/progressTrackingService';
import { Types } from 'mongoose';
import { AuthRequest } from '../../types/auth';



export const getLatestBodyMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chỉ số cơ thể'
      });
      return;
    }

    const latestMetrics = await progressTrackingService.getLatestBodyMetrics(new Types.ObjectId(memberId));
    
    res.status(200).json({
      success: true,
      message: 'Lấy chỉ số cơ thể mới nhất thành công',
      data: latestMetrics
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chỉ số cơ thể mới nhất:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chỉ số cơ thể mới nhất'
    });
  }
};

export const getInitialBodyMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chỉ số cơ thể ban đầu'
      });
      return;
    }

    const initialMetrics = await progressTrackingService.getInitialBodyMetrics(new Types.ObjectId(memberId));
    
    res.status(200).json({
      success: true,
      message: 'Lấy chỉ số cơ thể ban đầu thành công',
      data: initialMetrics
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chỉ số cơ thể ban đầu:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chỉ số cơ thể ban đầu'
    });
  }
};

export const getPreviousMonthBodyMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chỉ số cơ thể tháng trước'
      });
      return;
    }

    const previousMetrics = await progressTrackingService.getPreviousMonthBodyMetrics(new Types.ObjectId(memberId));
    
    res.status(200).json({
      success: true,
      message: 'Lấy chỉ số cơ thể tháng trước thành công',
      data: previousMetrics
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chỉ số cơ thể tháng trước:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chỉ số cơ thể tháng trước'
    });
  }
};

export const getBodyMetricsComparison = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem so sánh chỉ số cơ thể'
      });
      return;
    }

    const comparison = await progressTrackingService.getBodyMetricsComparison(new Types.ObjectId(memberId));
    
    res.status(200).json({
      success: true,
      message: 'Lấy so sánh chỉ số cơ thể thành công',
      data: comparison
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy so sánh chỉ số cơ thể:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy so sánh chỉ số cơ thể'
    });
  }
};

export const updateBodyMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để cập nhật chỉ số cơ thể'
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

    const { weight, height, muscle_mass, body_fat } = req.body;

    // Đảm bảo có ít nhất một chỉ số được cập nhật
    if (!weight && !height && !muscle_mass && !body_fat) {
      res.status(400).json({
        success: false,
        message: 'Cần cung cấp ít nhất một chỉ số cơ thể để cập nhật'
      });
      return;
    }

    const bodyMetrics = await progressTrackingService.updateBodyMetrics({
      member_id: new Types.ObjectId(memberId),
      weight,
      height,
      muscle_mass,
      body_fat
    });

    res.status(201).json({
      success: true,
      message: 'Cập nhật chỉ số cơ thể thành công',
      data: bodyMetrics
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật chỉ số cơ thể:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật chỉ số cơ thể'
    });
  }
};

export const getBodyStatsProgressByMonth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem tiến độ chỉ số cơ thể'
      });
      return;
    }

    // Lấy tham số months từ query string, mặc định là 6
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    
    if (isNaN(months) || months <= 0) {
      res.status(400).json({
        success: false,
        message: 'Số tháng không hợp lệ'
      });
      return;
    }

    const progressData = await progressTrackingService.getBodyStatsProgressByMonth(
      new Types.ObjectId(memberId),
      months
    );
    
    res.status(200).json({
      success: true,
      message: 'Lấy tiến độ chỉ số cơ thể theo tháng thành công',
      data: progressData
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy tiến độ chỉ số cơ thể theo tháng:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy tiến độ chỉ số cơ thể theo tháng'
    });
  }
};

export const getFitnessRadarData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem dữ liệu radar thể lực'
      });
      return;
    }

    const radarData = await progressTrackingService.getFitnessRadarData(new Types.ObjectId(memberId));
    
    res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu radar thể lực thành công',
      data: radarData
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy dữ liệu radar thể lực:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy dữ liệu radar thể lực'
    });
  }
};

export const calculateBodyMetricsChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để tính toán thay đổi chỉ số cơ thể'
      });
      return;
    }

    // Lấy dữ liệu so sánh
    const comparison = await progressTrackingService.getBodyMetricsComparison(new Types.ObjectId(memberId));
    
    if (!comparison.current || !comparison.initial) {
      res.status(404).json({
        success: false,
        message: 'Không có đủ dữ liệu để tính toán thay đổi'
      });
      return;
    }

    // Tính toán phần trăm thay đổi cho các chỉ số
    const changes = {
      weight: progressTrackingService.calculatePercentChange(
        comparison.current.weight,
        comparison.initial.weight
      ),
      body_fat: progressTrackingService.calculatePercentChange(
        comparison.current.body_fat,
        comparison.initial.body_fat
      ),
      muscle_mass: progressTrackingService.calculatePercentChange(
        comparison.current.muscle_mass,
        comparison.initial.muscle_mass
      ),
      bmi: progressTrackingService.calculatePercentChange(
        comparison.current.bmi,
        comparison.initial.bmi
      )
    };
    
    res.status(200).json({
      success: true,
      message: 'Tính toán thay đổi chỉ số cơ thể thành công',
      data: {
        changes,
        current: comparison.current,
        initial: comparison.initial
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi tính toán thay đổi chỉ số cơ thể:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tính toán thay đổi chỉ số cơ thể'
    });
  }
};

export const getFormattedMonthlyBodyMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chỉ số cơ thể'
      });
      return;
    }

    const latestMetrics = await progressTrackingService.getFormattedMonthlyBodyMetrics(new Types.ObjectId(memberId));
    
    res.status(200).json({
      success: true,
      message: 'Lấy chỉ số cơ thể mới nhất thành công',
      data: latestMetrics
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chỉ số cơ thể mới nhất:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chỉ số cơ thể mới nhất'
    });
  }
};


export default {
  getLatestBodyMetrics,
  getInitialBodyMetrics,
  getPreviousMonthBodyMetrics,
  getBodyMetricsComparison,
  updateBodyMetrics,
  getBodyStatsProgressByMonth,
  getFitnessRadarData,
  calculateBodyMetricsChange,
  getFormattedMonthlyBodyMetrics,



};