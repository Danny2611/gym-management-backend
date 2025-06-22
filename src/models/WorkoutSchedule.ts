import mongoose, { Document, Schema, Types } from 'mongoose';

interface ScheduledExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface IWorkoutSchedule extends Document {
  member_id: Types.ObjectId;
  date: Date;
  timeStart: Date;
  duration: number; // phút
  muscle_groups: string[];
  exercises?: ScheduledExercise[];
  workout_suggestion_id?: Types.ObjectId;
  location: string;
  status: 'upcoming' | 'completed' | 'missed';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const workoutScheduleSchema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  date: { type: Date, required: true },
  timeStart: { type: Date, required: true },
  duration: { type: Number, required: true }, // tính bằng phút
  muscle_groups: [String], // Nên là mảng để có thể tập nhiều nhóm cơ
  exercises: [{ 
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,
  }],
  workout_suggestion_id: { type: Schema.Types.ObjectId, ref: 'WorkoutSuggestion' },
  location: String,
  status: { 
    type: String, 
    enum: ['upcoming', 'completed', 'missed'], 
    default: 'upcoming'
  },
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<IWorkoutSchedule>('WorkoutSchedule', workoutScheduleSchema);
