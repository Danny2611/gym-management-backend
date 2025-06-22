import { BlogCategory } from '../models/BlogCategory';
import { generateSlug } from '../utils/slugUtils';

const seedBlogCategories = async () => {
  try {
    await BlogCategory.deleteMany({});
    console.log('Đã xóa dữ liệu BlogCategories cũ');

    const blogCategories = [
      {
        name: "Workouts",
        slug: generateSlug("Workouts"),
        postCount: 0,
        created_at: new Date('2024-01-15')
      },
      {
        name: "Nutrition",
        slug: generateSlug("Nutrition"),
        postCount: 0,
        created_at: new Date('2024-01-20')
      },
      {
        name: "Wellness",
        slug: generateSlug("Wellness"),
        postCount: 0,
        created_at: new Date('2024-02-05')
      },
      {
        name: "Success Stories",
        slug: generateSlug("Success Stories"),
        postCount: 0,
        created_at: new Date('2024-02-15')
      },
      {
        name: "Gym News",
        slug: generateSlug("Gym News"),
        postCount: 0,
        created_at: new Date('2024-03-01')
      }
    ];

    await BlogCategory.insertMany(blogCategories);
    console.log('Đã thêm 5 danh mục blog mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu BlogCategory:', error);
  }
};

export default seedBlogCategories;
