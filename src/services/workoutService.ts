// src/services/workoutService.ts
import WorkoutSuggestion, { IWorkoutSuggestion } from '../models/WorkoutSuggestion';
import WorkoutSchedule, { IWorkoutSchedule } from '../models/WorkoutSchedule';
import { Types } from 'mongoose';
import llamaService from './llamaService';
import cron from 'node-cron';
import { MonthComparison, MonthlyStats, RecentWorkoutLog, WeeklyWorkout,  WorkoutScheduleNextWeek } from '../types/workoutSchedule';
export interface WorkoutSuggestionParams {
  muscleGroup: string;
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'flexibility';
  level: 'beginner' | 'intermediate' | 'advanced';
  equipment: 'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'mixed';
}

export interface CreateWorkoutScheduleParams {
  member_id: Types.ObjectId;
  date: Date;
  timeStart: Date;
  duration: number;
  muscle_groups: string[];
  location: string;
  notes?: string;
  exercises?: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  workout_suggestion_id?: Types.ObjectId;
}

export interface WorkoutScheduleFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  status?: 'upcoming' | 'completed' | 'missed';
  muscleGroup?: string;
}

// Tạo và lưu gợi ý bài tập
export async function createWorkoutSuggestion(params: WorkoutSuggestionParams): Promise<IWorkoutSuggestion> {
  try {
    // Kiểm tra xem đã có gợi ý tương tự trong DB chưa
    const existingSuggestion = await WorkoutSuggestion.findOne({
      muscle_group: params.muscleGroup,
      goal: params.goal,
      level: params.level,
      equipment: params.equipment
    });

    // Nếu đã có, trả về gợi ý đã có
    if (existingSuggestion) {
      return existingSuggestion;
    }

    // Nếu chưa có, gọi Llama để tạo gợi ý mới
    const exercises = await llamaService.generateWorkoutSuggestion(params);

    // Lưu gợi ý mới vào DB
    const newSuggestion = new WorkoutSuggestion({
      muscle_group: params.muscleGroup,
      goal: params.goal,
      level: params.level,
      equipment: params.equipment,
      exercises: exercises
    });

    await newSuggestion.save();
    return newSuggestion;
  } catch (error) {
    console.error('Lỗi khi tạo gợi ý bài tập:', error);
    throw new Error('Không thể tạo gợi ý bài tập');
  }
}

// Tạo lịch tập cá nhân
export async function createWorkoutSchedule(scheduleData: CreateWorkoutScheduleParams): Promise<IWorkoutSchedule> {
  try {
    const newSchedule = new WorkoutSchedule({
      ...scheduleData,
      status: 'upcoming',
      created_at: new Date(),
      updated_at: new Date()
    });

    await newSchedule.save();
    return newSchedule;
  } catch (error) {
    console.error('Lỗi khi tạo lịch tập cá nhân:', error);
    throw new Error('Không thể tạo lịch tập cá nhân');
  }
}

// Lấy tất cả lịch tập của member
export async function getMemberWorkoutSchedules(
  memberId: string,
  filters: WorkoutScheduleFilters = {}
): Promise<IWorkoutSchedule[]> {
  try {
    const query: any = {
      member_id: new Types.ObjectId(memberId)
    };

    // Áp dụng bộ lọc
    if (filters.status) {
      query.status = filters.status;
    }

    // Lọc theo khoảng thời gian
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    // Lọc theo nhóm cơ (nếu có)
    if (filters.muscleGroup) {
      query.muscle_groups = filters.muscleGroup;
    }

    const schedules = await WorkoutSchedule.find(query)
      .populate('workout_suggestion_id')
      .sort({ date: 1, timeStart: 1 });

    return schedules;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch tập:', error);
    throw new Error('Không thể lấy danh sách lịch tập');
  }
}

// Lấy chi tiết một lịch tập
export async function getWorkoutScheduleById(scheduleId: string): Promise<IWorkoutSchedule | null> {
  try {
    const schedule = await WorkoutSchedule.findById(scheduleId)
      .populate('workout_suggestion_id')
      .populate('member_id', 'name avatar');

    return schedule;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết lịch tập:', error);
    throw new Error('Không thể lấy chi tiết lịch tập');
  }
}

// Cập nhật trạng thái lịch tập
export async function updateWorkoutScheduleStatus(
  scheduleId: string,
  status: 'upcoming' | 'completed' | 'missed'
): Promise<IWorkoutSchedule | null> {
  try {
    const schedule = await WorkoutSchedule.findByIdAndUpdate(
      scheduleId,
      { status, updated_at: new Date() },
      { new: true }
    );

    return schedule;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái lịch tập:', error);
    throw new Error('Không thể cập nhật trạng thái lịch tập');
  }
}



export async function getWeeklyWorkoutStats(memberId: string, startDate?: Date, endDate?: Date): Promise<WeeklyWorkout[]> {
  try {
    // If no dates provided, default to current week
    const today = startDate || new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Get all workout schedules for the member in the current week
    const schedules = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId),
      date: { 
        $gte: weekStart, 
        $lte: weekEnd 
      },
      status: 'completed'
    });

    // Create a map to track workouts by day of week
    const weeklyWorkoutMap: { [key: string]: WeeklyWorkout } = {
      "T2": { name: "T2", sessions: 0, duration: 0, target: 1 },
      "T3": { name: "T3", sessions: 0, duration: 0, target: 1 },
      "T4": { name: "T4", sessions: 0, duration: 0, target: 1 },
      "T5": { name: "T5", sessions: 0, duration: 0, target: 1 },
      "T6": { name: "T6", sessions: 0, duration: 0, target: 1 },
      "T7": { name: "T7", sessions: 0, duration: 0, target: 1 },
      "CN": { name: "CN", sessions: 0, duration: 0, target: 1 }
    };

    // Populate the map with actual workout data
    schedules.forEach(schedule => {
      const dayOfWeek = getDayOfWeekLabel(schedule.date);
      if (weeklyWorkoutMap[dayOfWeek]) {
        weeklyWorkoutMap[dayOfWeek].sessions += 1;
        weeklyWorkoutMap[dayOfWeek].duration += schedule.duration;
      }
    });

    return Object.values(weeklyWorkoutMap);
  } catch (error) {
    console.error('Error fetching weekly workout stats:', error);
    throw new Error('Failed to retrieve weekly workout statistics');
  }
}

export function getDayOfWeekLabel(date: Date): string {
  const dayIndex = date.getDay();
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return dayLabels[dayIndex];
}

export async function getMonthComparisonStats(memberId: string): Promise<MonthComparison> {
  try {
    // Current month dates
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    const currentMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0);

    // Previous month dates
    const previousMonthStart = new Date(currentMonthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(previousMonthStart.getFullYear(), previousMonthStart.getMonth() + 1, 0);

    // Get current month completed schedules
    const currentMonthCompletedSchedules = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId),
      date: { 
        $gte: currentMonthStart, 
        $lte: currentMonthEnd 
      },
      status: 'completed'
    });

    // Get current month missing schedules
    const currentMonthMissingSchedules = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId),
      date: { 
        $gte: currentMonthStart, 
        $lte: currentMonthEnd 
      },
      status: 'missed'
    });

    // Get previous month completed schedules
    const previousMonthCompletedSchedules = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId),
      date: { 
        $gte: previousMonthStart, 
        $lte: previousMonthEnd 
      },
      status: 'completed'
    });

    // Get previous month missing schedules
    const previousMonthMissingSchedules = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId),
      date: { 
        $gte: previousMonthStart, 
        $lte: previousMonthEnd 
      },
      status: 'missed'
    });

    // Calculate current month stats
    const currentMonthStats = calculateMonthlyStats(
      currentMonthCompletedSchedules, 
      currentMonthMissingSchedules
    );
    
    // Calculate previous month stats
    const previousMonthStats = calculateMonthlyStats(
      previousMonthCompletedSchedules,
      previousMonthMissingSchedules
    );

    return {
      current: currentMonthStats,
      previous: previousMonthStats
    };
  } catch (error) {
    console.error('Error fetching month comparison stats:', error);
    throw new Error('Failed to retrieve month comparison statistics');
  }
}

function calculateMonthlyStats(
  completedSchedules: IWorkoutSchedule[], 
  missingSchedules: IWorkoutSchedule[]
): MonthlyStats {
  const totalSessions = completedSchedules.length;
  const totalDuration = completedSchedules.reduce((sum, schedule) => sum + schedule.duration, 0);
  const avgSessionLength = totalSessions > 0 
    ? Math.round(totalDuration / totalSessions) 
    : 0;
  
  // Calculate completion rate based on the ratio between completed and total (completed + missing) schedules
  const totalScheduled = completedSchedules.length + missingSchedules.length;
  const completionRate = totalScheduled > 0
    ? Math.round((completedSchedules.length / totalScheduled) * 100)
    : 0;

  return {
    totalSessions,
    totalDuration,
    completionRate,
    avgSessionLength
  };
}

export async function getLast7DaysWorkouts(memberId: string): Promise<RecentWorkoutLog[]> {
  try {
    // Tính toán khoảng thời gian 7 ngày gần nhất (bao gồm cả ngày hôm nay)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // Lấy 7 ngày (bao gồm hôm nay)
    
    // Đặt giờ, phút, giây về 00:00:00 cho sevenDaysAgo để bao gồm cả ngày đó
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    // Đặt giờ, phút, giây về 23:59:59 cho today để bao gồm toàn bộ ngày hôm nay
    today.setHours(23, 59, 59, 999);
    
    // Truy vấn cơ sở dữ liệu để lấy các buổi tập trong 7 ngày gần nhất
    const workouts = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId), // Sử dụng member_id thay vì memberId
      date: { $gte: sevenDaysAgo, $lte: today }
    }).select('created_at muscle_groups duration status'); // Chỉ lấy các trường cần thiết
    
    // Chuyển đổi kết quả sang định dạng RecentWorkoutLog
    return workouts.map(workout => ({
      created_at: workout.created_at,
      muscle_groups: workout.muscle_groups,
      duration: workout.duration,
      status: workout.status
    }));
  } catch (error) {
    console.error('Error fetching last 7 days workouts:', error);
    throw new Error('Failed to fetch recent workouts');
}
}

// Lấy các buổi tập được lên lịch trong 7 ngày tới
export async function getUpcomingWorkouts(memberId: string): Promise<WorkoutScheduleNextWeek[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingWorkouts = await WorkoutSchedule.find({
      member_id: new Types.ObjectId(memberId),
      date: { $gte: today, $lt: nextWeek },
      status: 'upcoming',
    }).sort({ date: 1, timeStart: 1 });

    const workoutsWithEndTime: WorkoutScheduleNextWeek[] = upcomingWorkouts.map(workout => {
      const endTime = new Date(workout.timeStart);
      endTime.setMinutes(endTime.getMinutes() + workout.duration);

      return {
        date: workout.date,
        timeStart: workout.timeStart,
        timeEnd: endTime,
        location: workout.location,
        status: workout.status,
      };
    });

    return workoutsWithEndTime;
  } catch (error) {
    console.error('Lỗi khi lấy lịch tập sắp tới:', error);
    throw new Error('Không thể lấy danh sách lịch tập sắp tới');
  }
}


// Tự động cập nhật các lịch tập bị bỏ lỡ
export async function updateMissedWorkoutSchedules(): Promise<void> {
  try {
    const now = new Date();
    // Tìm các lịch tập có thời gian kết thúc trong quá khứ và chưa hoàn thành
    const result = await WorkoutSchedule.updateMany(
      {
        status: 'upcoming',
        $expr: {
          $lt: [
            {
              $add: ['$timeStart', { $multiply: ['$duration', 60000] }] // timeStart + duration (in ms)
            },
            now
          ]
        }
      },
      {
        $set: { status: 'missed', updated_at: new Date() }
      }
    );
    console.log(`Đã cập nhật ${result.modifiedCount} lịch tập bị bỏ lỡ.`);
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch tập bị bỏ lỡ:', error);
  }
}

// Khởi tạo các công việc được lập lịch
export function initScheduledWorkoutJobs(): void {
  cron.schedule('5 0 * * *', async () => {
    console.log('Running scheduled job: Update missed appointments and workouts');
    // await updateMissedAppointments(); // Giả định hàm này được import từ nơi khác
    await updateMissedWorkoutSchedules();
  });
}
// Export tất cả các hàm dưới dạng một object (nếu muốn giữ cách sử dụng tương tự như trước)
export default {
  createWorkoutSuggestion,
  createWorkoutSchedule,
  getMemberWorkoutSchedules,
  getWorkoutScheduleById,
  updateWorkoutScheduleStatus,
  updateMissedWorkoutSchedules,
  initScheduledWorkoutJobs,

  getWeeklyWorkoutStats,
  getMonthComparisonStats,
  getLast7DaysWorkouts,
  getUpcomingWorkouts
};