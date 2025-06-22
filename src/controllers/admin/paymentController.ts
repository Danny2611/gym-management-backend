// # Quản lý thanh toán
// controller/admin/paymentController.ts
import { Request, Response } from 'express';
import paymentService from '~/services/admin/paymentService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Get all payments with pagination, filtering and sorting
export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      paymentMethod,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      status: status as 'pending' | 'completed' | 'failed' | 'cancelled' | undefined,
      paymentMethod: paymentMethod as 'qr' | 'credit' | 'napas' | 'undefined' | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const paymentsData = await paymentService.getAllPayments(options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thanh toán thành công',
      data: paymentsData,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thanh toán',
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID thanh toán không hợp lệ',
      });
      return;
    }

    const payment = await paymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin thanh toán theo ID thành công',
      data: payment,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin thanh toán:', error);
    res.status(error.message === 'Không tìm thấy thanh toán' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin thanh toán',
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID thanh toán không hợp lệ',
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán là bắt buộc',
      });
      return;
    }

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ',
      });
      return;
    }

    const updatedPayment = await paymentService.updatePaymentStatus(id, status, transactionId);

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: updatedPayment,
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
    res.status(error.message === 'Không tìm thấy thanh toán' ? 404 : 500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật trạng thái thanh toán',
    });
  }
};

// Get payments by member ID
export const getPaymentsByMemberId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const {
      page = '1',
      limit = '10',
      status,
      paymentMethod,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    } = req.query;

    if (!Types.ObjectId.isValid(memberId)) {
      res.status(400).json({
        success: false,
        message: 'ID thành viên không hợp lệ',
      });
      return;
    }

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      status: status as 'pending' | 'completed' | 'failed' | 'cancelled' | undefined,
      paymentMethod: paymentMethod as 'qr' | 'credit' | 'napas' | 'undefined' | undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const paymentsData = await paymentService.getPaymentsByMemberId(memberId, options);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thanh toán của thành viên thành công',
      data: paymentsData,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách thanh toán của thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thanh toán của thành viên',
    });
  }
};

// Get payment statistics
export const getPaymentStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statistics = await paymentService.getPaymentStatistics();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê thanh toán thành công',
      data: statistics,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thanh toán',
    });
  }
};

export default {
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentsByMemberId,
  getPaymentStatistics,
};