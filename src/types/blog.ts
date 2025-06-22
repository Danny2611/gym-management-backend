// src/types/blog.ts

export interface BlogAuthor {
  id: string;
  name: string;
  bio: string;
  avatar: string;
}

export interface BlogCategoryResponse {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface BlogPostResponse {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  publishDate: string; // ISO format string
  readTime: number;
  author?: BlogAuthor;
  category: BlogCategoryResponse;
  tags?: string[];
  featured?: boolean;
}
