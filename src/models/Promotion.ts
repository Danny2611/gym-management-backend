import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPromotion extends Document {
  name: string;
  description?: string;
  discount: number;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive';
  applicable_packages: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

const promotionSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: String,
  discount: { type: Number, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  applicable_packages: [
    { type: Schema.Types.ObjectId, ref: 'Package' }
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Cập nhật tự động trường updated_at khi lưu
promotionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<IPromotion>('Promotion', promotionSchema);
