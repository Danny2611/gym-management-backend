// controller/admin/memberReportController.ts
import { Request, Response } from 'express';
import memberReportService from '~/services/admin/reports/memberReportService';
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

// Get member growth analysis
export const getMemberGrowthAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month'
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year'
    };

    const report = await memberReportService.getComprehensiveMemberReport(options);
    
    res.status(200).json({
      success: true,
      message: 'Lấy phân tích tăng trưởng thành viên thành công',
      data: {
        summary: report.summary,
        topGrowthPeriods: report.topGrowthPeriods,
        timeSeries: report.timeSeries.map(item => ({
          period: item.period,
          newMembers: item.newMembers,
          totalMembers: item.totalMembers,
          growthRate: item.growthRate,
          netGrowth: item.netGrowth
        }))
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy phân tích tăng trưởng thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy phân tích tăng trưởng thành viên'
    });
  }
};

// Get retention analysis
export const getRetentionAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month'
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year',
      includeRetention: true,
      includeChurn: true
    };

    const report = await memberReportService.getComprehensiveMemberReport(options);
    
    res.status(200).json({
      success: true,
      message: 'Lấy phân tích retention thành công',
      data: {
        retentionAnalysis: report.retentionAnalysis,
        churnAnalysis: report.churnAnalysis,
        retentionFunnel: report.summary.retentionFunnel,
        timeSeries: report.timeSeries.map(item => ({
          period: item.period,
          retentionRate: item.retentionRate,
          churnRate: item.churnRate,
          newMembers: item.newMembers,
          expiredMembers: item.expiredMembers
        }))
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy phân tích retention:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy phân tích retention'
    });
  }
};

// Get member status distribution
export const getMemberStatusDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: 'month' as const
    };

    const report = await memberReportService.getComprehensiveMemberReport(options);
    
    res.status(200).json({
      success: true,
      message: 'Lấy phân phối trạng thái thành viên thành công',
      data: {
        statusDistribution: report.statusDistribution,
        totalMembers: report.summary.totalMembers
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy phân phối trạng thái thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy phân phối trạng thái thành viên'
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

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
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
    console.error('Lỗi khi xuất báo cáo PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo PDF'
    });
  }
};

// Get dashboard stats for member overview
export const getDashboardMemberStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await memberReportService.getComprehensiveMemberReport({
      groupBy: 'month'
    });

    // Get current month data
    const currentMonth = new Date();
    const currentPeriod = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const currentMonthData = report.timeSeries.find(item => item.period === currentPeriod);
    const previousMonthData = report.timeSeries[report.timeSeries.length - 2];

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê dashboard thành công',
      data: {
        totalMembers: report.summary.totalMembers,
        growthRate: report.summary.growthRate,
        statusDistribution: report.statusDistribution,
        retentionFunnel: report.summary.retentionFunnel,
        currentMonth: {
          newMembers: currentMonthData?.newMembers || 0,
          activeMembers: currentMonthData?.activeMembers || 0,
          churnRate: currentMonthData?.churnRate || 0,
          retentionRate: currentMonthData?.retentionRate || 0
        },
        trends: {
          memberGrowth: currentMonthData && previousMonthData 
            ? ((currentMonthData.newMembers - previousMonthData.newMembers) / previousMonthData.newMembers) * 100
            : 0,
          retentionTrend: currentMonthData && previousMonthData
            ? (currentMonthData.retentionRate || 0) - (previousMonthData.retentionRate || 0)
            : 0
        },
        topGrowthPeriods: report.topGrowthPeriods.slice(0, 3),
        churnAnalysis: {
          averageChurnRate: report.churnAnalysis.averageChurnRate,
          highRiskPeriods: report.churnAnalysis.highRiskPeriods.slice(0, 3)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dashboard'
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