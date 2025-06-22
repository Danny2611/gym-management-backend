import mongoose, { Document, Schema, Types } from 'mongoose';




// Interface cho Payment
export interface IPayment extends Document {
  member_id: Types.ObjectId;
  package_id: Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'qr' | 'credit' | 'napas' | 'undefined';
  paymentInfo?: any;
  transactionId?: string;
  created_at: Date;
  updated_at: Date;
}

const paymentSchema: Schema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  package_id: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  paymentMethod: { 
    type: String,
    enum: ['qr', 'credit', 'napas', 'undefined'],
    required: true 
  },
  transactionId: { type: String },
  paymentInfo: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<IPayment>('Payment', paymentSchema);
