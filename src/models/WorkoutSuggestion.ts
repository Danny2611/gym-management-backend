import mongoose, { Document, Schema, Types } from 'mongoose';

interface RepsRecommended {
    min: number;
    max: number;
  }
  
  interface ExerciseSuggestion {
    name: string;
    description: string;
    youtube_link: string;
    sets_recommended: number;
    reps_recommended: RepsRecommended;
    rest_recommended: number; // tính bằng giây
  }
  
  export interface IWorkoutSuggestion extends Document {
    muscle_group: string;
    goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'flexibility';
    level: 'beginner' | 'intermediate' | 'advanced';
    equipment: 'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'mixed';
    exercises: ExerciseSuggestion[];
    created_at: Date;
    updated_at: Date;
  }
const workoutSuggestionSchema = new Schema({
    muscle_group: String,
    goal: { 
      type: String, 
      enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility']
    },
    level: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'] 
    },
    equipment: { 
      type: String, 
      enum: ['bodyweight', 'dumbbell', 'barbell', 'machine', 'mixed'] 
    },
    exercises: [{
      name: String,
      description: String,
      youtube_link: String,
      sets_recommended: Number,
      reps_recommended: { min: Number, max: Number },
      rest_recommended: Number // thời gian nghỉ giữa các hiệp, tính bằng giây
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  });

  export default mongoose.model<IWorkoutSuggestion>('WorkoutSuggestion', workoutSuggestionSchema);
  