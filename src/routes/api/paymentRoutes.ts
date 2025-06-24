import express from 'express';
import { authenticateJWT } from '../../middlewares/auth';
import { 
  createMoMoPayment, 
  momoIpnCallback, 
  momoRedirectCallback, 
  getPaymentById,
  getPaymentStatus 
} from '../../controllers/user/paymentController';

const router = express.Router();

// Routes không cần authentication (cho MoMo callback)
// Route callback từ MoMo (IPN) - không cần auth vì từ MoMo server
router.post('/momo/ipn', momoIpnCallback);
// Route redirect từ MoMo sau khi thanh toán - không cần auth
router.get('/momo/callback', momoRedirectCallback);

// Routes cần authentication
router.use(authenticateJWT);

// Payment routes
// Route tạo thanh toán MoMo
router.post('/momo/create', createMoMoPayment);
// Route kiểm tra trạng thái thanh toán
router.get('/status/:paymentId', getPaymentStatus);
// Route lấy thông tin thanh toán
router.get('/:paymentId', getPaymentById);

export default router;