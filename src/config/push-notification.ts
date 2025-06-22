//src/config/push-notifications.ts
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
  image?: string;
  requireInteraction?: boolean;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

export interface PushNotificationConfig {
  vapidKeys: PushVapidKeys;
  subject: string;
  defaultOptions: {
    TTL: number;
    urgency: 'very-low' | 'low' | 'normal' | 'high';
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
  templates: Record<string, NotificationTemplate>;
  schedulingConfig: {
    packageExpiryNotificationDays: number[];
    appointmentReminderHours: number[];
  };
}

export const pushConfig: PushNotificationConfig = {
  vapidKeys: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
  subject: process.env.VAPID_SUBJECT || 'mailto:support@gymapp.com',
  defaultOptions: {
    TTL: 86400, // 24 hours
    urgency: 'normal',
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
  },

  templates: {
    membership_expiry: {
      title: '🎫 Gói tập sắp hết hạn',
      body: 'Gói {{packageName}} sẽ hết hạn vào {{expiryDate}}. Gia hạn ngay!',
      icon: '/icons/membership-icon.png',
      badge: '/icons/badge-icon.png',
      requireInteraction: true,
      actions: [
        { action: 'renew', title: 'Gia hạn ngay', icon: '/icons/renew.png' },
        { action: 'view', title: 'Xem chi tiết', icon: '/icons/view.png' },
      ],
    },
    appointment_reminder: {
      title: '📅 Nhắc nhở lịch hẹn',
      body: 'Lịch hẹn với PT {{trainerName}} lúc {{time}} ngày {{date}} tại {{location}}',
      icon: '/icons/appointment-icon.png',
      badge: '/icons/badge-icon.png',
      requireInteraction: true,
      actions: [
        { action: 'confirm', title: 'Xác nhận', icon: '/icons/confirm.png' },
        { action: 'reschedule', title: 'Đổi lịch', icon: '/icons/reschedule.png' },
      ],
    },
    promotion: {
      title: '🎉 Khuyến mãi đặc biệt',
      body: 'Giảm {{discount}}% cho gói tập! Có hiệu lực đến {{endDate}}',
      icon: '/icons/promotion-icon.png',
      badge: '/icons/badge-icon.png',
      image: '/images/promotion-banner.jpg',
      actions: [
        { action: 'view_promo', title: 'Xem ngay', icon: '/icons/view.png' },
      ],
    },
    workout_reminder: {
      title: '💪 Đến giờ tập rồi!',
      body: 'Lịch tập {{workoutType}} sắp bắt đầu vào lúc {{time}}. Tại {{location}}. Sẵn sàng chưa?',
      icon: '/icons/workout-icon.png',
      badge: '/icons/badge-icon.png',
      actions: [
        { action: 'check_in', title: 'Check-in', icon: '/icons/checkin.png' },
      ],
    },
    
    system: {
      title: '🔔 Thông báo hệ thống',
      body: '{{message}}',
      icon: '/icons/system-icon.png',
      badge: '/icons/badge-icon.png',
    }
  },

  schedulingConfig: {
    packageExpiryNotificationDays: [7, 3, 1], // 7, 3, 1 days before expiry
    appointmentReminderHours: [24, 2], // 24 and 2 hours before appointment
  },
};

// Initialize Push Service with better error handling
export const initializePushService = (): boolean => {
  try {
    if (!pushConfig.vapidKeys.publicKey || !pushConfig.vapidKeys.privateKey) {
      console.error('❌ Missing VAPID keys for push notification setup');
      return false;
    }

    webpush.setVapidDetails(
      pushConfig.subject,
      pushConfig.vapidKeys.publicKey,
      pushConfig.vapidKeys.privateKey
    );

    console.log('✅ Push notification service initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize push service:', error);
    return false;
  }
};

// Template renderer helper
export const renderTemplate = (template: NotificationTemplate, data: Record<string, any>) => {
  let renderedTitle = template.title;
  let renderedBody = template.body;

  // Simple template rendering
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    renderedTitle = renderedTitle.replace(regex, data[key]);
    renderedBody = renderedBody.replace(regex, data[key]);
  });

  return {
    ...template,
    title: renderedTitle,
    body: renderedBody
  };
};