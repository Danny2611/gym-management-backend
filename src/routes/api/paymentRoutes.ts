import express from 'express';
import { authenticateJWT } from '../../middlewares/auth';
import { createMoMoPayment, momoIpnCallback, momoRedirectCallback, getPaymentById } from '../../controllers/user/paymentController';
const router = express.Router();

// All these routes require authentication
router.use(authenticateJWT);


// Payment routes
// Route tạo thanh toán MoMo
router.post('/momo/create',createMoMoPayment);
// Route callback từ MoMo (IPN)
router.post('/momo/ipn', momoIpnCallback);
// Route redirect từ MoMo sau khi thanh toán
router.get('/momo/callback', momoRedirectCallback);
// Route lấy thông tin thanh toán
router.get('/:paymentId',getPaymentById);

export default router;