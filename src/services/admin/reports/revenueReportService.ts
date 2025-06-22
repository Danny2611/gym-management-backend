import Member, { IMember } from '~/models/Member';
import Membership, { IMembership } from '~/models/Membership';
import Package, { IPackage } from '~/models/Package';
import Payment, { IPayment } from '~/models/Payment';

import { Types } from 'mongoose';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';

// Define types for query options and responses
export interface ReportDateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface RevenueReportOptions extends ReportDateRange {
  groupBy?: 'day' | 'week' | 'month' | 'year';
  packageId?: string;
  category?: 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip';
}

export interface MemberStatsOptions extends ReportDateRange {
  groupBy?: 'day' | 'week' | 'month' | 'year';
  status?: 'active' | 'inactive' | 'pending' | 'banned';
}

export interface RevenueByPackageResponse {
  packageId: string;
  packageName: string;
  category: string;
  totalRevenue: number;
  totalSales: number;
  averageRevenue: number;
}

export interface RevenueTimeSeriesResponse {
  period: string;
  totalRevenue: number;
  totalSales: number;
  packages: {
    packageId: string;
    packageName: string;
    revenue: number;
    sales: number;
  }[];
}

export interface ComprehensiveRevenueReport {
  summary: {
    totalRevenue: number;
    totalSales: number;
    averageOrderValue: number;
    periodOverPeriodGrowth: number;
    topPerformingPackage: {
      name: string;
      revenue: number;
      sales: number;
    };
  };
  revenueByPackages: RevenueByPackageResponse[];
  timeSeries: RevenueTimeSeriesResponse[];
  analytics: {
    memberRetentionRate: number;
    averageLifetimeValue: number;
    churnRate: number;
    packagePopularity: {
      packageName: string;
      percentage: number;
      memberCount: number;
    }[];
    revenueByPaymentMethod: {
      method: string;
      revenue: number;
      percentage: number;
    }[];
  };
}

// Get revenue report by packages
export const getRevenueByPackages = async (
  options: RevenueReportOptions
): Promise<RevenueByPackageResponse[]> => {
  const { startDate, endDate, packageId, category } = options;

  const matchStage: any = {
    status: 'completed',
    created_at: {}
  };

  if (startDate) {
    matchStage.created_at.$gte = startDate;
  }
  if (endDate) {
    matchStage.created_at.$lte = endDate;
  }
  if (packageId) {
    matchStage.package_id = new Types.ObjectId(packageId);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'packages',
        localField: 'package_id',
        foreignField: '_id',
        as: 'package'
      }
    },
    { $unwind: '$package' },
    ...(category ? [{ $match: { 'package.category': category } }] : []),
    {
      $group: {
        _id: '$package_id',
        packageName: { $first: '$package.name' },
        category: { $first: '$package.category' },
        totalRevenue: { $sum: '$amount' },
        totalSales: { $sum: 1 }
      }
    },
    {
      $addFields: {
        averageRevenue: { $divide: ['$totalRevenue', '$totalSales'] }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ] as any;

  const results = await Payment.aggregate(pipeline);

  return results.map(result => ({
    packageId: result._id.toString(),
    packageName: result.packageName,
    category: result.category || 'basic',
    totalRevenue: result.totalRevenue,
    totalSales: result.totalSales,
    averageRevenue: result.averageRevenue
  }));
};

// Get revenue time series data
export const getRevenueTimeSeries = async (
  options: RevenueReportOptions
): Promise<RevenueTimeSeriesResponse[]> => {
  const { startDate, endDate, groupBy = 'month' } = options;

  const matchStage: any = {
    status: 'completed',
    created_at: {}
  };

  if (startDate) {
    matchStage.created_at.$gte = startDate;
  }
  if (endDate) {
    matchStage.created_at.$lte = endDate;
  }

  const getDateGroup = () => {
    switch (groupBy) {
      case 'day':
        return {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
          day: { $dayOfMonth: '$created_at' }
        };
      case 'week':
        return {
          year: { $year: '$created_at' },
          week: { $week: '$created_at' }
        };
      case 'month':
        return {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' }
        };
      case 'year':
        return {
          year: { $year: '$created_at' }
        };
      default:
        return {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' }
        };
    }
  };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'packages',
        localField: 'package_id',
        foreignField: '_id',
        as: 'package'
      }
    },
    { $unwind: '$package' },
    {
      $group: {
        _id: {
          period: getDateGroup(),
          packageId: '$package_id'
        },
        packageName: { $first: '$package.name' },
        revenue: { $sum: '$amount' },
        sales: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.period',
        totalRevenue: { $sum: '$revenue' },
        totalSales: { $sum: '$sales' },
        packages: {
          $push: {
            packageId: '$_id.packageId',
            packageName: '$packageName',
            revenue: '$revenue',
            sales: '$sales'
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
  ] as any;

  const results = await Payment.aggregate(pipeline);

  return results.map(result => {
    const period = formatPeriod(result._id, groupBy);
    return {
      period,
      totalRevenue: result.totalRevenue,
      totalSales: result.totalSales,
      packages: result.packages.map((pkg: any) => ({
        packageId: pkg.packageId.toString(),
        packageName: pkg.packageName,
        revenue: pkg.revenue,
        sales: pkg.sales
      }))
    };
  });
};


// Get advanced analytics
export const getAdvancedAnalytics = async (
  dateRange?: ReportDateRange
): Promise<{
  memberRetentionRate: number;
  averageLifetimeValue: number;
  churnRate: number;
  packagePopularity: {
    packageName: string;
    percentage: number;
    memberCount: number;
  }[];
  revenueByPaymentMethod: {
    method: string;
    revenue: number;
    percentage: number;
  }[];
}> => {
  const { startDate, endDate } = dateRange || {};

  // Member retention rate calculation
  const totalMemberships = await Membership.countDocuments();
  const activeMemberships = await Membership.countDocuments({ status: 'active' });
  const memberRetentionRate = totalMemberships > 0 ? (activeMemberships / totalMemberships) * 100 : 0;

  // Average lifetime value
  const lifetimeValuePipeline = [
    {
      $lookup: {
        from: 'payments',
        localField: 'member_id',
        foreignField: 'member_id',
        as: 'payments'
      }
    },
    {
      $addFields: {
        totalSpent: {
          $sum: {
            $map: {
              input: '$payments',
              as: 'payment',
              in: { $cond: [{ $eq: ['$$payment.status', 'completed'] }, '$$payment.amount', 0] }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        averageLifetimeValue: { $avg: '$totalSpent' }
      }
    }
  ];

  const lifetimeValue = await Membership.aggregate(lifetimeValuePipeline);
  const averageLifetimeValue = lifetimeValue[0]?.averageLifetimeValue || 0;

  // Churn rate
  const expiredMemberships = await Membership.countDocuments({ status: 'expired' });
  const churnRate = totalMemberships > 0 ? (expiredMemberships / totalMemberships) * 100 : 0;

  // Package popularity
  const packagePopularityPipeline = [
    {
      $lookup: {
        from: 'packages',
        localField: 'package_id',
        foreignField: '_id',
        as: 'package'
      }
    },
    { $unwind: '$package' },
    {
      $group: {
        _id: '$package_id',
        packageName: { $first: '$package.name' },
        memberCount: { $sum: 1 }
      }
    },
    { $sort: { memberCount: -1 } }
  ] as any;

  const packagePopularityResults = await Membership.aggregate(packagePopularityPipeline);
  const totalPackageSubscriptions = packagePopularityResults.reduce((sum, pkg) => sum + pkg.memberCount, 0);

  const packagePopularity = packagePopularityResults.map(pkg => ({
    packageName: pkg.packageName,
    percentage: totalPackageSubscriptions > 0 ? (pkg.memberCount / totalPackageSubscriptions) * 100 : 0,
    memberCount: pkg.memberCount
  }));

  // Revenue by payment method
  const revenueByMethodPipeline = [
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        revenue: { $sum: '$amount' }
      }
    }
  ];

  const revenueByMethodResults = await Payment.aggregate(revenueByMethodPipeline);
  const totalRevenueByMethod = revenueByMethodResults.reduce((sum, method) => sum + method.revenue, 0);

  const revenueByPaymentMethod = revenueByMethodResults.map(method => ({
    method: method._id,
    revenue: method.revenue,
    percentage: totalRevenueByMethod > 0 ? (method.revenue / totalRevenueByMethod) * 100 : 0
  }));

  return {
    memberRetentionRate,
    averageLifetimeValue,
    churnRate,
    packagePopularity,
    revenueByPaymentMethod
  };
};

// Get comprehensive revenue report
export const getComprehensiveRevenueReport = async (
  options: RevenueReportOptions
): Promise<ComprehensiveRevenueReport> => {
  const revenueByPackages = await getRevenueByPackages(options);
  const timeSeries = await getRevenueTimeSeries(options);
  const analytics = await getAdvancedAnalytics(options);

  // Calculate summary statistics
  const totalRevenue = revenueByPackages.reduce((sum, pkg) => sum + pkg.totalRevenue, 0);
  const totalSales = revenueByPackages.reduce((sum, pkg) => sum + pkg.totalSales, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Calculate period over period growth
  let periodOverPeriodGrowth = 0;
  if (timeSeries.length > 1) {
    const currentPeriod = timeSeries[timeSeries.length - 1];
    const previousPeriod = timeSeries[timeSeries.length - 2];
    if (previousPeriod.totalRevenue > 0) {
      periodOverPeriodGrowth = ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100;
    }
  }

  // Find top performing package
  const topPerformingPackage = revenueByPackages.length > 0 
    ? {
        name: revenueByPackages[0].packageName,
        revenue: revenueByPackages[0].totalRevenue,
        sales: revenueByPackages[0].totalSales
      }
    : { name: 'N/A', revenue: 0, sales: 0 };

  return {
    summary: {
      totalRevenue,
      totalSales,
      averageOrderValue,
      periodOverPeriodGrowth,
      topPerformingPackage
    },
    revenueByPackages,
    timeSeries,
    analytics
  };
};

// Export revenue report to Excel
export const exportRevenueReportToExcel = async (
  data: ComprehensiveRevenueReport,
  filePath: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  
  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Revenue Summary');
  summarySheet.addRow(['Revenue Report Summary']);
  summarySheet.addRow(['Total Revenue', `$${data.summary.totalRevenue.toFixed(2)}`]);
  summarySheet.addRow(['Total Sales', data.summary.totalSales]);
  summarySheet.addRow(['Average Order Value', `$${data.summary.averageOrderValue.toFixed(2)}`]);
  summarySheet.addRow(['Period over Period Growth (%)', data.summary.periodOverPeriodGrowth.toFixed(2)]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Top Performing Package']);
  summarySheet.addRow(['Package Name', data.summary.topPerformingPackage.name]);
  summarySheet.addRow(['Revenue', `$${data.summary.topPerformingPackage.revenue.toFixed(2)}`]);
  summarySheet.addRow(['Sales', data.summary.topPerformingPackage.sales]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Analytics']);
  summarySheet.addRow(['Member Retention Rate (%)', data.analytics.memberRetentionRate.toFixed(2)]);
  summarySheet.addRow(['Average Lifetime Value', `$${data.analytics.averageLifetimeValue.toFixed(2)}`]);
  summarySheet.addRow(['Churn Rate (%)', data.analytics.churnRate.toFixed(2)]);

  // Revenue by Packages Sheet
  const packagesSheet = workbook.addWorksheet('Revenue by Packages');
  packagesSheet.addRow([
    'Package ID', 'Package Name', 'Category', 'Total Revenue', 
    'Total Sales', 'Average Revenue'
  ]);
  
  data.revenueByPackages.forEach(pkg => {
    packagesSheet.addRow([
      pkg.packageId,
      pkg.packageName,
      pkg.category,
      pkg.totalRevenue.toFixed(2),
      pkg.totalSales,
      pkg.averageRevenue.toFixed(2)
    ]);
  });

  // Time Series Sheet
  const timeSeriesSheet = workbook.addWorksheet('Revenue Time Series');
  timeSeriesSheet.addRow(['Period', 'Total Revenue', 'Total Sales']);
  
  data.timeSeries.forEach(item => {
    timeSeriesSheet.addRow([
      item.period,
      item.totalRevenue.toFixed(2),
      item.totalSales
    ]);
  });

  // Package Popularity Sheet
  const popularitySheet = workbook.addWorksheet('Package Popularity');
  popularitySheet.addRow(['Package Name', 'Member Count', 'Percentage']);
  data.analytics.packagePopularity.forEach(pkg => {
    popularitySheet.addRow([
      pkg.packageName,
      pkg.memberCount,
      pkg.percentage.toFixed(2) + '%'
    ]);
  });

  // Revenue by Payment Method Sheet
  const paymentMethodSheet = workbook.addWorksheet('Revenue by Payment Method');
  paymentMethodSheet.addRow(['Payment Method', 'Revenue', 'Percentage']);
  data.analytics.revenueByPaymentMethod.forEach(method => {
    paymentMethodSheet.addRow([
      method.method,
      method.revenue.toFixed(2),
      method.percentage.toFixed(2) + '%'
    ]);
  });

  // Style the summary sheet
  summarySheet.getCell('A1').font = { bold: true, size: 16 };
  summarySheet.getCell('A6').font = { bold: true, size: 14 };
  summarySheet.getCell('A11').font = { bold: true, size: 14 };

  await workbook.xlsx.writeFile(filePath);
};

// Export revenue report to PDF
export const exportRevenueReportToPDF = async (
  data: ComprehensiveRevenueReport,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Title
    doc.fontSize(20).text('Revenue Analytics Report', 50, 50);
    doc.moveDown();

    // Summary
    doc.fontSize(16).text('Revenue Summary', 50, doc.y);
    doc.fontSize(12);
    doc.text(`Total Revenue: $${data.summary.totalRevenue.toFixed(2)}`, 50, doc.y + 10);
    doc.text(`Total Sales: ${data.summary.totalSales}`, 50, doc.y + 5);
    doc.text(`Average Order Value: $${data.summary.averageOrderValue.toFixed(2)}`, 50, doc.y + 5);
    doc.text(`Period over Period Growth: ${data.summary.periodOverPeriodGrowth.toFixed(2)}%`, 50, doc.y + 5);
    doc.moveDown();

    // Top Performing Package
    doc.fontSize(14).text('Top Performing Package', 50, doc.y + 10);
    doc.fontSize(10);
    doc.text(`Package: ${data.summary.topPerformingPackage.name}`, 70, doc.y + 5);
    doc.text(`Revenue: $${data.summary.topPerformingPackage.revenue.toFixed(2)}`, 70, doc.y + 5);
    doc.text(`Sales: ${data.summary.topPerformingPackage.sales}`, 70, doc.y + 5);
    doc.moveDown();

    // Analytics
    doc.fontSize(14).text('Key Analytics', 50, doc.y + 10);
    doc.fontSize(10);
    doc.text(`Member Retention Rate: ${data.analytics.memberRetentionRate.toFixed(2)}%`, 70, doc.y + 5);
    doc.text(`Average Lifetime Value: $${data.analytics.averageLifetimeValue.toFixed(2)}`, 70, doc.y + 5);
    doc.text(`Churn Rate: ${data.analytics.churnRate.toFixed(2)}%`, 70, doc.y + 5);

    // Package Performance (New Page)
    doc.addPage();
    doc.fontSize(14).text('Revenue by Package', 50, 50);
    doc.fontSize(10);
    
    let yPosition = 80;
    data.revenueByPackages.slice(0, 10).forEach((pkg, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      doc.text(`${index + 1}. ${pkg.packageName}`, 70, yPosition);
      doc.text(`   Category: ${pkg.category}`, 80, yPosition + 12);
      doc.text(`   Revenue: $${pkg.totalRevenue.toFixed(2)} | Sales: ${pkg.totalSales}`, 80, yPosition + 24);
      yPosition += 45;
    });

    // Payment Methods
    doc.addPage();
    doc.fontSize(14).text('Revenue by Payment Method', 50, 50);
    doc.fontSize(10);
    
    yPosition = 80;
    data.analytics.revenueByPaymentMethod.forEach((method, index) => {
      doc.text(`${method.method}: $${method.revenue.toFixed(2)} (${method.percentage.toFixed(1)}%)`, 70, yPosition);
      yPosition += 20;
    });

    // Package Popularity
    doc.moveDown(2);
    doc.fontSize(14).text('Package Popularity', 50, doc.y);
    doc.fontSize(10);
    
    yPosition = doc.y + 20;
    data.analytics.packagePopularity.slice(0, 8).forEach((pkg, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      doc.text(`${index + 1}. ${pkg.packageName}: ${pkg.memberCount} members (${pkg.percentage.toFixed(1)}%)`, 70, yPosition);
      yPosition += 20;
    });

    doc.end();

    writeStream.on('finish', () => {
      resolve();
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};
// Helper function to format period based on groupBy option
const formatPeriod = (dateGroup: any, groupBy: string): string => {
  const { year, month, day, week } = dateGroup;
  
  switch (groupBy) {
    case 'day':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'week':
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'month':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'year':
      return `${year}`;
    default:
      return `${year}-${String(month).padStart(2, '0')}`;
  }
};

export default {
  getRevenueByPackages,
  getRevenueTimeSeries,
  getAdvancedAnalytics,
  getComprehensiveRevenueReport,
  exportRevenueReportToExcel,
  exportRevenueReportToPDF
};