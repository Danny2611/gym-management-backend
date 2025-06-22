// src/controller/public/blogPostController.ts
import { Request, Response } from 'express';
import blogService from '~/services/blogPostService';

export const getLatestPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const posts = await blogService.getLatestPosts(limit);

    res.status(200).json({
      success: true,
      message: 'Lấy bài viết mới nhất thành công',
      data: posts
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy bài viết mới nhất:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy bài viết mới nhất'
    });
  }
};

export const   getFeaturedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const posts = await blogService.getFeaturedPosts(limit);

    res.status(200).json({
      success: true,
      message: 'Lấy bài viết nổi bật thành công',
      data: posts
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy bài viết nổi bật:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy bài viết nổi bật'
    });
  }
};

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await blogService.getAllPosts(page, pageSize);

    res.status(200).json({
      success: true,
      message: 'Lấy tất cả bài viết thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy tất cả bài viết:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy tất cả bài viết'
    });
  }
};

export const getPostsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await blogService.getPostsByCategory(slug, page, pageSize);

    res.status(200).json({
      success: true,
      message: `Lấy bài viết theo danh mục "${slug}" thành công`,
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy bài viết theo danh mục:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy bài viết theo danh mục'
    });
  }
};

export const getPostsByTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = req.params.tag;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await blogService.getPostsByTag(tag, page, pageSize);

    res.status(200).json({
      success: true,
      message: `Lấy bài viết theo thẻ "${tag}" thành công`,
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy bài viết theo thẻ:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy bài viết theo thẻ'
    });
  }
};

export const getPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const post = await blogService.getPostBySlug(slug);

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    } else {
      res.status(200).json({
        success: true,
        message: `Lấy bài viết với slug "${slug}" thành công`,
        data: post
      });
    }
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết bài viết:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết bài viết'
    });
  }
};


export default {
  getLatestPosts,
  getAllPosts,
  getPostsByCategory,
  getPostsByTag,
  getPostBySlug
};
