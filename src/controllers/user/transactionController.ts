// controller/user/transactionController.ts
import { Request, Response } from 'express';
import transactionService from '~/services/transactionService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all transactions for the logged-in member with filters
export const getAllMemberTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch sử giao dịch'
      });
      return;
    }
    
    // Parse query parameters for filtering
    const filters: any = {};
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      filters.status = req.query.status as string;
    }
    
    // Payment method filter
    if (req.query.paymentMethod && req.query.paymentMethod !== 'all') {
      filters.paymentMethod = req.query.paymentMethod as string;
    }
    
    // Date range filters
    if (req.query.startDate) {
      filters.startDate = req.query.startDate as string;
    }
    
    if (req.query.endDate) {
      filters.endDate = req.query.endDate as string;
    }
    
    // Fetch all transactions
    const transactionsData = await transactionService.getAllMemberTransactions(memberId, filters);
    
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách giao dịch thành công',
      data: transactionsData
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách giao dịch'
    });
  }
};

// Get details of a specific transaction
export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
    const { transactionId } = req.body; // Using req.body as specified
    
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem chi tiết giao dịch'
      });
      return;
    }
    
    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin giao dịch cần xem'
      });
      return;
    }
    
    // Call service to get transaction details
    const transaction = await transactionService.getTransactionById(transactionId);
    
    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết giao dịch thành công',
      data: transaction
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết giao dịch:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết giao dịch'
    });
  }
};
// Get details of a specific transaction
export const getRecentSuccessfulTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = req.userId;
 
    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem các giao dịch gần đây'
      });
      return;
    }
  
    
    // Call service to get transaction details
    const transaction = await transactionService.getRecentSuccessfulTransactions(memberId);
    
    res.status(200).json({
      success: true,
      message: 'Lấy các giao dịch gần đây',
      data: transaction
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy các giao dịch gần đây:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy các giao dịch gần đây'
    });
  }
};
// Export the controller functions
export default {
  getAllMemberTransactions,
  getTransactionById,
  getRecentSuccessfulTransactions,
  
};