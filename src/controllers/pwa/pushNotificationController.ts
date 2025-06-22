// # Quản lý Push Notifications
//controller/pwa/pushNotificationController
import { Request, Response } from 'express';
import pushNotificationService from '../../services/pwa/pushNotificationService';
import { pushConfig } from '../../config/push-notification';
import  Notification  from '../../models/Notification';

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}


// Đăng ký subscription
const subscribe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
       res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { subscription } = req.body;
    const memberId = req.userId;
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.body.platform || 'unknown'
    };

    const savedSub = await pushNotificationService.saveSubscription(
      memberId as string,
      subscription,
      deviceInfo
    );

    res.json({
      success: true,
      message: 'Subscription saved successfully',
      data: savedSub
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: 'Error saving subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
// Lấy VAPID public key cho client
const getVapidPublicKey = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      publicKey: pushConfig.vapidKeys.publicKey
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: 'Error getting VAPID key',
      error: error.message
    });
  }
};


// Gửi test notification
const sendTestNotification = async (req: AuthRequest, res: Response) => {
  try {
    const memberId =req.userId;
    const { title, message, type = 'system' } = req.body;

    const notification = await pushNotificationService.sendToUser(memberId as string, {
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      type,
      data: { isTest: true }
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      data: notification
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
};

// Hủy subscription
const unsubscribe = async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint } = req.body;
    const memberId = req.userId;

    await pushNotificationService.removeSubscription(memberId as string, endpoint);

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: 'Error unsubscribing',
      error: error.message
    });
  }
};

// Lấy danh sách notifications của user
const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ member_id: memberId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('trainer_id', 'name');

    const total = await Notification.countDocuments({ member_id: memberId });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: 'Error getting notifications',
      error: error.message
    });
  }
};

// Đánh dấu notification đã đọc
const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationIds } = req.body;
    const memberId = req.userId;

    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        member_id: memberId
      },
      {
        status: 'read',
        read_at: new Date(),
        updated_at: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error : any) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

export default {
  getVapidPublicKey,
  subscribe,
  sendTestNotification,
  unsubscribe,
  getUserNotifications,
  markAsRead
};
