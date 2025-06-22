// Interfaces for weekly workout and month comparison data
export interface WeeklyWorkout {
  name: string;
  sessions: number;
  duration: number;
  target: number;
}

export interface MonthlyStats {
  totalSessions: number;
  totalDuration: number; // minutes
  completionRate: number;
  avgSessionLength: number;
}

export interface MonthComparison {
  current: MonthlyStats;
  previous: MonthlyStats;
}

// Extended interface for workout schedule filtering
export interface WorkoutScheduleFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  muscleGroup?: string;
}

export interface RecentWorkoutLog {
  created_at: Date;
  muscle_groups: string[];
  duration: number;
  status: 'upcoming' | 'completed' | 'missed';
}

export interface WorkoutScheduleNextWeek{
  date: Date;
  timeStart:Date;
  timeEnd?: Date;
  location: string;
  status: string;
} 