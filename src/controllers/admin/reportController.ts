// # Quản lý báo cáo, thống kê
import { Request, Response } from 'express';
import reportService from '~/services/admin/reportService';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get revenue report by packages
export const getRevenueByPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      packageId,
      category
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      packageId: packageId as string | undefined,
      category: category as 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip' | undefined
    };

    const revenueData = await reportService.getRevenueByPackages(options);

    res.status(200).json({
      success: true,
      message: 'Lấy báo cáo doanh thu theo gói dịch vụ thành công',
      data: revenueData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo doanh thu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo doanh thu',
    });
  }
};

// Get revenue time series data
export const getRevenueTimeSeries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month'
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year' | undefined
    };

    const timeSeriesData = await reportService.getRevenueTimeSeries(options);

    res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu chuỗi thời gian doanh thu thành công',
      data: timeSeriesData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu chuỗi thời gian doanh thu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu chuỗi thời gian doanh thu',
    });
  }
};

// Get member statistics
export const getMemberStats = async (req: AuthRequest, res: Response): Promise<void> => {
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
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year' | undefined,
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined
    };

    const memberStatsData = await reportService.getMemberStats(options);

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê thành viên thành công',
      data: memberStatsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thành viên',
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const dashboardData = await reportService.getDashboardStats(dateRange);

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê dashboard thành công',
      data: dashboardData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dashboard',
    });
  }
};

// Get advanced analytics
export const getAdvancedAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const analyticsData = await reportService.getAdvancedAnalytics(dateRange);

    res.status(200).json({
      success: true,
      message: 'Lấy phân tích nâng cao thành công',
      data: analyticsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy phân tích nâng cao:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy phân tích nâng cao',
    });
  }
};

// Export revenue report to Excel
export const exportRevenueToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      packageId,
      category
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      packageId: packageId as string | undefined,
      category: category as 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip' | undefined
    };

    // Get data first
    const revenueData = await reportService.getRevenueByPackages(options);
    
    // Export to Excel
    const excelBuffer = await reportService.exportToExcel('revenue', revenueData, options);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=bao-cao-doanh-thu-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Lỗi khi xuất báo cáo Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo Excel',
    });
  }
};

// Export member stats to Excel
export const exportMemberStatsToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
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
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year' | undefined,
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined
    };

    // Get data first
    const memberStatsData = await reportService.getMemberStats(options);
    
    // Export to Excel
    const excelBuffer = await reportService.exportToExcel('members', memberStatsData, options);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=thong-ke-thanh-vien-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Lỗi khi xuất thống kê thành viên Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất thống kê thành viên Excel',
    });
  }
};

// Export revenue report to PDF
export const exportRevenueToPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      packageId,
      category
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      packageId: packageId as string | undefined,
      category: category as 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip' | undefined
    };

    // Get data first
    const revenueData = await reportService.getRevenueByPackages(options);
    
    // Export to PDF
    const pdfBuffer = await reportService.exportToPDF('revenue', revenueData, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bao-cao-doanh-thu-${new Date().toISOString().split('T')[0]}.pdf`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Lỗi khi xuất báo cáo PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo PDF',
    });
  }
};

// Export member stats to PDF
export const exportMemberStatsToPDF = async (req: AuthRequest, res: Response): Promise<void> => {
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
      groupBy: groupBy as 'day' | 'week' | 'month' | 'year' | undefined,
      status: status as 'active' | 'inactive' | 'pending' | 'banned' | undefined
    };

    // Get data first
    const memberStatsData = await reportService.getMemberStats(options);
    
    // Export to PDF
    const pdfBuffer = await reportService.exportToPDF('members', memberStatsData, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=thong-ke-thanh-vien-${new Date().toISOString().split('T')[0]}.pdf`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Lỗi khi xuất thống kê thành viên PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất thống kê thành viên PDF',
    });
  }
};

export default {
  getRevenueByPackages,
  getRevenueTimeSeries,
  getMemberStats,
  getDashboardStats,
  getAdvancedAnalytics,
  exportRevenueToExcel,
  exportMemberStatsToExcel,
  exportRevenueToPDF,
  exportMemberStatsToPDF
};