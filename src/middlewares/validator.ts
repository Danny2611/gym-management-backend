// src/middlewares/validator.ts

import { Request, Response, NextFunction, RequestHandler  } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    next();
  };
};
// Helper function để xử lý validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validator cho Push Subscription
export const validatePushSubscription =  [
  body('subscription')
    .notEmpty()
    .withMessage('Subscription is required')
    .isObject()
    .withMessage('Subscription must be an object'),
    
  body('subscription.endpoint')
    .notEmpty()
    .withMessage('Endpoint is required')
    .isURL()
    .withMessage('Endpoint must be a valid URL'),
    
  body('subscription.keys')
    .notEmpty()
    .withMessage('Keys are required')
    .isObject()
    .withMessage('Keys must be an object'),
    
  body('subscription.keys.p256dh')
    .notEmpty()
    .withMessage('p256dh key is required')
    .isString()
    .withMessage('p256dh must be a string')
    .isLength({ min: 1 })
    .withMessage('p256dh cannot be empty'),
    
  body('subscription.keys.auth')
    .notEmpty()
    .withMessage('auth key is required')
    .isString()
    .withMessage('auth must be a string')
    .isLength({ min: 1 })
    .withMessage('auth cannot be empty'),
    
  body('platform')
    .optional()
    .isString()
    .withMessage('Platform must be a string'),
    
  // handleValidationErrors
];

// Validator cho Test Notification
export const validateTestNotification = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
    
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
    .isLength({ max: 300 })
    .withMessage('Message cannot exceed 300 characters'),
    
  body('type')
    .optional()
    .isIn(['reminder', 'promotion', 'appointment', 'membership', 'system'])
    .withMessage('Invalid notification type'),
    
  handleValidationErrors
];

// Validator cho Unsubscribe
export const validateUnsubscribe = [
  body('endpoint')
    .notEmpty()
    .withMessage('Endpoint is required')
    .isURL()
    .withMessage('Endpoint must be a valid URL'),
    
  handleValidationErrors
];

// Validator cho Mark as Read
export const validateMarkAsRead = [
  body('notificationIds')
    .isArray({ min: 1 })
    .withMessage('NotificationIds must be a non-empty array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
    })
    .withMessage('All notification IDs must be valid MongoDB ObjectIds'),
    
  handleValidationErrors
];

// Validator cho Send Notification (Admin)
export const validateSendNotification = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
    
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 300 })
    .withMessage('Message must be between 1 and 300 characters'),
    
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['reminder', 'promotion', 'appointment', 'membership', 'system'])
    .withMessage('Invalid notification type'),
    
  body('memberIds')
    .optional()
    .isArray()
    .withMessage('MemberIds must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return true; // Optional field
      return value.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
    })
    .withMessage('All member IDs must be valid MongoDB ObjectIds'),
    
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('ScheduledAt must be a valid ISO 8601 date')
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const now = new Date();
      return date > now;
    })
    .withMessage('ScheduledAt must be in the future'),
    
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
    
  handleValidationErrors
];

// Validator cho Bulk Notification (Admin)
export const validateBulkNotification = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
    
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 300 })
    .withMessage('Message must be between 1 and 300 characters'),
    
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['reminder', 'promotion', 'appointment', 'membership', 'system'])
    .withMessage('Invalid notification type'),
    
  body('memberIds')
    .isArray({ min: 1 })
    .withMessage('MemberIds must be a non-empty array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
    })
    .withMessage('All member IDs must be valid MongoDB ObjectIds'),
    
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
    
  handleValidationErrors
];

// Validator cho query parameters (Get Notifications)
export const validateGetNotifications = [
  // Validate query parameters
  (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, type, status } = req.query;
    
    // Validate page
    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive number'
      });
    }
    
    // Validate limit
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }
    
    // Validate type
    if (type && !['reminder', 'promotion', 'appointment', 'membership', 'system'].includes(type as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }
    
    // Validate status
    if (status && !['pending', 'sent', 'delivered', 'failed', 'read'].includes(status as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification status'
      });
    }
    
    next();
  }
];

// Validator cho Schedule Notification
export const validateScheduleNotification = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
    
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 300 })
    .withMessage('Message must be between 1 and 300 characters'),
    
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['reminder', 'promotion', 'appointment', 'membership', 'system'])
    .withMessage('Invalid notification type'),
    
  body('scheduledAt')
    .notEmpty()
    .withMessage('ScheduledAt is required')
    .isISO8601()
    .withMessage('ScheduledAt must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      return date > now;
    })
    .withMessage('ScheduledAt must be in the future'),
    
  body('memberIds')
    .optional()
    .isArray()
    .withMessage('MemberIds must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
    })
    .withMessage('All member IDs must be valid MongoDB ObjectIds'),
    
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
    
  handleValidationErrors
];

// Custom validator để kiểm tra notification ownership
export const validateNotificationOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notificationIds } = req.body;
    const memberId = req.userId;
    
    if (!memberId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Import model ở đây để tránh circular dependency
    const NotificationModule = await import('../models/Notification');
    const Notification = NotificationModule.default;
    
    // Kiểm tra xem tất cả notifications có thuộc về user này không
    const notifications = await Notification.find({
      _id: { $in: notificationIds },
      member_id: memberId
    });
    
    if (notifications.length !== notificationIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Some notifications do not belong to you'
      });
    }
    
    next();
  } catch (error  ) {
    return res.status(500).json({
      success: false,
      message: 'Error validating notification ownership',
      // error: error?.
    });
  }
};

// Rate limiting validator cho push notifications
export const validatePushRateLimit = (req: Request, res: Response, next: NextFunction) => {
   const memberId = req.userId;
  
  if (!memberId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Implement simple rate limiting logic
  // Có thể mở rộng với Redis hoặc memory cache
  const now = Date.now();
  const rateLimit = req.app.locals.pushRateLimit || {};
  
  if (!rateLimit[memberId]) {
    rateLimit[memberId] = { count: 1, resetTime: now + 60000 }; // 1 minute
  } else {
    if (now > rateLimit[memberId].resetTime) {
      rateLimit[memberId] = { count: 1, resetTime: now + 60000 };
    } else {
      rateLimit[memberId].count++;
      if (rateLimit[memberId].count > 10) { // Max 10 requests per minute
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Try again later.'
        });
      }
    }
  }
  
  req.app.locals.pushRateLimit = rateLimit;
  next();
};

// Export all validators
export const pushValidators = {
  validatePushSubscription,
  validateTestNotification,
  validateUnsubscribe,
  validateMarkAsRead,
  validateSendNotification,
  validateBulkNotification,
  validateGetNotifications,
  validateScheduleNotification,
  validateNotificationOwnership,
  validatePushRateLimit
};