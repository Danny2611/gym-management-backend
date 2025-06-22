import mongoose, {
  Document,
  Schema,
  Types,
  CallbackError, // ✅ import để fix lỗi type
} from 'mongoose';

export interface IMembership extends Document {
  member_id: Types.ObjectId;
  package_id: Types.ObjectId;
  payment_id: Types.ObjectId;
  start_date: Date | null;
  end_date: Date | null;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'pending' | 'paused';
  available_sessions: number;
  used_sessions: number;
  last_sessions_reset?: Date;
  created_at: Date;
  updated_at: Date;
}


interface IPackage extends Document {
  training_sessions: number;
}

const membershipSchema: Schema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  package_id: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  auto_renew: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending', 'paused'],
    default: 'active',
  },
  available_sessions: { type: Number, default: 0 },
  used_sessions: { type: Number, default: 0 },
  last_sessions_reset: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ✅ Middleware cập nhật available_sessions
membershipSchema.pre('save', async function (next) {
  if (this.isModified('package_id') || this.isNew) {
    try {
      const Package = this.model('Package');
      const selectedPackage = await Package.findById(this.package_id) as IPackage;

      if (selectedPackage?.training_sessions) {
        this.available_sessions = selectedPackage.training_sessions;
        this.last_sessions_reset = new Date();
      }
    } catch (error) {
      return next(error as CallbackError); // ✅ ép kiểu lỗi
    }
  }

  if (this.isModified()) {
    this.updated_at = new Date();
  }

  next();
});

export default mongoose.model<IMembership>('Membership', membershipSchema);
