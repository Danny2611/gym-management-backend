import mongoose, { Document, Schema } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  max_members?: number;
  price: number;
  duration: number;
  description?: string;
  benefits: string[];
  status: 'active' | 'inactive';
  created_at: Date;
  deleted_at?: Date;
  updated_at: Date;
  category?: 'basic' | 'fitness' | 'premium' | 'platinum' |'vip';
  popular?: boolean;
  training_sessions?: number;
  session_duration?: number;
}

const packageSchema: Schema = new Schema({
  name: { type: String, required: true },
  max_members: Number,
  price: { type: Number, required: true },
  duration: Number,
  description: String,
  benefits: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  deleted_at: Date,
  updated_at: { type: Date, default: Date.now },
  category: { 
    type: String, 
    enum: ['basic' , 'fitness', 'premium' ,'platinum', 'vip'],
    default: 'basic'
  },
  popular: { 
    type: Boolean, 
    default: false 
  },
  training_sessions: { 
    type: Number, 
    default: 0, 
    description: 'Số buổi tập với PT mỗi tháng' 
  },
  session_duration: { 
    type: Number, 
    default: 60, 
    description: 'Thời lượng mỗi buổi tập (phút)' 
  }
});

export default mongoose.model<IPackage>('Package', packageSchema);
