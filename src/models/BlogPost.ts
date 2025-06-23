import mongoose, { Document, Schema, Types } from 'mongoose';
import { IBlogCategory } from './BlogCategory';
import { ITrainer } from './Trainer';
import { generateSlug } from '../utils/slugUtils';

// Interface cho Blog Post
export interface IBlogPost extends Document {
   _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImagePublicId: string;
  publishDate: Date;
  readTime: number;
  author?: mongoose.Types.ObjectId | ITrainer;
  category: mongoose.Types.ObjectId | IBlogCategory;
  tags?: string[];
  featured?: boolean;
  created_at: Date;
  updated_at: Date;
}

// Schema cho Blog Post
const blogPostSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String, required: true },
  coverImagePublicId: { type: String },
  publishDate: { type: Date, default: Date.now },
  readTime: { type: Number, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory', required: true },
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Middleware để tự động cập nhật trường updated_at khi có thay đổi
blogPostSchema.pre('save', function(this: IBlogPost, next) {
  if (this.isModified()) {
    this.updated_at = new Date();
  }
  next();
});

// Middleware để tự động tạo slug từ title
blogPostSchema.pre('save', function(this: IBlogPost, next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = generateSlug(this.title);
  }
  next();
});

// Middleware để cập nhật số lượng bài viết trong category khi có bài viết mới
blogPostSchema.post('save', async function(this: IBlogPost) {
  if (this.category) {
    const count = await mongoose.model('BlogPost').countDocuments({ category: this.category });
    await mongoose.model('BlogCategory').findByIdAndUpdate(this.category, { postCount: count });
  }
});

// Middleware để cập nhật số lượng bài viết trong category khi xóa bài viết
// Sử dụng 'findOneAndDelete' thay vì 'remove' cho phiên bản mongoose mới
blogPostSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.category) {
    const count = await mongoose.model('BlogPost').countDocuments({ category: doc.category });
    await mongoose.model('BlogCategory').findByIdAndUpdate(doc.category, { postCount: count });
  }
});

// Thêm sự kiện 'deleteOne' để bắt cả trường hợp xóa đơn lẻ
blogPostSchema.post('deleteOne', { document: true, query: false }, async function(this: IBlogPost) {
  if (this.category) {
    const count = await mongoose.model('BlogPost').countDocuments({ category: this.category });
    await mongoose.model('BlogCategory').findByIdAndUpdate(this.category, { postCount: count });
  }
});

export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);