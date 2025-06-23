import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';  // Thêm dòng này

export interface IMember extends Document {
  _id: Types.ObjectId;
  name: string;
  avatar?: string;
  avatarPublicId: string, 
  email: string;
  password: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  role: Types.ObjectId;
  status: 'active' | 'inactive' | 'pending' | 'banned';
  otp?: string;
  otpExpires?: Date;
  isVerified: boolean;
  created_at: Date;
  updated_at: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const memberSchema: Schema = new Schema({
  name: { type: String, required: true },
  avatar: String,
  avatarPublicId: String, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: String,
  dateOfBirth: Date,
  address: String,
  role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'banned'], 
    default: 'active',
    required: true 
  },
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
memberSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
export default mongoose.model<IMember>('Member', memberSchema);
