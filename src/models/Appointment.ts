import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAppointment extends Document {
  member_id: Types.ObjectId;
  membership_id: Types.ObjectId;
  trainer_id: Types.ObjectId;          
  notes?: string;
  date: Date;
  time: {
    start: string;  // HH:MM format
    end: string;    // HH:MM format
  };
  location?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed';
  created_at: Date;
  updated_at: Date;
}

const appointmentSchema: Schema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  membership_id: { type: Schema.Types.ObjectId, ref: 'Membership', required: true },
  trainer_id: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  notes: String,
  date: { type: Date, required: true },
  time: {
    start: { type: String, required: true },  // HH:MM format
    end: { type: String, required: true }    // HH:MM format
  },
  location: String,
  status: { type: String, enum: ['confirmed', 'pending', 'cancelled', 'completed', 'missed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}); 

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);                