  import Member, { IMember } from '~/models/Member';
  import Membership, { IMembership } from '~/models/Membership';
  import Package, { IPackage } from '~/models/Package';
  import Payment, { IPayment } from '~/models/Payment';


  import { Types } from 'mongoose';
  import ExcelJS from 'exceljs';
  import PDFDocument from 'pdfkit';

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

  export interface MemberStatsResponse {
    period: string;
    totalMembers: number;
    newMembers: number;
    expiredMembers: number;
    activeMembers: number;
    inactiveMembers: number;
  }

  export interface DashboardStatsResponse {
    totalRevenue: number;
    totalMembers: number;
    activeMembers: number;
    expiredMemberships: number;
    revenueGrowth: number;
    memberGrowth: number;
    topPackages: {
      packageId: string;
      packageName: string;
      revenue: number;
      memberCount: number;
    }[];
    recentPayments: {
      paymentId: string;
      memberName: string;
      packageName: string;
      amount: number;
      status: string;
      createdAt: Date;
    }[];
  }

  
  // Get member statistics
  export const getMemberStats = async (
    options: MemberStatsOptions
  ): Promise<MemberStatsResponse[]> => {
    const { startDate, endDate, groupBy = 'month', status } = options;

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

    const matchStage: any = {};
    if (startDate) {
      matchStage.created_at = { $gte: startDate };
    }
    if (endDate) {
      matchStage.created_at = { ...matchStage.created_at, $lte: endDate };
    }
    if (status) {
      matchStage.status = status;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: getDateGroup(),
          newMembers: { $sum: 1 },
          totalMembers: { $sum: 1 },
          activeMembers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveMembers: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ] as any; 

    const memberResults = await Member.aggregate(pipeline);

    // Get expired memberships data
    const expiredMembershipsMatch: any = {
      status: 'expired'
    };
    if (startDate) {
      expiredMembershipsMatch.end_date = { $gte: startDate };
    }
    if (endDate) {
      expiredMembershipsMatch.end_date = { 
        ...expiredMembershipsMatch.end_date, 
        $lte: endDate 
      };
    }

    const expiredPipeline = [
      { $match: expiredMembershipsMatch },
      {
        $group: {
          _id: {
            year: { $year: '$end_date' },
            month: { $month: '$end_date' },
            ...(groupBy === 'day' && { day: { $dayOfMonth: '$end_date' } }),
            ...(groupBy === 'week' && { week: { $week: '$end_date' } })
          },
          expiredMembers: { $sum: 1 }
        }
      }
    ];

    const expiredResults = await Membership.aggregate(expiredPipeline);
    
    const expiredMap = expiredResults.reduce((map, result) => {
      const key = formatPeriod(result._id, groupBy);
      map[key] = result.expiredMembers;
      return map;
    }, {} as Record<string, number>);

    return memberResults.map(result => {
      const period = formatPeriod(result._id, groupBy);
      return {
        period,
        totalMembers: result.totalMembers,
        newMembers: result.newMembers,
        expiredMembers: expiredMap[period] || 0,
        activeMembers: result.activeMembers,
        inactiveMembers: result.inactiveMembers
      };
    });
  };
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

    const pipeline =   [
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
    ]as any; 

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
    ] as any; ;

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


  // Get dashboard statistics
  export const getDashboardStats = async (
    dateRange?: ReportDateRange
  ): Promise<DashboardStatsResponse> => {
    const { startDate, endDate } = dateRange || {};

    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.created_at = {};
      if (startDate) matchStage.created_at.$gte = startDate;
      if (endDate) matchStage.created_at.$lte = endDate;
    }

    // Total revenue
    const revenueMatch = { status: 'completed', ...matchStage };
    const totalRevenue = await Payment.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Member counts
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'active' });
    const expiredMemberships = await Membership.countDocuments({ status: 'expired' });

    // Growth calculations (previous period comparison)
    const previousPeriodStart = startDate ? new Date(startDate.getTime() - (endDate?.getTime() || Date.now() - startDate.getTime())) : null;
    const previousRevenue = startDate ? await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          created_at: { $gte: previousPeriodStart, $lt: startDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]) : [{ total: 0 }];

    const previousMemberCount = startDate ? await Member.countDocuments({
      created_at: { $gte: previousPeriodStart, $lt: startDate }
    }) : 0;

    const currentRevenue = totalRevenue[0]?.total || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;
    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const currentMemberCount = await Member.countDocuments(matchStage);
    const memberGrowth = previousMemberCount > 0 ? ((currentMemberCount - previousMemberCount) / previousMemberCount) * 100 : 0;

    // Top packages
    const topPackages = await Payment.aggregate([
      { $match: revenueMatch },
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
          revenue: { $sum: '$amount' },
          memberCount: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Recent payments
    const recentPayments = await Payment.find(revenueMatch)
      .populate('member_id', 'name')
      .populate('package_id', 'name')
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    return {
      totalRevenue: currentRevenue,
      totalMembers,
      activeMembers,
      expiredMemberships,
      revenueGrowth,
      memberGrowth,
      topPackages: topPackages.map(pkg => ({
        packageId: pkg._id.toString(),
        packageName: pkg.packageName,
        revenue: pkg.revenue,
        memberCount: pkg.memberCount
      })),
      recentPayments: recentPayments.map(payment => ({
        paymentId: payment._id.toString(),
        memberName: (payment.member_id as any)?.name || 'N/A',
        packageName: (payment.package_id as any)?.name || 'N/A',
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.created_at
      }))
    };
  };

  // Export to Excel
  export const exportToExcel = async (
    reportType: 'revenue' | 'members' | 'dashboard',
    data: any,
    options?: RevenueReportOptions | MemberStatsOptions
  ): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    
    if (reportType === 'revenue') {
      const worksheet = workbook.addWorksheet('Báo cáo Doanh thu');
      
      // Headers
      worksheet.columns = [
        { header: 'Gói dịch vụ', key: 'packageName', width: 30 },
        { header: 'Danh mục', key: 'category', width: 15 },
        { header: 'Tổng doanh thu', key: 'totalRevenue', width: 20 },
        { header: 'Số lượng bán', key: 'totalSales', width: 15 },
        { header: 'Doanh thu trung bình', key: 'averageRevenue', width: 20 }
      ];

      // Add data
      data.forEach((item: RevenueByPackageResponse) => {
        worksheet.addRow({
          packageName: item.packageName,
          category: item.category,
          totalRevenue: item.totalRevenue,
          totalSales: item.totalSales,
          averageRevenue: item.averageRevenue
        });
      });

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };

    } else if (reportType === 'members') {
      const worksheet = workbook.addWorksheet('Thống kê Thành viên');
      
      worksheet.columns = [
        { header: 'Thời gian', key: 'period', width: 20 },
        { header: 'Tổng thành viên', key: 'totalMembers', width: 18 },
        { header: 'Thành viên mới', key: 'newMembers', width: 18 },
        { header: 'Thành viên hết hạn', key: 'expiredMembers', width: 20 },
        { header: 'Thành viên hoạt động', key: 'activeMembers', width: 20 },
        { header: 'Thành viên không hoạt động', key: 'inactiveMembers', width: 25 }
      ];

      data.forEach((item: MemberStatsResponse) => {
        worksheet.addRow(item);
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  };

  // Export to PDF
  export const exportToPDF = async (
    reportType: 'revenue' | 'members' | 'dashboard',
    data: any,
    options?: RevenueReportOptions | MemberStatsOptions
  ): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add title
      doc.fontSize(20).text('BÁO CÁO THỐNG KÊ', { align: 'center' });
      doc.moveDown();

      if (reportType === 'revenue') {
        doc.fontSize(16).text('Báo cáo Doanh thu theo Gói dịch vụ');
        doc.moveDown();

        data.forEach((item: RevenueByPackageResponse, index: number) => {
          doc.fontSize(12)
            .text(`${index + 1}. ${item.packageName}`)
            .text(`   Danh mục: ${item.category}`)
            .text(`   Tổng doanh thu: ${item.totalRevenue.toLocaleString('vi-VN')} VNĐ`)
            .text(`   Số lượng bán: ${item.totalSales}`)
            .text(`   Doanh thu trung bình: ${item.averageRevenue.toLocaleString('vi-VN')} VNĐ`)
            .moveDown();
        });

      } else if (reportType === 'members') {
        doc.fontSize(16).text('Thống kê Thành viên');
        doc.moveDown();

        data.forEach((item: MemberStatsResponse, index: number) => {
          doc.fontSize(12)
            .text(`Thời gian: ${item.period}`)
            .text(`Tổng thành viên: ${item.totalMembers}`)
            .text(`Thành viên mới: ${item.newMembers}`)
            .text(`Thành viên hết hạn: ${item.expiredMembers}`)
            .text(`Thành viên hoạt động: ${item.activeMembers}`)
            .text(`Thành viên không hoạt động: ${item.inactiveMembers}`)
            .moveDown();
        });
      }

      doc.fontSize(10).text(`Tạo báo cáo vào: ${new Date().toLocaleString('vi-VN')}`, { align: 'right' });
      doc.end();
    });
  };

  // Helper function to format period based on groupBy option
  const formatPeriod = (dateGroup: any, groupBy: string): string => {
    const { year, month, day, week } = dateGroup;
    
    switch (groupBy) {
      case 'day':
        return `${day}/${month}/${year}`;
      case 'week':
        return `Tuần ${week}/${year}`;
      case 'month':
        return `${month}/${year}`;
      case 'year':
        return `${year}`;
      default:
        return `${month}/${year}`;
    }
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
    ]as any; 

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

  export default {
    getRevenueByPackages,
    getRevenueTimeSeries,
    getMemberStats,
    getDashboardStats,
    exportToExcel,
    exportToPDF,
    getAdvancedAnalytics
  };