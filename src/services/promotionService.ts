import Promotion from '~/models/Promotion';
import { IPromotion } from '~/types/promotion';

export async function getAllActivePromotions(): Promise<IPromotion[]> {
  try {
    const currentDate = new Date();

    const promotions = await Promotion.find({
      status: 'active',
      start_date: { $lte: currentDate },
      end_date: { $gte: currentDate }
    })
      .populate({
        path: 'applicable_packages',
        select: 'name price benefits' // Lấy các trường mong muốn từ Package
      })
       .lean<IPromotion[]>();

    return promotions;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khuyến mãi:', error);
    throw new Error('Không thể lấy danh sách khuyến mãi');
  }
}

export default {
  getAllActivePromotions
};
