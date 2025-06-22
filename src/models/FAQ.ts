import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

const faqSchema: Schema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<IFAQ>('FAQ', faqSchema);