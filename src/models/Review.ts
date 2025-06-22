// import mongoose, { Document, Schema, Types } from 'mongoose';

// export interface IReview extends Document {
//   member_id: Types.ObjectId;
//   trainer_id?: Types.ObjectId;
//   package_id?: Types.ObjectId;
//   rating: number;
//   comment?: string;
//   is_approved: boolean;
//   created_at: Date;
// }

// const reviewSchema: Schema = new Schema({
//   member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
//   trainer_id: { type: Schema.Types.ObjectId, ref: 'Trainer' },
//   package_id: { type: Schema.Types.ObjectId, ref: 'Package' },
//   rating: { type: Number, required: true, min: 1, max: 5 },
//   comment: String,
//   is_approved: { type: Boolean, default: false },
//   created_at: { type: Date, default: Date.now },
// });

// export default mongoose.model<IReview>('Review', reviewSchema);