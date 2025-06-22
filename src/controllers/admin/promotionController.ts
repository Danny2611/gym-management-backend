// # Quản lý khuyến mãi
// # Quản lý chương trình khuyến mãi
// controller/admin/promotionController.ts
import { Request, Response } from 'express';
import promotionService from '../../services/admin/promotionService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all promotions with pagination, filtering and sorting
export const getAllPromotions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      sortBy,
      sortOrder,
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'active' | 'inactive' | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const promotionsData = await promotionService.getAllPromotions(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách chương trình khuyến mãi thành công',
      data: promotionsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chương trình khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách chương trình khuyến mãi',
    });
  }
};

// Get promotion by ID
export const getPromotionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ',
      });
      return;
    }

    const promotion = await promotionService.getPromotionById(id);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin chương trình khuyến mãi thành công',
      data: promotion,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin chương trình khuyến mãi:', error);
    
    if (error.message === 'Không tìm thấy chương trình khuyến mãi') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin chương trình khuyến mãi',
    });
  }
};

// Create new promotion
export const createPromotion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      discount,
      start_date,
      end_date,
      status = 'active',
      applicable_packages,
    } = req.body;

    // Validate required fields
    if (!name || !discount || !start_date || !end_date || !applicable_packages) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: tên, phần trăm giảm giá, ngày bắt đầu, ngày kết thúc, gói áp dụng',
      });
      return;
    }

    // Validate applicable_packages is array
    if (!Array.isArray(applicable_packages) || applicable_packages.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Danh sách gói áp dụng phải là mảng và không được rỗng',
      });
      return;
    }

    // Validate ObjectIds in applicable_packages
    const invalidPackageIds = applicable_packages.filter(id => !Types.ObjectId.isValid(id));
    if (invalidPackageIds.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều ID gói không hợp lệ',
      });
      return;
    }

    const promotionData = {
      name: name.trim(),
      description: description?.trim(),
      discount: parseFloat(discount),
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      status,
      applicable_packages,
    };

    const newPromotion = await promotionService.createPromotion(promotionData);

    res.status(201).json({
      success: true,
      message: 'Tạo chương trình khuyến mãi thành công',
      data: newPromotion,
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo chương trình khuyến mãi:', error);

    if (error.message.includes('Ngày kết thúc phải sau ngày bắt đầu') ||
        error.message.includes('Phần trăm giảm giá phải từ 1% đến 100%') ||
        error.message.includes('Một hoặc nhiều gói không tồn tại')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo chương trình khuyến mãi',
    });
  }
};

// Update promotion
export const updatePromotion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ',
      });
      return;
    }

    // Validate applicable_packages if provided
    if (updateData.applicable_packages) {
      if (!Array.isArray(updateData.applicable_packages) || updateData.applicable_packages.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Danh sách gói áp dụng phải là mảng và không được rỗng',
        });
        return;
      }

      const invalidPackageIds = updateData.applicable_packages.filter((pkgId: string) => !Types.ObjectId.isValid(pkgId));
      if (invalidPackageIds.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Một hoặc nhiều ID gói không hợp lệ',
        });
        return;
      }
    }

    // Process dates if provided
    if (updateData.start_date) {
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
    }

    // Process discount if provided
    if (updateData.discount !== undefined) {
      updateData.discount = parseFloat(updateData.discount);
    }

    // Trim strings
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();

    const updatedPromotion = await promotionService.updatePromotion(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật chương trình khuyến mãi thành công',
      data: updatedPromotion,
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật chương trình khuyến mãi:', error);

    if (error.message === 'Không tìm thấy chương trình khuyến mãi') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes('Ngày kết thúc phải sau ngày bắt đầu') ||
        error.message.includes('Phần trăm giảm giá phải từ 1% đến 100%') ||
        error.message.includes('Một hoặc nhiều gói không tồn tại')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật chương trình khuyến mãi',
    });
  }
};

// Delete promotion
export const deletePromotion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ',
      });
      return;
    }

    await promotionService.deletePromotion(id);

    res.status(200).json({
      success: true,
      message: 'Xóa chương trình khuyến mãi thành công',
    });
  } catch (error: any) {
    console.error('Lỗi khi xóa chương trình khuyến mãi:', error);

    if (error.message === 'Không tìm thấy chương trình khuyến mãi') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === 'Không thể xóa chương trình khuyến mãi đang hoạt động') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa chương trình khuyến mãi',
    });
  }
};

// Get promotion effectiveness
export const getPromotionEffectiveness = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ',
      });
      return;
    }

    const effectiveness = await promotionService.getPromotionEffectiveness(id);

    res.status(200).json({
      success: true,
      message: 'Lấy báo cáo hiệu quả khuyến mãi thành công',
      data: effectiveness,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy báo cáo hiệu quả khuyến mãi:', error);

    if (error.message === 'Không tìm thấy chương trình khuyến mãi') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo hiệu quả khuyến mãi',
    });
  }
};

// Get active promotions for a specific package
export const getActivePromotionsForPackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageId } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(packageId)) {
      res.status(400).json({
        success: false,
        message: 'ID gói dịch vụ không hợp lệ',
      });
      return;
    }

    const activePromotions = await promotionService.getActivePromotionsForPackage(packageId);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách khuyến mãi đang hoạt động cho gói thành công',
      data: activePromotions,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khuyến mãi cho gói:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khuyến mãi cho gói',
    });
  }
};

// Get promotion statistics
export const getPromotionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await promotionService.getPromotionStats();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê chương trình khuyến mãi thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê chương trình khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê chương trình khuyến mãi',
    });
  }
};

// Update promotion statuses (utility endpoint for cron job or manual trigger)
export const updatePromotionStatuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await promotionService.updatePromotionStatuses();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái chương trình khuyến mãi thành công',
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái chương trình khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái chương trình khuyến mãi',
    });
  }
};

export default {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionEffectiveness,
  getActivePromotionsForPackage,
  getPromotionStats,
  updatePromotionStatuses,
};