import Member  from '../../../models/Member';
import Membership from '../../../models/Membership';


import { Types } from 'mongoose';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
// Enhanced interfaces for comprehensive member analytics
export interface ReportDateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface MemberStatsOptions extends ReportDateRange {
  groupBy?: 'day' | 'week' | 'month' | 'year';
  status?: 'active' | 'inactive' | 'pending' | 'banned';
  includeRetention?: boolean;
  includeChurn?: boolean;
  cohortAnalysis?: boolean;
}

export interface MemberStatsResponse {
  period: string;
  totalMembers: number;
  newMembers: number;
  expiredMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  pendingMembers: number;
  bannedMembers: number;
  retentionRate?: number;
  churnRate?: number;
  growthRate?: number;
  netGrowth?: number;
}

export interface RetentionAnalysis {
  period: string;
  cohortSize: number;
  retainedMembers: number;
  retentionRate: number;
  churnedMembers: number;
  churnRate: number;
}

export interface MemberGrowthAnalysis {
  totalMembers: number;
  totalGrowth: number;
  growthRate: number;
  periodOverPeriodGrowth: number;
  retentionFunnel: {
    newMembers: number;
    activeAfter30Days: number;
    activeAfter90Days: number;
    activeAfter180Days: number;
    activeAfter365Days: number;
  };
}

export interface StatusDistribution {
  active: { count: number; percentage: number };
  inactive: { count: number; percentage: number };
  pending: { count: number; percentage: number };
  banned: { count: number; percentage: number };
}

export interface ComprehensiveMemberReport {
  summary: MemberGrowthAnalysis;
  timeSeries: MemberStatsResponse[];
  statusDistribution: StatusDistribution;
  retentionAnalysis: RetentionAnalysis[];
  topGrowthPeriods: { period: string; growth: number }[];
  churnAnalysis: {
    averageChurnRate: number;
    highRiskPeriods: string[];
    churnReasons: { reason: string; count: number }[];
  };
}

// Utility function to format periods
const formatPeriod = (dateGroup: any, groupBy: string): string => {
  switch (groupBy) {
    case 'day':
      return `${dateGroup.year}-${String(dateGroup.month).padStart(2, '0')}-${String(dateGroup.day).padStart(2, '0')}`;
    case 'week':
      return `${dateGroup.year}-W${String(dateGroup.week).padStart(2, '0')}`;
    case 'month':
      return `${dateGroup.year}-${String(dateGroup.month).padStart(2, '0')}`;
    case 'year':
      return `${dateGroup.year}`;
    default:
      return `${dateGroup.year}-${String(dateGroup.month).padStart(2, '0')}`;
  }
};

// Calculate retention rate between two periods
const calculateRetentionRate = async (
  startPeriod: Date,
  endPeriod: Date
): Promise<number> => {
  const membersAtStart = await Member.countDocuments({
    created_at: { $lte: startPeriod },
    status: { $in: ['active', 'inactive'] }
  });

  const retainedMembers = await Member.countDocuments({
    created_at: { $lte: startPeriod },
    $or: [
      { status: 'active' },
      { 
        status: 'inactive',
        updated_at: { $gte: endPeriod }
      }
    ]
  });

  return membersAtStart > 0 ? (retainedMembers / membersAtStart) * 100 : 0;
};

// Enhanced getMemberStats function
export const getMemberStats = async (
  options: MemberStatsOptions
): Promise<MemberStatsResponse[]> => {
  const { 
    startDate, 
    endDate, 
    groupBy = 'month', 
    status,
    includeRetention = false,
    includeChurn = false 
  } = options;

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

  // Build match stage for filtering
  const matchStage: any = {};
  if (startDate || endDate) {
    matchStage.created_at = {};
    if (startDate) matchStage.created_at.$gte = startDate;
    if (endDate) matchStage.created_at.$lte = endDate;
  }
  if (status) {
    matchStage.status = status;
  }

  // Main aggregation pipeline for member statistics
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
        },
        pendingMembers: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        bannedMembers: {
          $sum: { $cond: [{ $eq: ['$status', 'banned'] }, 1, 0] }
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
  if (startDate || endDate) {
    expiredMembershipsMatch.end_date = {};
    if (startDate) expiredMembershipsMatch.end_date.$gte = startDate;
    if (endDate) expiredMembershipsMatch.end_date.$lte = endDate;
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

  // Calculate cumulative totals for growth rate calculation
  let cumulativeTotal = 0;
  const results: MemberStatsResponse[] = [];

  for (let i = 0; i < memberResults.length; i++) {
    const result = memberResults[i];
    const period = formatPeriod(result._id, groupBy);
    const expiredMembers = expiredMap[period] || 0;
    
    cumulativeTotal += result.newMembers;
    const netGrowth = result.newMembers - expiredMembers;
    const previousTotal = i > 0 ? cumulativeTotal - result.newMembers : 0;
    const growthRate = previousTotal > 0 ? ((netGrowth / previousTotal) * 100) : 0;

    let retentionRate: number | undefined;
    let churnRate: number | undefined;

    // Calculate retention and churn rates if requested
    if (includeRetention || includeChurn) {
      const periodStart = new Date(result._id.year, (result._id.month || 1) - 1, result._id.day || 1);
      const periodEnd = new Date(periodStart);
      
      switch (groupBy) {
        case 'day':
          periodEnd.setDate(periodEnd.getDate() + 1);
          break;
        case 'week':
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'month':
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
        case 'year':
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          break;
      }

      if (includeRetention) {
        retentionRate = await calculateRetentionRate(periodStart, periodEnd);
      }
      
      if (includeChurn) {
        churnRate = retentionRate ? 100 - retentionRate : undefined;
      }
    }

    results.push({
      period,
      totalMembers: cumulativeTotal,
      newMembers: result.newMembers,
      expiredMembers,
      activeMembers: result.activeMembers,
      inactiveMembers: result.inactiveMembers,
      pendingMembers: result.pendingMembers,
      bannedMembers: result.bannedMembers,
      retentionRate,
      churnRate,
      growthRate,
      netGrowth
    });
  }

  return results;
};

// Get comprehensive member analytics report
export const getComprehensiveMemberReport = async (
  options: MemberStatsOptions
): Promise<ComprehensiveMemberReport> => {
  const timeSeries = await getMemberStats({
    ...options,
    includeRetention: true,
    includeChurn: true
  });

  // Calculate summary statistics
  const totalMembers = await Member.countDocuments({
    status: { $in: ['active', 'inactive', 'pending'] }
  });

  const statusCounts = await Member.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusDistribution = statusCounts.reduce((acc, item) => {
    const percentage = (item.count / totalMembers) * 100;
    acc[item._id] = { count: item.count, percentage };
    return acc;
  }, {} as StatusDistribution);

  // Calculate retention funnel
  const now = new Date();
  const retentionFunnel = {
    newMembers: await Member.countDocuments({
      created_at: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }),
    activeAfter30Days: await Member.countDocuments({
      created_at: { $gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), $lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      status: 'active'
    }),
    activeAfter90Days: await Member.countDocuments({
      created_at: { $gte: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), $lte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
      status: 'active'
    }),
    activeAfter180Days: await Member.countDocuments({
      created_at: { $gte: new Date(now.getTime() - 210 * 24 * 60 * 60 * 1000), $lte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
      status: 'active'
    }),
    activeAfter365Days: await Member.countDocuments({
      created_at: { $gte: new Date(now.getTime() - 395 * 24 * 60 * 60 * 1000), $lte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
      status: 'active'
    })
  };

  // Calculate growth metrics
  const totalGrowth = timeSeries.reduce((sum, item) => sum + (item.netGrowth || 0), 0);
  const growthRate = timeSeries.length > 1 
    ? ((timeSeries[timeSeries.length - 1].totalMembers - timeSeries[0].totalMembers) / timeSeries[0].totalMembers) * 100
    : 0;

  const periodOverPeriodGrowth = timeSeries.length > 1
    ? ((timeSeries[timeSeries.length - 1].newMembers - timeSeries[timeSeries.length - 2].newMembers) / timeSeries[timeSeries.length - 2].newMembers) * 100
    : 0;

  // Find top growth periods
  const topGrowthPeriods = timeSeries
    .filter(item => item.netGrowth !== undefined)
    .sort((a, b) => (b.netGrowth || 0) - (a.netGrowth || 0))
    .slice(0, 5)
    .map(item => ({ period: item.period, growth: item.netGrowth || 0 }));

  // Calculate churn analysis
  const churnRates = timeSeries.filter(item => item.churnRate !== undefined).map(item => item.churnRate!);
  const averageChurnRate = churnRates.length > 0 ? churnRates.reduce((sum, rate) => sum + rate, 0) / churnRates.length : 0;
  
  const highRiskPeriods = timeSeries
    .filter(item => item.churnRate && item.churnRate > averageChurnRate * 1.5)
    .map(item => item.period);

  return {
    summary: {
      totalMembers,
      totalGrowth,
      growthRate,
      periodOverPeriodGrowth,
      retentionFunnel
    },
    timeSeries,
    statusDistribution,
    retentionAnalysis: timeSeries.map(item => ({
      period: item.period,
      cohortSize: item.newMembers,
      retainedMembers: Math.round((item.retentionRate || 0) * item.newMembers / 100),
      retentionRate: item.retentionRate || 0,
      churnedMembers: item.expiredMembers,
      churnRate: item.churnRate || 0
    })),
    topGrowthPeriods,
    churnAnalysis: {
      averageChurnRate,
      highRiskPeriods,
      churnReasons: [] // This would need additional data collection
    }
  };
};

// Export to Excel
export const exportMemberStatsToExcel = async (
  data: ComprehensiveMemberReport,
  filePath: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  
  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Member Analytics Summary']);
  summarySheet.addRow(['Total Members', data.summary.totalMembers]);
  summarySheet.addRow(['Total Growth', data.summary.totalGrowth]);
  summarySheet.addRow(['Growth Rate (%)', data.summary.growthRate.toFixed(2)]);
  summarySheet.addRow(['Period over Period Growth (%)', data.summary.periodOverPeriodGrowth.toFixed(2)]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Retention Funnel']);
  summarySheet.addRow(['New Members (30 days)', data.summary.retentionFunnel.newMembers]);
  summarySheet.addRow(['Active after 30+ days', data.summary.retentionFunnel.activeAfter30Days]);
  summarySheet.addRow(['Active after 90+ days', data.summary.retentionFunnel.activeAfter90Days]);
  summarySheet.addRow(['Active after 180+ days', data.summary.retentionFunnel.activeAfter180Days]);
  summarySheet.addRow(['Active after 365+ days', data.summary.retentionFunnel.activeAfter365Days]);

  // Time Series Sheet
  const timeSeriesSheet = workbook.addWorksheet('Time Series');
  timeSeriesSheet.addRow([
    'Period', 'Total Members', 'New Members', 'Expired Members',
    'Active Members', 'Inactive Members', 'Pending Members', 'Banned Members',
    'Retention Rate (%)', 'Churn Rate (%)', 'Growth Rate (%)', 'Net Growth'
  ]);
  
  data.timeSeries.forEach(item => {
    timeSeriesSheet.addRow([
      item.period, item.totalMembers, item.newMembers, item.expiredMembers,
      item.activeMembers, item.inactiveMembers, item.pendingMembers, item.bannedMembers,
      item.retentionRate?.toFixed(2) || 'N/A',
      item.churnRate?.toFixed(2) || 'N/A',
      item.growthRate?.toFixed(2) || 'N/A',
      item.netGrowth || 0
    ]);
  });

  // Status Distribution Sheet
  const statusSheet = workbook.addWorksheet('Status Distribution');
  statusSheet.addRow(['Status', 'Count', 'Percentage']);
  Object.entries(data.statusDistribution).forEach(([status, data]) => {
    statusSheet.addRow([status, data.count, data.percentage.toFixed(2) + '%']);
  });

  await workbook.xlsx.writeFile(filePath);
};

// Export to PDF
export const exportMemberStatsToPDF = async (
  data: ComprehensiveMemberReport,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Title
    doc.fontSize(20).text('Member Analytics Report', 50, 50);
    doc.moveDown();

    // Summary
    doc.fontSize(16).text('Summary', 50, doc.y);
    doc.fontSize(12);
    doc.text(`Total Members: ${data.summary.totalMembers}`, 50, doc.y + 10);
    doc.text(`Growth Rate: ${data.summary.growthRate.toFixed(2)}%`, 50, doc.y + 5);
    doc.text(`Average Churn Rate: ${data.churnAnalysis.averageChurnRate.toFixed(2)}%`, 50, doc.y + 5);
    doc.moveDown();

    // Status Distribution
    doc.fontSize(14).text('Status Distribution', 50, doc.y + 10);
    doc.fontSize(10);
    Object.entries(data.statusDistribution).forEach(([status, statusData]) => {
      doc.text(`${status}: ${statusData.count} (${statusData.percentage.toFixed(1)}%)`, 70, doc.y + 5);
    });

    // Retention Funnel
    doc.addPage();
    doc.fontSize(14).text('Retention Funnel', 50, 50);
    doc.fontSize(10);
    doc.text(`New Members (30 days): ${data.summary.retentionFunnel.newMembers}`, 70, doc.y + 10);
    doc.text(`Active after 30+ days: ${data.summary.retentionFunnel.activeAfter30Days}`, 70, doc.y + 5);
    doc.text(`Active after 90+ days: ${data.summary.retentionFunnel.activeAfter90Days}`, 70, doc.y + 5);
    doc.text(`Active after 180+ days: ${data.summary.retentionFunnel.activeAfter180Days}`, 70, doc.y + 5);
    doc.text(`Active after 365+ days: ${data.summary.retentionFunnel.activeAfter365Days}`, 70, doc.y + 5);

    doc.end();

    writeStream.on('finish', () => {
      resolve(); // đảm bảo file đã được tạo hoàn tất
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};


export default {
    getMemberStats,
    getComprehensiveMemberReport,
    exportMemberStatsToExcel,
    exportMemberStatsToPDF
}