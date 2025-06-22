// src/controller/public/packaController.ts
import { Request, Response } from 'express';
import Package from '~/models/Package';
import PackageDetail from '~/models/PackageDetail';
import Promotion from '~/models/Promotion';
import mongoose from 'mongoose';

export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const packageData = await Package.findById(id);
    if (!packageData) {
      res.status(404).json({ message: 'Không tìm thấy gói tập' });
      return;
    }

    const packageDetail = await PackageDetail.findOne({ package_id: id });

    // Tìm khuyến mãi còn hiệu lực áp dụng cho gói tập này
    const now = new Date();
    const promotion = await Promotion.findOne({
      applicable_packages: new mongoose.Types.ObjectId(id),
      status: 'active',
      start_date: { $lte: now },
      end_date: { $gte: now }
    });

    let discountedPrice: number | null = null;
    if (promotion) {
      const discountAmount = (packageData.price * promotion.discount) / 100;
      discountedPrice = Math.round(packageData.price - discountAmount);
    }

    const packageWithDetailsAndPromotion = {
      ...packageData.toObject(),
      details: packageDetail ? packageDetail.toObject() : null,
      promotion: promotion
        ? {
            name: promotion.name,
            description: promotion.description,
            discount: promotion.discount,
            start_date: promotion.start_date,
            end_date: promotion.end_date,
            discountedPrice
          }
        : null
    };

    res.status(200).json(packageWithDetailsAndPromotion);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
}; 



// Xem danh sách gói tập
export const getPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const packages = await Package.find({ status: 'active' });
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export  default{
   getPackages,
  getPackageById
}
