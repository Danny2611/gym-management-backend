// services/blogService.ts
import { BlogPostResponse, BlogAuthor } from '../types/blog';
import { BlogPost, IBlogPost } from '../models/BlogPost';
import { BlogCategory } from '../models/BlogCategory';

import { Types } from 'mongoose';

// Lấy n bài viết mới nhất
const getLatestPosts = async (
  limit: number = 5
): Promise<BlogPostResponse[]> => {
  try {
    const posts = await BlogPost.find()
      .sort({ publishDate: -1 }) // Sắp xếp theo thời gian xuất bản mới nhất
      .limit(limit)
      .populate('author', 'name bio image')
      .populate('category', 'name slug postCount')
      .exec();

    return posts.map(post => formatBlogPostForFrontend(post));
  } catch (error) {
    console.error('Error fetching latest blog posts:', error);
    throw new Error('Failed to fetch latest blog posts');
  }
};

// Lấy n bài viết nổi bật (featured = true)
const getFeaturedPosts = async (
  limit: number = 5
): Promise<BlogPostResponse[]> => {
  try {
    const posts = await BlogPost.find({ featured: true })
      .sort({ publishDate: -1 }) // Có thể sắp xếp theo thời gian đăng
      .limit(limit)
      .populate('author', 'name bio image')
      .populate('category', 'name slug postCount')
      .exec();

    return posts.map(post => formatBlogPostForFrontend(post));
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    throw new Error('Failed to fetch featured blog posts');
  }
};

// Lấy tất cả bài viết với phân trang (đơn giản hóa, không cần bộ lọc)
const getAllPosts = async (
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: BlogPostResponse[]; total: number; totalPages: number }> => {
  try {
    // Đếm tổng số bài viết
    const total = await BlogPost.countDocuments();
    
    // Tính tổng số trang
    const totalPages = Math.ceil(total / pageSize);
    
    // Lấy bài viết với phân trang
    const posts = await BlogPost.find()
      .sort({ publishDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('author', 'name bio image')
      .populate('category', 'name slug postCount')
      .exec();
    
    return {
      posts: posts.map(post => formatBlogPostForFrontend(post)),
      total,
      totalPages
    };
  } catch (error: any) {
  console.error('Error fetching all blog posts:', error);
  throw new Error(error.message || 'Failed to fetch blog posts');
}

};

// Lấy bài viết theo danh mục (category) bằng slug
const getPostsByCategory = async (
  categorySlug: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: BlogPostResponse[]; total: number; totalPages: number }> => {
  try {
    const category = await BlogCategory.findOne({ slug: categorySlug }).exec();
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    const query = { category: category._id };
    
    // Đếm tổng số bài viết trong danh mục
    const total = await BlogPost.countDocuments(query);
    
    // Tính tổng số trang
    const totalPages = Math.ceil(total / pageSize);
    
    // Lấy bài viết theo danh mục với phân trang
    const posts = await BlogPost.find(query)
      .sort({ publishDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('author', 'name bio image')
      .populate('category', 'name slug postCount')
      .exec();
    
    return {
      posts: posts.map(post => formatBlogPostForFrontend(post)),
      total,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    throw new Error('Failed to fetch posts by category');
  }
};

// Lấy bài viết theo thẻ (tag)
const getPostsByTag = async (
  tag: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ posts: BlogPostResponse[]; total: number; totalPages: number }> => {
  try {
    // Xây dựng query để tìm bài viết có chứa tag
    const query = { tags: { $in: [tag] } };
    
    // Đếm tổng số bài viết có chứa tag
    const total = await BlogPost.countDocuments(query);
    
    // Tính tổng số trang
    const totalPages = Math.ceil(total / pageSize);
    
    // Lấy bài viết theo tag với phân trang
    const posts = await BlogPost.find(query)
      .sort({ publishDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('author', 'name bio image')
      .populate('category', 'name slug postCount')
      .exec();
    
    return {
      posts: posts.map(post => formatBlogPostForFrontend(post)),
      total,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    throw new Error('Failed to fetch posts by tag');
  }
};

// Lấy chi tiết bài viết chỉ bằng slug
const getPostBySlug = async (
  slug: string
): Promise<BlogPostResponse | null> => {
  try {
    const post = await BlogPost.findOne({ slug })
      .populate('author', 'name bio image')
      .populate('category', 'name slug postCount')
      .exec();
    
    if (!post) {
      return null;
    }
    
    return formatBlogPostForFrontend(post);
  } catch (error) {
    console.error('Error fetching post details:', error);
    throw new Error('Failed to fetch post details');
  }
};

// Hàm helper để định dạng bài viết về dạng response cho frontend
const formatBlogPostForFrontend = (post: IBlogPost): BlogPostResponse => {
  return {
    _id: post._id.toString(),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    publishDate: post.publishDate.toISOString(),
    readTime: post.readTime,
    author: post.author ? {
      id: (post.author as any)._id?.toString() || '',
      name: (post.author as any).name || '',
      bio: (post.author as any).bio || '',
      avatar: (post.author as any).image || ''
    } : undefined,
    category: {
      id: (post.category as any)._id?.toString() || '',
      name: (post.category as any).name || '',
      slug: (post.category as any).slug || '',
      postCount: (post.category as any).postCount || 0
    },
    tags: post.tags || [],
    featured: post.featured || false
  };
};

export default {
  getLatestPosts,
  getFeaturedPosts,
  getAllPosts,
  getPostsByCategory,
  getPostsByTag,
  getPostBySlug
};