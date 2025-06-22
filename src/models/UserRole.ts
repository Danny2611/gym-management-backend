import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserRole extends Document {
  user_id: Types.ObjectId;
  role_id: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const userRoleSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true }, // Hoặc có thể là 'Trainer'
  role_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<IUserRole>('UserRole', userRoleSchema);
