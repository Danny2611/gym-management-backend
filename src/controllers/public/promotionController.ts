// src/controller/public/promotionController.ts
import { Request, Response } from 'express';
import promotionService from '../../services/promotionService';

export const getAllActivePromotions= async(req: Request, res: Response): Promise<void> =>{
    try{
        const promotions = await  promotionService.getAllActivePromotions();
        res.status(200).json({
        success: true,
        message: 'Lấy danh sách khuyến mãi thành công',
        data: promotions
       });
    }catch (error: any) {
    console.error('Lỗi khi lấy danh sách khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách khuyến mãi'
    });
  }
}

export default {
  getAllActivePromotions
}
