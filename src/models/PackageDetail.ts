import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPackageDetail extends Document {
  package_id: Types.ObjectId;
  schedule: string[];
  training_areas: string[];
  additional_services: string[];
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

const packageDetailSchema: Schema = new Schema({
  package_id: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
  schedule: [String],
  training_areas: [String],
  additional_services: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: Date
});

export default mongoose.model<IPackageDetail>('PackageDetail', packageDetailSchema);