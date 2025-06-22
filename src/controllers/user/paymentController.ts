//src/user/paymentController

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { HydratedDocument } from 'mongoose';
import mongoose, { Document, Schema, Types } from 'mongoose';
import MoMoPaymentService from '~/services/momoPaymentService';
import Package from '~/models/Package';
import Payment from '~/models/Payment';
import Membership, { IMembership } from '~/models/Membership';
import Member from '~/models/Member';
import Promotion from '~/models/Promotion';
import { validatePaymentRequest } from '~/utils/validators/paymentValidator';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

    interface AppliedPromotion {
      promotion_id: mongoose.Types.ObjectId;
      name: string;
      discount: number;
      original_price: number;
      discounted_price: number;
    }

/**
 * Khởi tạo thanh toán MoMo cho gói tập
 */
export const createMoMoPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    // Kiểm tra và xác thực dữ liệu đầu vào
    const errors =  await validatePaymentRequest(req);
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
        message: 'Bạn cần đăng nhập để thực hiện thanh toán'
      });
      return;
    }

    // Lấy thông tin gói tập
    const packageInfo = await Package.findById(packageId);
    if (!packageInfo) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói tập'
      });
      return;
    }

    // Kiểm tra trạng thái gói tập
    if (packageInfo.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'Gói tập này hiện không khả dụng'
      });
      return;
    }

    await Membership.deleteMany({
      member_id: memberId,
      package_id: packageId,
      status: { $in: ['pending','expired'] }
    });

    // Kiểm tra khuyến mãi đang áp dụng cho gói tập
    const now = new Date();
    const promotion = await Promotion.findOne({
      applicable_packages: new mongoose.Types.ObjectId(packageId),
      status: 'active',
      start_date: { $lte: now },
      end_date: { $gte: now }
    });

    let finalPrice = packageInfo.price;
    let appliedPromotion: AppliedPromotion | null = null;
    
    if (promotion) {
      const discountAmount = (packageInfo.price * promotion.discount) / 100;
      finalPrice = Math.round(packageInfo.price - discountAmount);
      appliedPromotion = {
        promotion_id: promotion._id as mongoose.Types.ObjectId,
        name: promotion.name,
        discount: promotion.discount,
        original_price: packageInfo.price,
        discounted_price: finalPrice
      };
    }

    // Tạo thông tin thanh toán
    const paymentData = {
      packageId,
      memberId,
      amount: finalPrice,
      orderInfo: `Thanh toán gói ${packageInfo.name} - FittLife`
    };

    // Tạo yêu cầu thanh toán MoMo
    const momoResponse = await MoMoPaymentService.createPaymentRequest(paymentData);

    if (momoResponse.resultCode !== 0) {
      res.status(400).json({
        success: false,
        message: 'Không thể tạo yêu cầu thanh toán',
        data: momoResponse
      });
      return;
    }

    // Lưu thông tin thanh toán vào database
    const payment = new Payment({
      member_id: memberId,
      package_id: packageId,
      amount: finalPrice,
      original_amount: packageInfo.price,
      status: 'pending',
      paymentMethod: 'undefined',
      transactionId: momoResponse.orderId,
      promotion: appliedPromotion,
      paymentInfo: {
        requestId: momoResponse.requestId,
        payUrl: momoResponse.payUrl,
        orderId: momoResponse.orderId
      }
    });
    await payment.save();

    const membership = new Membership({
      member_id: memberId,
      package_id: packageId,
      payment_id: payment._id,
      start_date: null,
      end_date: null,
      auto_renew: false,
      status: 'pending', // Đặt trạng thái là pending
      available_sessions: packageInfo.training_sessions || 0, // Lấy số buổi tập từ package nếu có
      used_sessions: 0,  // Chưa sử dụng buổi tập nào
      last_sessions_reset: new Date(),  // Lưu ngày reset cuối cùng
      created_at: new Date(),
      updated_at: new Date(), 
    });

    await membership.save();

    // Trả về URL thanh toán cho frontend
    res.status(200).json({
      success: true,
      message: 'Đã tạo yêu cầu thanh toán',
      data: {
        paymentId: payment._id,
        payUrl: momoResponse.payUrl,
        amount: momoResponse.amount,
        originalAmount: packageInfo.price,
        discount: promotion ? promotion.discount : 0,
        promotionApplied: promotion ? true : false,
        transactionId: momoResponse.orderId,
        expireTime: Date.now() + 10 * 60 * 1000 // 10 phút
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý thanh toán'
    });
  }
});

/**
 * Xử lý redirect từ MoMo về trang xác nhận
 */
export const momoRedirectCallback = asyncHandler(async (req: Request, res: Response) => {
  // console.log('🔄 MoMo Redirect Callback Received:', req.query); // 👀 Log dữ liệu nhận từ MoMo
  try {
    const { orderId } = req.query;
    // Chuyển resultCode thành số và so sánh
    const resultCode = req.query.resultCode === '0' ? 0 : Number(req.query.resultCode);
    
    // Redirect về trang thành công hoặc thất bại tùy thuộc vào kết quả
    if (resultCode === 0) {
      // Lấy thông tin payment
      const payment = await Payment.findOne({ transactionId: orderId }).populate('package_id');
      
      // Redirect về trang xác nhận đăng ký thành công
      return res.redirect(`${process.env.FRONTEND_URL}/user/payment/success?orderId=${orderId}&paymentId=${payment?._id}&resultCode=${resultCode}`);
    } else {
      // Redirect về trang thông báo thất bại
      return res.redirect(`${process.env.FRONTEND_URL}/user/payment/failed?orderId=${orderId}&resultCode=${resultCode}`);
    }
  } catch (error) {
    console.error('Error handling MoMo redirect:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/user/payment/failed?error=server_error`);
  }
});

/**
 * Xử lý callback từ MoMo (IPN - Instant Payment Notification)
 */
export const momoIpnCallback = asyncHandler(async (req: Request, res: Response) => {
  try {
    const callbackData = req.body;
    
    // Xác thực callback từ MoMo
    const isValid = MoMoPaymentService.verifyCallback(callbackData);
    if (!isValid) {
      console.error('Invalid MoMo signature');
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
      return;
    }

    // Kiểm tra mã kết quả từ MoMo
    if (callbackData.resultCode !== 0) {
      // console.log('MoMo IPN Callback Failed:', callbackData);
      // Cập nhật trạng thái thanh toán trong DB
      await Payment.findOneAndUpdate(
        { transactionId: callbackData.orderId },
        { 
          status: 'failed',
          paymentInfo: { ...callbackData }
        }
      );

      res.status(200).json({
        success: false,
        message: 'Payment failed',
        resultCode: callbackData.resultCode
      });
      return;
    }

    // Kiểm tra extraData có tồn tại không
    if (!callbackData.extraData) {
      console.error('Missing extraData in callback');
      res.status(400).json({
        success: false,
        message: 'Missing extraData'
      });
      return;
    }

    // Giải mã extraData
    const extraData = MoMoPaymentService.decodeExtraData(callbackData.extraData);
    // console.log('Decoded Extra Data:', extraData);

    // Kiểm tra các trường bắt buộc của extraData
    if (!extraData.packageId || !extraData.memberId) {
      console.error('Missing required fields in extraData');
      res.status(400).json({
        success: false,
        message: 'Invalid extraData format'
      });
      return;
    }

    // Tìm và cập nhật thanh toán
    const payment = await Payment.findOneAndUpdate(
      { transactionId: callbackData.orderId },
      { 
        status: 'completed',
        paymentMethod: callbackData.payType,
        paymentInfo: { ...callbackData }
      },
      { new: true }
    );

    if (!payment) {
      console.error('Payment not found:', callbackData.orderId);
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    // Tìm thông tin gói tập
    const packageInfo = await Package.findById(extraData.packageId);
    if (!packageInfo) {
      console.error('Package not found:', extraData.packageId);
      res.status(404).json({
        success: false,
        message: 'Package not found'
      });
      return;
    }
    console.log('Found package:', packageInfo);

    // Tìm thông tin thành viên
    const memberInfo = await Member.findById(extraData.memberId);
    if (!memberInfo) {
      console.error('Member not found:', extraData.memberId);
      res.status(404).json({
        success: false,
        message: 'Member not found'
      });
      return;
    }
    
    // Tính thời gian kết thúc dựa vào thời hạn gói tập (tháng)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageInfo.duration);
    
    // Kiểm tra nếu đã có membership hiện tại
    const existingMembership = await Membership.findOne({
      member_id: extraData.memberId,
      package_id: extraData.packageId,
      status: 'pending'
    });

    let membership;
    
    if (existingMembership) {
      // Cập nhật membership hiện tại
      membership = await Membership.findByIdAndUpdate(
        existingMembership._id,
        {
          payment_id: payment._id,
          start_date : startDate,
          end_date: endDate,
          status: 'active'
        },
        { new: true }
      );
      console.log('Updated existing membership:', membership._id);
    } else {
      // Tạo membership mới
      membership = new Membership({
        member_id: extraData.memberId,
        package_id: extraData.packageId,
        payment_id: payment._id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        available_sessions: packageInfo.training_sessions || 0, // Lấy số buổi tập từ package nếu có
        used_sessions: 0,  // Chưa sử dụng buổi tập nào
        last_sessions_reset: new Date(),  // Lưu ngày reset cuối cùng
        created_at: new Date(),
      });
      await membership.save();
      console.log('Created new membership:', membership._id);
    }

    // Trả về kết quả thành công cho MoMo
    res.status(200).json({
      success: true,
      message: 'Successfully processed payment',
      data: {
        orderId: callbackData.orderId,
        transId: callbackData.transId,
        membershipId: membership._id
      }
    });
  } catch (error) {
    console.error('Error processing MoMo IPN:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    
    });
  }
});



// /**
//  * Kiểm tra trạng thái thanh toán (cho frontend polling)
//  */
export const getPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const memberId = req.userId;

    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem trạng thái thanh toán'
      });
      return;
    }

    // Tìm thông tin thanh toán
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
      return;
    }

    // Kiểm tra quyền xem thông tin
    if (payment.member_id.toString() !== memberId && req.userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin thanh toán này'
      });
      return;
    }

    // Kiểm tra membership nếu thanh toán đã hoàn thành
    let membershipInfo: HydratedDocument<IMembership> | null = null;
    if (payment.status === 'completed') {
      membershipInfo = await Membership.findOne({ 
        payment_id: paymentId,
        member_id: memberId
      }).populate('package_id');
    }

    res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        transactionId: payment.transactionId,
        created_at: payment.created_at,
        membership: membershipInfo
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu'
    });
  }
});
/**
 * Lấy thông tin thanh toán theo ID
 */
export const getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const memberId = req.userId;

    if (!memberId) {
      res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem thông tin thanh toán'
      });
      return;
    }

    // Tìm thông tin thanh toán
    const payment = await Payment.findById(paymentId)
      .populate('package_id')
      .populate('member_id', '-password');

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
      return;
    }

    // Kiểm tra quyền xem thông tin
    if (payment.member_id._id.toString() !== memberId && req.userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin thanh toán này'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu'
    });
  }
});


export default {
  createMoMoPayment, 
  momoIpnCallback, 
  momoRedirectCallback, 
  getPaymentById, 
  getPaymentStatus 
}