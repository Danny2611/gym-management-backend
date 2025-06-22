import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgress extends Document {
  member_id: Types.ObjectId;
  weight: number;
  height: number;
  muscle_mass: number;
  body_fat: number;
  bmi: number;
  created_at: Date;
  updated_at: Date;
}

const progressSchema: Schema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  muscle_mass: { type: Number, required: true },
  body_fat: { type: Number, required: true },
  bmi: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

progressSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});
// Đảm bảo tạo index cho trường member_id và created_at để tối ưu hiệu suất query
progressSchema.index({ member_id: 1, created_at: -1 });


export default mongoose.model<IProgress>('Progress', progressSchema);