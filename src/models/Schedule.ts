// import mongoose, { Document, Schema, Types } from 'mongoose';

// export interface ISchedule extends Document {
//   member_id: Types.ObjectId;
//   trainer_id: Types.ObjectId;
//   package_id: Types.ObjectId;
//   location?: string;
//   date: Date;
//   notes?: string;
//   time: string;
//   created_at: Date;
//   updated_at: Date;
// }

// const scheduleSchema: Schema = new Schema({
//   member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
//   trainer_id: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
//   package_id: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
//   location: String,
//   date: { type: Date, required: true },
//   notes: String,
//   time: { type: String, required: true },
//   created_at: { type: Date, default: Date.now },
//   updated_at: { type: Date, default: Date.now },
// });

// export default mongoose.model<ISchedule>('Schedule', scheduleSchema);