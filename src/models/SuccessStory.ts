// import mongoose, { Document, Schema, Types } from 'mongoose';

// export interface ISuccessStory extends Document {
//   user_id: Types.ObjectId;
//   title: string;
//   story: string;
//   image?: string;
//   is_published: boolean;
//   created_at: Date;
// }

// const successStorySchema: Schema = new Schema({
//   user_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
//   title: { type: String, required: true },
//   story: { type: String, required: true },
//   image: String,
//   is_published: { type: Boolean, default: false },
//   created_at: { type: Date, default: Date.now },
// });

// export default mongoose.model<ISuccessStory>('SuccessStory', successStorySchema);