import { Request, Response } from 'express';
import  blogCategoryService from '../../services/blogCategoryService';

export const getAllBlogCategories = async (req: Request, res: Response) => {
  try {
    const categories = await blogCategoryService.getAllCategories();
    res.json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh mục',
    });
  }
};

export const getCategoryBySlug  = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const post = await blogCategoryService.getCategoryBySlug(slug);

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
    getAllBlogCategories,
    getCategoryBySlug
}
