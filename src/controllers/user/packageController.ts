//src/user/PackageController

import { Request, Response } from 'express';
import { AuthRequest, asyncHandler } from '../../types/auth';
import Package from '../../models/Package';
import Membership from '../../models/Membership';
import { validatePackageRequest } from '../../utils/validators/packageValidator';
// import { AuthRequest } from '../../types/auth';


/**
 * Đăng ký gói tập
 * Chức năng: Kiểm tra thông tin gói tập, chuyển đến trang thanh toán
 */
export const registerPackage = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const errors = await validatePackageRequest(req);
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
      return;
    }
    
    const { packageId } = req.body;
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để đăng ký gói tập'
      });
      return;
    }
    
    // Kiểm tra gói tập tồn tại
    const packageInfo = await Package.findById(packageId);
    if (!packageInfo) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói tập'
      });
      return;
    }
    
    // Kiểm tra gói tập có khả dụng không
    if (packageInfo.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'Gói tập này hiện không khả dụng'
      });
      return;
    }
    
    // Kiểm tra xem thành viên đã đăng ký gói tập này chưa
    const existingMembership = await Membership.findOne({
      member_id: memberId,
      package_id: packageId,
      status: { $in: ['active', 'pending', 'paused', 'expired'] }
    });
    
  
    if (existingMembership?.status === 'active' ) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký gói tập này rồi. Vui lòng chọn gói tập khác!!'
      });
      return;
    }
    // Trả về thông tin gói tập để tiến hành thanh toán
    res.status(200).json({
      success: true,
      message: 'Gói tập hợp lệ, sẵn sàng để thanh toán',
      data: {
        packageId: packageInfo._id,
        packageName: packageInfo.name,
        price: packageInfo.price,
        duration: packageInfo.duration,
        category: packageInfo.category
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký gói tập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký gói tập'
    });
  }
});

export default {
  registerPackage
}