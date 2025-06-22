import mongoose, { Document, Schema } from 'mongoose';
import { generateSlug } from '../utils/slugUtils';


// Interface cho Blog Category
export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  postCount: number;
  created_at: Date;
  updated_at: Date;
}

// Schema cho Blog Category
const blogCategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  postCount: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Middleware để tự động cập nhật trường updated_at khi có thay đổi
blogCategorySchema.pre('save', function(this: IBlogCategory, next) {
  if (this.isModified()) {
    this.updated_at = new Date();
  }
  next();
});

// Middleware để tự động tạo slug từ name cho category
blogCategorySchema.pre('save', function(this: IBlogCategory, next) {
  if (this.isNew || this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
  next();
});

export const BlogCategory = mongoose.model<IBlogCategory>('BlogCategory', blogCategorySchema);