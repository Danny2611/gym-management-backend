// src/services/progressTrackingService.ts
import { Types } from 'mongoose';
import Progress, { IProgress } from '../models/Progress';

export interface BodyMetricsParams {
  member_id: Types.ObjectId;
  weight?: number;
  height?: number;
  muscle_mass?: number;
  body_fat?: number;
  bmi?: number;
}

export interface BodyMetricsComparison {
  current: IProgress | null;
  initial: IProgress | null;
  previous: IProgress | null;
}

export interface BodyStatsProgress {
  month: string;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  bmi: number;
}

export interface FitnessRadarData {
  subject: string;
  current: number;
  initial: number;
  full: number;
}

/**
 * Lấy chỉ số cơ thể mới nhất
 */
export async function getLatestBodyMetrics(member_id: Types.ObjectId): Promise<IProgress | null> {
  try {
    const latestProgress = await Progress.findOne({ member_id })
      .sort({ created_at: -1 }) // Sort by created_at in descending order to get the most recent
      .exec();
    
    return latestProgress;
  } catch (error) {
    console.error('Lỗi khi lấy chỉ số cơ thể mới nhất:', error);
    throw new Error('Không thể lấy chỉ số cơ thể mới nhất');
  }
}

/**
 * Lấy chỉ số cơ thể ban đầu (record đầu tiên)
 */
export async function getInitialBodyMetrics(member_id: Types.ObjectId): Promise<IProgress | null> {
  try {
    const initialProgress = await Progress.findOne({ member_id })
      .sort({ created_at: 1 }) // Sort by created_at in ascending order to get the first record
      .exec();
    
    return initialProgress;
  } catch (error) {
    console.error('Lỗi khi lấy chỉ số cơ thể ban đầu:', error);
    throw new Error('Không thể lấy chỉ số cơ thể ban đầu');
  }
}

/**
 * Lấy chỉ số cơ thể từ tháng trước
 */
// export async function getPreviousMonthBodyMetrics(member_id: Types.ObjectId): Promise<IProgress | null> {
//   try {
//     const now = new Date();
//     const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
//     const previousMonthProgress = await Progress.findOne({
//       member_id,
//       created_at: {
//         $gte: lastMonth,
//         $lte: endOfLastMonth
//       }
//     })
//     .sort({ created_at: -1 }) // Get the latest from last month
//     .exec();
    
//     return previousMonthProgress;
//   } catch (error) {
//     console.error('Lỗi khi lấy chỉ số cơ thể tháng trước:', error);
//     throw new Error('Không thể lấy chỉ số cơ thể tháng trước');
//   }
// }

// dùng tạm nhé
export async function getPreviousMonthBodyMetrics(member_id: Types.ObjectId): Promise<IProgress | null> {
  try {
    const secondLatestProgress = await Progress.find({ member_id })
      .sort({ created_at: -1 }) // sắp xếp giảm dần: mới nhất trước
      .skip(1) // bỏ qua bản ghi đầu tiên
      .limit(1) // lấy đúng 1 bản ghi tiếp theo
      .exec();

    return secondLatestProgress[0] || null; // kết quả là mảng, lấy phần tử đầu tiên
  } catch (error) {
    console.error('Lỗi khi lấy chỉ số cơ thể mới nhất thứ 2:', error);
    throw new Error('Không thể lấy chỉ số cơ thể mới nhất thứ 2');
  }
}

/**
 * Lấy tất cả các chỉ số cơ thể để so sánh (hiện tại, trước đó, ban đầu)
 */
export async function getBodyMetricsComparison(member_id: Types.ObjectId): Promise<BodyMetricsComparison> {
  try {
    const current = await getLatestBodyMetrics(member_id);
    const initial = await getInitialBodyMetrics(member_id);
    const previous = await getPreviousMonthBodyMetrics(member_id);
    
    return { current, initial, previous };
  } catch (error) {
    console.error('Lỗi khi lấy so sánh chỉ số cơ thể:', error);
    throw new Error('Không thể lấy so sánh chỉ số cơ thể');
  }
}

/**
 * Cập nhật chỉ số cơ thể mới nhất
 */
export async function updateBodyMetrics(params: BodyMetricsParams): Promise<IProgress> {
  try {
    const { member_id, ...bodyMetrics } = params;
    
    // Tính BMI nếu có cả cân nặng và chiều cao
    if (bodyMetrics.weight && bodyMetrics.height) {
      // BMI = weight (kg) / (height (m))^2
      const heightInMeters = bodyMetrics.height / 100;
      bodyMetrics.bmi = parseFloat((bodyMetrics.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }
    
    const newProgress = new Progress({
      member_id,
      ...bodyMetrics,
      created_at: new Date()
    });
    
    await newProgress.save();
    return newProgress;
  } catch (error) {
    console.error('Lỗi khi cập nhật chỉ số cơ thể:', error);
    throw new Error('Không thể cập nhật chỉ số cơ thể');
  }
}

/**
 * Lấy tiến độ chỉ số cơ thể theo từng tháng
 */
export async function getBodyStatsProgressByMonth(member_id: Types.ObjectId, months: number = 6): Promise<BodyStatsProgress[]> {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    
    // Lấy tất cả các records trong khoảng thời gian
    const progressRecords = await Progress.find({
      member_id,
      created_at: { $gte: startDate }
    }).sort({ created_at: 1 }).exec();
    
    // Nhóm records theo tháng và lấy record cuối cùng cho mỗi tháng
    const monthlyRecords = new Map<string, IProgress>();
    
    progressRecords.forEach(record => {
      const date = record.created_at;
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthlyRecords.set(monthKey, record);
    });
    
    // Chuyển đổi Map thành mảng dữ liệu cần thiết
    const result: BodyStatsProgress[] = Array.from(monthlyRecords).map(([month, record]) => ({
      month,
      weight: record.weight,
      body_fat: record.body_fat,
      muscle_mass: record.muscle_mass,
      bmi: record.bmi
    }));
    
    return result;
  } catch (error) {
    console.error('Lỗi khi lấy tiến độ chỉ số cơ thể theo tháng:', error);
    throw new Error('Không thể lấy tiến độ chỉ số cơ thể theo tháng');
  }
}

/**
 * Lấy dữ liệu cho biểu đồ radar thể hiện sự phát triển các chỉ số
 */
export async function getFitnessRadarData(member_id: Types.ObjectId): Promise<FitnessRadarData[]> {
  try {
    // Lấy chỉ số hiện tại và ban đầu
    const current = await getLatestBodyMetrics(member_id);
    const initial = await getInitialBodyMetrics(member_id);
    
    if (!current || !initial) {
      throw new Error('Không có đủ dữ liệu để tạo biểu đồ radar');
    }
    
    // Tính toán điểm số cho từng chỉ số (thang điểm 1-10)
    // Các hằng số này nên được điều chỉnh dựa trên dữ liệu thực tế và mục tiêu của người dùng
    const MAX_WEIGHT = 100; // Cân nặng tối đa tham chiếu
    const MIN_WEIGHT = 50;  // Cân nặng tối thiểu tham chiếu
    const IDEAL_BODY_FAT = 15; // Tỷ lệ mỡ lý tưởng
    const IDEAL_MUSCLE_MASS = 40; // Khối lượng cơ lý tưởng
    const IDEAL_BMI = 22; // BMI lý tưởng
    
    // Tính điểm cho các chỉ số
    const calculateStrengthScore = (muscleMass: number) => {
      return Math.min(10, Math.max(1, (muscleMass / IDEAL_MUSCLE_MASS) * 10));
    };
    
    const calculateEnduranceScore = (bodyFat: number) => {
      // Càng ít mỡ, điểm càng cao (nhưng không quá thấp)
      const idealDiff = Math.abs(bodyFat - IDEAL_BODY_FAT);
      return Math.min(10, Math.max(1, 10 - idealDiff / 2));
    };
    
    const calculateBalanceScore = (bmi: number) => {
      // Càng gần BMI lý tưởng, điểm càng cao
      const idealDiff = Math.abs(bmi - IDEAL_BMI);
      return Math.min(10, Math.max(1, 10 - idealDiff));
    };
    
    const calculateFlexibilityScore = (weight: number, height: number) => {
      // Giả định: score dựa trên tỷ lệ cân nặng/chiều cao
      const ratio = weight / height;
      const idealRatio = 0.4; // tỷ lệ lý tưởng
      const diff = Math.abs(ratio - idealRatio);
      return Math.min(10, Math.max(1, 10 - diff * 20));
    };
    
    const calculateCardioScore = (bodyFat: number, muscleMass: number) => {
      // Giả định: Điểm tim mạch dựa trên tỷ lệ cơ/mỡ
      const ratio = muscleMass / bodyFat;
      return Math.min(10, Math.max(1, ratio * 2));
    };
    
    // Tạo dữ liệu radar
    const radarData: FitnessRadarData[] = [
      {
        subject: 'Sức bền',
        current: parseFloat(calculateEnduranceScore(current.body_fat).toFixed(1)),
        initial: parseFloat(calculateEnduranceScore(initial.body_fat).toFixed(1)),
        full: 10
      },
      {
        subject: 'Sức mạnh',
        current: parseFloat(calculateStrengthScore(current.muscle_mass).toFixed(1)),
        initial: parseFloat(calculateStrengthScore(initial.muscle_mass).toFixed(1)),
        full: 10
      },
      {
        subject: 'Linh hoạt',
        current: parseFloat(calculateFlexibilityScore(current.weight, current.height).toFixed(1)),
        initial: parseFloat(calculateFlexibilityScore(initial.weight, initial.height).toFixed(1)),
        full: 10
      },
      {
        subject: 'Cân đối',
        current: parseFloat(calculateBalanceScore(current.bmi).toFixed(1)),
        initial: parseFloat(calculateBalanceScore(initial.bmi).toFixed(1)),
        full: 10
      },
      {
        subject: 'Tim mạch',
        current: parseFloat(calculateCardioScore(current.body_fat, current.muscle_mass).toFixed(1)),
        initial: parseFloat(calculateCardioScore(initial.body_fat, initial.muscle_mass).toFixed(1)),
        full: 10
      }
    ];
    
    return radarData;
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu biểu đồ radar:', error);
    throw new Error('Không thể tạo dữ liệu biểu đồ radar');
  }
}

/**
 * Tính % thay đổi giữa 2 giá trị
 */
export function calculatePercentChange(current: number, previous: number): string {
  if (previous === 0) return '0';
  const change = ((current - previous) / previous) * 100;
  return change.toFixed(1);
}


/**
 * Lấy chỉ số cơ thể mới nhất của từng tháng từ khi bắt đầu đến hiện tại
 * @param member_id ID của thành viên
 * @returns Mảng các chỉ số cơ thể mới nhất theo tháng
 */
export async function getMonthlyBodyMetrics(member_id: Types.ObjectId): Promise<IProgress[]> {
  try {
    // Lấy bản ghi đầu tiên để biết thời gian bắt đầu
    const initialProgress = await Progress.findOne({ member_id })
      .sort({ created_at: 1 })
      .exec();

    if (!initialProgress) {
      return []; // Trả về mảng rỗng nếu không có bản ghi nào
    }

    const startDate = new Date(initialProgress.created_at);
    const currentDate = new Date();
    
    // Tạo mảng kết quả
    const monthlyMetrics: IProgress[] = [];
    
    // Lặp qua từng tháng từ tháng bắt đầu đến hiện tại
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Lặp qua từng tháng từ startDate đến currentDate
    for (let year = startYear; year <= currentYear; year++) {
      // Xác định tháng bắt đầu và kết thúc trong năm
      const firstMonth = (year === startYear) ? startMonth : 0;
      const lastMonth = (year === currentYear) ? currentMonth : 11;

      for (let month = firstMonth; month <= lastMonth; month++) {
        // Xác định ngày đầu tiên và cuối cùng của tháng
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        // Tìm bản ghi cuối cùng trong tháng
        const latestProgressInMonth = await Progress.findOne({
          member_id,
          created_at: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
          }
        })
        .sort({ created_at: -1 })
        .exec();
        
        // Nếu có bản ghi trong tháng, thêm vào kết quả
        if (latestProgressInMonth) {
          monthlyMetrics.push(latestProgressInMonth);
        }
      }
    };
    
    return monthlyMetrics;
  }
  catch (error) {
    console.error('Lỗi khi lấy các chỉ số cơ thể theo tháng:', error);
    throw new Error('Không thể lấy các chỉ số cơ thể theo tháng');
  }
}

export async function getFormattedMonthlyBodyMetrics(member_id: Types.ObjectId): Promise<{
  month: string;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  bmi: number;
}[]> {
  try {
    const monthlyMetrics = await getMonthlyBodyMetrics(member_id);
    
    return monthlyMetrics.map(metric => {
      const date = new Date(metric.created_at);
      const month = date.getMonth() + 1; // Tháng từ 1-12
      const year = date.getFullYear();
      
      // Định dạng tháng theo MM/YYYY (đảm bảo có 2 chữ số)
      const formattedMonth = month.toString().padStart(2, '0');
      
      return {
        month: `${formattedMonth}/${year}`,
        weight: metric.weight,
        body_fat: metric.body_fat,
        muscle_mass: metric.muscle_mass,
        bmi: metric.bmi
      };
    });
  } catch (error) {
    console.error('Lỗi khi định dạng chỉ số cơ thể theo tháng:', error);
    throw new Error('Không thể định dạng chỉ số cơ thể theo tháng');
  }
}

export default {
  getLatestBodyMetrics,
  getInitialBodyMetrics,
  getPreviousMonthBodyMetrics,
  getBodyMetricsComparison,
  updateBodyMetrics,
  getBodyStatsProgressByMonth,
  getFitnessRadarData,
  calculatePercentChange,
  getMonthlyBodyMetrics,
  getFormattedMonthlyBodyMetrics
};