import { BlogCategory, IBlogCategory } from '../models/BlogCategory';


/**
 * Lấy toàn bộ danh mục blog
 */
export const getAllCategories = async (): Promise<IBlogCategory[]> => {
  try {
    const categories = await BlogCategory.find()
      .sort({ created_at: -1 }) // Có thể sắp xếp theo thời gian tạo mới nhất
      .exec();

    return categories;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    throw new Error('Không thể lấy danh sách danh mục blog');
  }
};

/**
 * Lấy danh mục blog theo slug
 * @param slug - Slug của danh mục blog cần tìm
 */
export const getCategoryBySlug = async (slug: string): Promise<IBlogCategory | null> => {
  try {
    const category = await BlogCategory.findOne({ slug })
      .exec();
    
    return category;
  } catch (error) {
    console.error(`Error fetching blog category with slug '${slug}':`, error);
    throw new Error('Không thể lấy thông tin danh mục blog');
  }
};

export default {
  getAllCategories,
  getCategoryBySlug
}