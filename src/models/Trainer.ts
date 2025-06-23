import mongoose, { Document, Schema } from 'mongoose';

// Interface cho thời gian làm việc trong ngày
export interface IWorkingHours {
  start: string; // Định dạng "HH:MM"
  end: string;   // Định dạng "HH:MM"
  available: boolean;
}

// Interface cho lịch làm việc
export interface ISchedule {
  dayOfWeek: number; // 0: Chủ nhật, 1: Thứ 2, ..., 6: Thứ 7
  available: boolean;
  workingHours?: IWorkingHours[];
}

export interface ITrainer extends Document {
  image?: string;
  imagePublicId?: String,
  name: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  phone?: string;
  email: string;
   status: 'active' | 'inactive';
  schedule?: ISchedule[]; // Thêm lịch làm việc
   deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Schema cho thời gian làm việc
const workingHoursSchema: Schema = new Schema({
  start: { type: String, required: true }, // Định dạng "HH:MM"
  end: { type: String, required: true },   // Định dạng "HH:MM"
  available: { type: Boolean, default: true },
}, { _id: false });

// Schema cho lịch làm việc
const scheduleSchema: Schema = new Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  available: { type: Boolean, default: false },
  workingHours: [workingHoursSchema]
}, { _id: false });

const trainerSchema: Schema = new Schema({
  image: String,
  imagePublicId: String,
  name: { type: String, required: true },
  bio: String,
  specialization: String,
  experience: Number,
  phone: String,
  email: { type: String, required: true, unique: true },
   status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  schedule: [scheduleSchema], 
   deleted_at: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware để tự động cập nhật trường updated_at khi có thay đổi
trainerSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updated_at = new Date();
  }
  next();
});

export default mongoose.model<ITrainer>('Trainer', trainerSchema);