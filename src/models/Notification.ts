import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  member_id: Types.ObjectId;
  trainer_id: Types.ObjectId;
  title: string;
  message: string;
  type: 'reminder' | 'promotion' | 'appointment'  | 'membership' | 'payment' | 'workout';
  status: 'sent' | 'pending' | 'failed' | 'read';
   priority: 'low' | 'medium' | 'high';
  scheduled_at?: Date;
  sent_at?: Date;
  read_at?: Date;
  data?: any;
  push_sent: boolean;
  created_at: Date;
  updated_at: Date;
}

const notificationSchema: Schema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  trainer_id: { type: Schema.Types.ObjectId, ref: 'Trainer' },
   title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['reminder', 'promotion', 'appointment',  'membership', 'payment', 'system', 'workout'], required: true },
  status: { 
    type: String, 
    enum: ['sent', 'pending', 'failed', 'read'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  scheduled_at: Date,
  sent_at: Date,
  read_at: Date,
  data: Schema.Types.Mixed,
  push_sent: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', notificationSchema);