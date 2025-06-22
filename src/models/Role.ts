import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
}

const roleSchema: Schema = new Schema({
  name: { type: String, required: true, enum: ['Member', 'Admin', 'Trainer'] },
});

export default mongoose.model<IRole>('Role', roleSchema);