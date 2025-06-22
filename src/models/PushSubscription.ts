import mongoose, { Document, Schema, Types } from 'mongoose';
interface IPushSubscription extends Document {
  member_id: Schema.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device_info?: {
    userAgent: string;
    platform: string;
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const pushSubscriptionSchema: Schema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  device_info: {
    userAgent: String,
    platform: String
  },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
// Tạo index unique cho member_id và endpoint
pushSubscriptionSchema.index({ member_id: 1, endpoint: 1 }, { unique: true });
export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);