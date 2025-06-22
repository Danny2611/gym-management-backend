import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import {
  getRevenueByPackages,
  getRevenueTimeSeries,
  getAdvancedAnalytics,
  getComprehensiveRevenueReport,
  exportRevenueReportToExcel,
  exportRevenueReportToPDF,
  RevenueReportOptions,
  ReportDateRange
} from '~/services/admin/reports/revenueReportService';

// Utility function to validate and parse date
const parseDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
};

// Utility function to validate groupBy parameter
const validateGroupBy = (groupBy: string): 'day' | 'week' | 'month' | 'year' => {
  const validGroupBy = ['day', 'week', 'month', 'year'];
  return validGroupBy.includes(groupBy) ? groupBy as 'day' | 'week' | 'month' | 'year' : 'month';
};

// Utility function to validate category parameter
const validateCategory = (category: string): 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip' | undefined => {
  const validCategories = ['basic', 'fitness', 'premium', 'platinum', 'vip'];
  return validCategories.includes(category) ? category as 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip' : undefined;
};

// Get revenue report by packages
export const getRevenueByPackagesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, packageId, category, groupBy } = req.query;

    const options: RevenueReportOptions = {
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      packageId: packageId as string,
      category: validateCategory(category as string),
      groupBy: validateGroupBy(groupBy as string || 'month')
    };

    const revenueData = await getRevenueByPackages(options);

    res.status(200).json({
      success: true,
      message: 'Revenue by packages retrieved successfully',
      data: revenueData,
      pagination: {
        total: revenueData.length,
        page: 1,
        limit: revenueData.length
      }
    });
  } catch (error) {
    console.error('Error in getRevenueByPackagesController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving revenue by packages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get revenue time series data
export const getRevenueTimeSeriesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy, packageId, category } = req.query;

    const options: RevenueReportOptions = {
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      groupBy: validateGroupBy(groupBy as string || 'month'),
      packageId: packageId as string,
      category: validateCategory(category as string)
    };

    const timeSeriesData = await getRevenueTimeSeries(options);

    res.status(200).json({
      success: true,
      message: 'Revenue time series data retrieved successfully',
      data: timeSeriesData,
      summary: {
        totalPeriods: timeSeriesData.length,
        totalRevenue: timeSeriesData.reduce((sum, item) => sum + item.totalRevenue, 0),
        totalSales: timeSeriesData.reduce((sum, item) => sum + item.totalSales, 0),
        groupBy: options.groupBy
      }
    });
  } catch (error) {
    console.error('Error in getRevenueTimeSeriesController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving revenue time series',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get advanced analytics
export const getAdvancedAnalyticsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange: ReportDateRange = {
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string)
    };

    const analyticsData = await getAdvancedAnalytics(dateRange);

    res.status(200).json({
      success: true,
      message: 'Advanced analytics retrieved successfully',
      data: analyticsData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getAdvancedAnalyticsController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving advanced analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get comprehensive revenue report
export const getComprehensiveRevenueReportController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy, packageId, category } = req.query;

    const options: RevenueReportOptions = {
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      groupBy: validateGroupBy(groupBy as string || 'month'),
      packageId: packageId as string,
      category: validateCategory(category as string)
    };

    const comprehensiveReport = await getComprehensiveRevenueReport(options);

    res.status(200).json({
      success: true,
      message: 'Comprehensive revenue report retrieved successfully',
      data: comprehensiveReport,
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: {
          startDate: options.startDate?.toISOString() || null,
          endDate: options.endDate?.toISOString() || null
        },
        filters: {
          groupBy: options.groupBy,
          packageId: options.packageId || null,
          category: options.category || null
        }
      }
    });
  } catch (error) {
    console.error('Error in getComprehensiveRevenueReportController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving comprehensive revenue report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export revenue report to Excel
export const exportRevenueReportToExcelController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy, packageId, category } = req.query;

    const options: RevenueReportOptions = {
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      groupBy: validateGroupBy(groupBy as string || 'month'),
      packageId: packageId as string,
      category: validateCategory(category as string)
    };

    // Get comprehensive report data
    const comprehensiveReport = await getComprehensiveRevenueReport(options);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `revenue-report-${timestamp}.xlsx`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // Export to Excel
    await exportRevenueReportToExcel(comprehensiveReport, filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to generate Excel file');
    }

    // Send file as download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

    fileStream.on('error', (error) => {
      console.error('Error reading file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error reading generated file',
          error: error.message
        });
      }
    });

  } catch (error) {
    console.error('Error in exportRevenueReportToExcelController:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error while exporting revenue report to Excel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// Export revenue report to PDF
export const exportRevenueReportToPDFController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, groupBy, packageId, category } = req.query;

    const options: RevenueReportOptions = {
      startDate: parseDate(startDate as string),
      endDate: parseDate(endDate as string),
      groupBy: validateGroupBy(groupBy as string || 'month'),
      packageId: packageId as string,
      category: validateCategory(category as string)
    };

    // Get comprehensive report data
    const comprehensiveReport = await getComprehensiveRevenueReport(options);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `revenue-report-${timestamp}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // Export to PDF
    await exportRevenueReportToPDF(comprehensiveReport, filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to generate PDF file');
    }

    // Send file as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

    fileStream.on('error', (error) => {
      console.error('Error reading file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error reading generated file',
          error: error.message
        });
      }
    });

  } catch (error) {
    console.error('Error in exportRevenueReportToPDFController:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error while exporting revenue report to PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// Get revenue dashboard summary (quick stats)
export const getRevenueDashboardController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = '30' } = req.query; // Default 30 days
    const days = parseInt(period as string) || 30;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const options: RevenueReportOptions = {
      startDate,
      endDate,
      groupBy: days <= 7 ? 'day' : days <= 31 ? 'week' : 'month'
    };

    const [revenueByPackages, timeSeries, analytics] = await Promise.all([
      getRevenueByPackages(options),
      getRevenueTimeSeries(options),
      getAdvancedAnalytics({ startDate, endDate })
    ]);

    const totalRevenue = revenueByPackages.reduce((sum, pkg) => sum + pkg.totalRevenue, 0);
    const totalSales = revenueByPackages.reduce((sum, pkg) => sum + pkg.totalSales, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate growth rate
    let growthRate = 0;
    if (timeSeries.length >= 2) {
      const currentPeriod = timeSeries[timeSeries.length - 1];
      const previousPeriod = timeSeries[timeSeries.length - 2];
      if (previousPeriod.totalRevenue > 0) {
        growthRate = ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Revenue dashboard data retrieved successfully',
      data: {
        summary: {
          totalRevenue,
          totalSales,
          averageOrderValue,
          growthRate,
          period: `Last ${days} days`
        },
        topPackages: revenueByPackages.slice(0, 5),
        recentTrends: timeSeries.slice(-7), // Last 7 periods
        analytics: {
          memberRetentionRate: analytics.memberRetentionRate,
          churnRate: analytics.churnRate,
          topPaymentMethods: analytics.revenueByPaymentMethod.slice(0, 3)
        }
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getRevenueDashboardController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving revenue dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  getRevenueByPackagesController,
  getRevenueTimeSeriesController,
  getAdvancedAnalyticsController,
  getComprehensiveRevenueReportController,
  exportRevenueReportToExcelController,
  exportRevenueReportToPDFController,
  getRevenueDashboardController
};