// # Cấu hình push notification
// src/config/push-notifications.ts
import dotenv from 'dotenv';
import webpush from 'web-push';

dotenv.config();

export interface PushVapidKeys {
  publicKey: string;
  privateKey: string;
}

export interface NotificationTemplate {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actions?: {
    action: string;
    title: string;
  }[];
}

export interface PushNotificationConfig {
  vapidKeys: PushVapidKeys;
  subject: string;
  defaultOptions: {
    TTL: number;
    urgency: 'very-low' | 'low' | 'normal' | 'high';
  };
  notificationTypes: Record<string, string>;
  templates: Record<string, NotificationTemplate>;
  schedulingConfig: {
    packageExpiryNotificationDays: number[];
    appointmentReminderHours: number[];
  };
}

// VAPID & Web Push setup
export const pushConfig: PushNotificationConfig = {
  vapidKeys: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
  subject: process.env.VAPID_SUBJECT || 'mailto:support@gymapp.com',
  defaultOptions: {
    TTL: 86400, // 24h
    urgency: 'normal',
  },

  notificationTypes: {
    PACKAGE_EXPIRY: 'package_expiry',
    NEW_PROMOTION: 'new_promotion',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    SCHEDULE_UPDATE: 'schedule_update',
    PAYMENT_CONFIRMATION: 'payment_confirmation',
  },

  templates: {
    package_expiry: {
      title: '🏋️ Gói tập sắp hết hạn',
      body: 'Gói tập {{packageName}} sẽ hết hạn vào ngày {{expiryDate}}. Gia hạn ngay để không gián đoạn luyện tập!',
      icon: '/icons/membership-icon.png',
      badge: '/icons/badge-icon.png',
      actions: [
        { action: 'renew-package', title: 'Gia hạn ngay' },
        { action: 'view-packages', title: 'Xem gói tập' },
      ],
    },
    appointment_reminder: {
      title: '📅 Nhắc nhở lịch hẹn',
      body: 'Bạn có lịch hẹn với PT {{trainerName}} lúc {{time}} ngày {{date}}.',
      icon: '/icons/appointment-icon.png',
      badge: '/icons/badge-icon.png',
      actions: [
        { action: 'view-appointment', title: 'Xem chi tiết' },
        { action: 'reschedule', title: 'Đổi lịch' },
      ],
    },
    new_promotion: {
      title: '🎉 Khuyến mãi đặc biệt',
      body: 'Giảm giá {{discount}}% cho tất cả gói tập! Áp dụng đến {{endDate}}.',
      icon: '/icons/promotion-icon.png',
      badge: '/icons/badge-icon.png',
      actions: [
        { action: 'view-promotions', title: 'Xem khuyến mãi' },
      ],
    },
    workout_reminder: {
      title: '💪 Đến giờ tập rồi!',
      body: 'Lịch tập {{workoutType}} của bạn sắp bắt đầu. Đã sẵn sàng chưa?',
      icon: '/icons/workout-icon.png',
      badge: '/icons/badge-icon.png',
    },
    payment_success: {
      title: '✅ Thanh toán thành công',
      body: 'Bạn đã thanh toán thành công {{amount}}đ cho {{packageName}}',
      icon: '/icons/payment-icon.png',
      badge: '/icons/badge-icon.png',
    },
     system: {
      title: '🔔 Thông báo hệ thống',
      body: '{{message}}',
      icon: '/icons/system-icon.png',
      badge: '/icons/badge-icon.png',
    }
  },

  schedulingConfig: {
    packageExpiryNotificationDays: [7, 3, 1],
    appointmentReminderHours: [24, 1],
  },
};

// Hàm khởi tạo Web Push Service
export const initializePushService = (): boolean => {
  if (!pushConfig.vapidKeys.publicKey || !pushConfig.vapidKeys.privateKey) {
    console.error('❌ Missing VAPID keys for push notification setup');
    return false;
  }

  webpush.setVapidDetails(
    pushConfig.subject,
    pushConfig.vapidKeys.publicKey,
    pushConfig.vapidKeys.privateKey
  );



  console.log('✅ Push notification service initialized');
  return true;
};


