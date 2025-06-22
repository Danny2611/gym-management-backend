// controller/admin/memberReportController.ts
import { Request, Response } from 'express';
import memberReportService from '../../../services/admin/reports/memberReportService';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get basic member statistics
export const getMemberStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
      status,
      includeRetention = 'false',
      includeChurn = 'false'
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined,
      includeRetention: includeRetention === 'true',
      includeChurn: includeChurn === 'true'
    };

    // Validate date range
    if (options.startDate && options.endDate && options.startDate > options.endDate) {
      res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc'
      });
      return;
    }

    const stats = await memberReportService.getMemberStats(options);

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê thành viên thành công',
      data: stats,
      meta: {
        total: stats.length,
        groupBy: options.groupBy,
        dateRange: {
          startDate: options.startDate,
          endDate: options.endDate
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thành viên'
    });
  }
};

// Get comprehensive member report
export const getComprehensiveMemberReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
      status,
      cohortAnalysis = 'false'
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined,
      cohortAnalysis: cohortAnalysis === 'true'
    };

    // Validate date range
    if (options.startDate && options.endDate && options.startDate > options.endDate) {
      res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc'
      });
      return;
    }

    const report = await memberReportService.getComprehensiveMemberReport(options);

    res.status(200).json({
      success: true,
      message: 'Lấy báo cáo tổng hợp thành viên thành công',
      data: report
    });
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo tổng hợp thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo tổng hợp thành viên'
    });
  }
};


// Export member report to Excel
export const exportMemberReportToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
      status
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined
    };

    const report = await memberReportService.getComprehensiveMemberReport(options);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `member-report-${timestamp}.xlsx`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);

    await memberReportService.exportMemberStatsToExcel(report, filePath);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Lỗi khi gửi file:', err);
        res.status(500).json({
          success: false,
          message: 'Lỗi khi tải file'
        });
      } else {
        // Clean up file after sending
        setTimeout(() => {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error('Lỗi khi xóa file tạm:', unlinkErr);
          });
        }, 10000); // Delete after 10 seconds
      }
    });
  } catch (error) {
    console.error('Lỗi khi xuất báo cáo Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo Excel'
    });
  }
};

// Export member report to PDF
export const exportMemberReportToPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
      status
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined
    };

    const report = await memberReportService.getComprehensiveMemberReport(options);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `member-report-${timestamp}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);

   await memberReportService.exportMemberStatsToPDF(report, filePath);

// KHÔNG CẦN kiểm tra tồn tại nữa nếu bạn đã resolve sau khi finish ghi

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

res.sendFile(filePath, (err) => {
  if (err) {
    console.error('Lỗi khi gửi file:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải file'
    });
  } else {
    setTimeout(() => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Lỗi khi xóa file tạm:', unlinkErr);
      });
    }, 10000);
  }
});

  } catch (error) {
    console.error('Lỗi khi xuất báo cáo PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo PDF'
    });
  }
};

export default {
  getMemberStats,
  getComprehensiveMemberReport,
  exportMemberReportToExcel,
  exportMemberReportToPDF,
  
  
  // getMemberGrowthAnalysis,
  // getRetentionAnalysis,
  // getMemberStatusDistribution,
  // getDashboardMemberStats,

  
};