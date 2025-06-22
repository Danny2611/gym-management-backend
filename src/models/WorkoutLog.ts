
// import mongoose, { Document, Schema, Types } from 'mongoose';

// interface Set {
//   weight: number;
//   reps: number;
//   completed: boolean;
// }

// interface ExerciseCompleted {
//   name: string;
//   sets: Set[];
// }

// export interface IWorkoutLog extends Document {
//   member_id: Types.ObjectId;
//   workout_schedule_id?: Types.ObjectId;
//   date_completed: Date;
//   actual_duration?: number;
//   exercises_completed: ExerciseCompleted[];
//   difficulty_rating?: number; // 1–5
//   feeling?: 'great' | 'good' | 'average' | 'tired' | 'exhausted';
//   notes?: string;
//   created_at: Date;
//   updated_at: Date;
// }

// export interface IWorkoutLog extends Document {
//   member_id: Types.ObjectId;
//   workout_schedule_id?: Types.ObjectId;
//   date_completed: Date;
//   actual_duration?: number;
//   exercises_completed: ExerciseCompleted[];
//   difficulty_rating?: number; // 1–5
//   feeling?: 'great' | 'good' | 'average' | 'tired' | 'exhausted';
//   notes?: string;
//   created_at: Date;
//   updated_at: Date;
// }


// const workoutLogSchema = new Schema({
//   member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
//   workout_schedule_id: { type: Schema.Types.ObjectId, ref: 'WorkoutSchedule' },
//   date_completed: { type: Date, default: Date.now },
//   actual_duration: Number, // thời gian thực tế, phút
//   exercises_completed: [{
//     name: String,
//     sets: [{
//       weight: Number,
//       reps: Number,
//       completed: Boolean
//     }]
//   }],
//   difficulty_rating: { type: Number, min: 1, max: 5 }, // đánh giá độ khó
//   feeling: { 
//     type: String, 
//     enum: ['great', 'good', 'average', 'tired', 'exhausted'] 
//   },
//   notes: String,
//   created_at: { type: Date, default: Date.now },
//   updated_at: { type: Date, default: Date.now }
// });
// export default mongoose.model<IWorkoutLog>('WorkoutLog', workoutLogSchema);
