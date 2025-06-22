import Package from '../models/Package';
import Promotion from '../models/Promotion';

const seedPromotions = async () => {
  try {
    // Xóa dữ liệu cũ nếu cần
    // await Promotion.deleteMany();

    // Tìm Gói Cơ Bản
    const basicPackage = await Package.findOne({ name: 'Gói Cơ Bản' });

    if (!basicPackage) {
      console.warn('⚠️ Không tìm thấy "Gói Cơ Bản", bỏ qua khuyến mãi liên kết.');
    }

    // Dữ liệu khuyến mãi mẫu
    const promotions = [
      ...(basicPackage
        ? [{
            name: 'Giảm 20% cho Gói Cơ Bản',
            description: 'Khuyến mãi đặc biệt dành riêng cho Gói Cơ Bản',
            discount: 20,
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'active',
            applicable_packages: [basicPackage._id],
            created_at: new Date(),
            updated_at: new Date()
          }]
        : [])
    ];

    // Thêm dữ liệu vào database
    await Promotion.insertMany(promotions);
    console.log('Đã thêm khuyến mãi cho Gói Cơ Bản thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Promotion:', error);
  }
};

export default seedPromotions;
