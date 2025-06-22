// # Route cho Push Notifications
import { Router } from 'express';
import  PushNotificationController  from '~/controllers/pwa/pushNotificationController';
import { authenticateJWT } from '~/middlewares/auth';
import { validatePushSubscription } from '../../middlewares/validator';

const router = Router();

// Public routes
router.get('/vapid-public-key', PushNotificationController.getVapidPublicKey);

// Protected routes (require authentication)
router.use(authenticateJWT); // Apply auth middleware to all routes below

router.post('/subscribe', validatePushSubscription, PushNotificationController.subscribe);
router.post('/unsubscribe', PushNotificationController.unsubscribe);
router.post('/test', PushNotificationController.sendTestNotification);
router.get('/notifications', PushNotificationController.getUserNotifications);
router.put('/notifications/read', PushNotificationController.markAsRead);

export default router;