import { Router } from 'express';
import pushRoutes from './pushRoutes';
// import syncRoutes from './pwa/syncRoutes'; // nếu có
// import offlineRoutes from './pwa/offlineRoutes'; // nếu có

const router = Router();

// Gộp các route con
router.use('/push-notifications', pushRoutes);
// router.use('/', syncRoutes);
// router.use('/', offlineRoutes);

export default router;
