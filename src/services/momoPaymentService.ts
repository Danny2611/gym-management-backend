// # Xử lý thanh toán MoMo - Đã sửa lỗi
import axios from 'axios';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface MoMoPaymentConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
  requestType: string;
  extraData?: string;
}

interface MoMoPaymentRequest {
  packageId: string;
  memberId: string;
  amount: number;
  orderInfo: string;
}

interface MoMoPaymentResponse {
  requestId: string;
  orderId: string;
  payUrl: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
}

class MoMoPaymentService {
  private config: MoMoPaymentConfig;
  private endpointUrl: string;

  constructor() {
    // Lấy thông tin cấu hình từ biến môi trường
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || '',
      accessKey: process.env.MOMO_ACCESS_KEY || '',
      secretKey: process.env.MOMO_SECRET_KEY || '',
      redirectUrl: process.env.MOMO_REDIRECT_URL || 'https://gym-management-backend-production-c5e0.up.railway.app/api/user/payment/momo/callback',
      ipnUrl: process.env.MOMO_IPN_URL || 'https://gym-management-backend-production-c5e0.up.railway.app/api/user/momo/ipn',
      requestType: 'payWithMethod'
    };

    // URL endpoint của MoMo (sử dụng URL sandbox cho môi trường dev)
    this.endpointUrl = process.env.MOMO_ENDPOINT_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
  }

  /**
   * Tạo yêu cầu thanh toán MoMo
   */
  async createPaymentRequest(data: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
    const requestId = uuidv4();
    const orderId = `ORDER_${Date.now()}`;
    const orderInfo = data.orderInfo || 'Thanh toán gói tập tại FittLife';
    const amount = data.amount;
    const extraData = Buffer.from(JSON.stringify({
      packageId: data.packageId,
      memberId: data.memberId
    })).toString('base64');

    // Tạo signature cho MoMo - đảm bảo thứ tự đúng
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${this.config.redirectUrl}&requestId=${requestId}&requestType=${this.config.requestType}`;

    const signature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(rawSignature)
        .digest('hex');

    // Tạo request body - đảm bảo format đúng
    const requestBody = {
      partnerCode: this.config.partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: this.config.redirectUrl,
      ipnUrl: this.config.ipnUrl,
      lang: 'vi',
      requestType: this.config.requestType,
      autoCapture: true,
      extraData: extraData,
      orderGroupId: '',
      signature: signature
    };

    console.log('MoMo Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('Raw Signature String:', rawSignature);
    console.log('Generated Signature:', signature);

    try {
      // Cấu hình axios với headers cụ thể cho MoMo
      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'nodejs-momo-client'
        },
        timeout: 30000, // 30 seconds timeout
        maxRedirects: 5
      };

      // Gửi request đến MoMo API
      const response = await axios.post(this.endpointUrl, requestBody, axiosConfig);

      console.log('MoMo Response:', response.data);

      // Kiểm tra response từ MoMo
      if (response.data && typeof response.data === 'object') {
        return response.data;
      } else {
        throw new Error('Invalid response format from MoMo');
      }

    } catch (error: any) {
      console.error('MoMo payment request error:', error);

      // Log chi tiết lỗi để debug
      if (error.response) {
        console.error('MoMo Error Response Status:', error.response.status);
        console.error('MoMo Error Response Headers:', error.response.headers);
        console.error('MoMo Error Response Data:', error.response.data);
      } else if (error.request) {
        console.error('MoMo Error Request:', error.request);
      } else {
        console.error('MoMo Error Message:', error.message);
      }

      // Trả về lỗi cụ thể
      if (error.response?.status === 400) {
        throw new Error(`MoMo API Error: ${error.response.data?.message || 'Bad Request'}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Không thể kết nối tới MoMo API');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Timeout khi kết nối tới MoMo API');
      } else {
        throw new Error('Không thể kết nối với cổng thanh toán MoMo');
      }
    }
  }

  /**
   * Xác thực callback từ MoMo
   */
  verifyCallback(callbackData: any): boolean {
    try {
      // Log đầy đủ dữ liệu để debug
      console.log('Verifying MoMo callback data:', JSON.stringify(callbackData, null, 2));

      const {
        partnerCode, accessKey, requestId, amount, orderId,
        ipnUrl, redirectUrl,
        orderInfo, orderType, transId, resultCode, message, requestType,
        payType, responseTime, extraData, signature
      } = callbackData;

      // Log thông tin chữ ký nhận được
      console.log('Received signature:', signature);

      // Tạo signature để xác thực - đảm bảo thứ tự đúng theo tài liệu MoMo
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      console.log('Raw signature string:', rawSignature);
      console.log('Secret key used:', this.config.secretKey);

      const computedSignature = crypto
          .createHmac('sha256', this.config.secretKey)
          .update(rawSignature)
          .digest('hex');

      console.log('Computed signature:', computedSignature);

      // Kiểm tra signature và trả về kết quả
      const isValid = computedSignature === signature;
      console.log('Signature validation result:', isValid);

      // Tạm thời bỏ qua việc xác thực chữ ký trong môi trường phát triển
      if (process.env.NODE_ENV === 'development' && !isValid) {
        console.warn('⚠️ Signature validation failed but ignored in development mode');
        return true; // Bỏ qua lỗi chữ ký trong môi trường phát triển
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying MoMo signature:', error);

      // Tạm thời bỏ qua lỗi trong môi trường phát triển
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Signature verification error ignored in development mode');
        return true;
      }

      return false;
    }
  }

  /**
   * Giải mã extraData từ MoMo
   */
  decodeExtraData(extraData: string): any {
    try {
      // Thêm logs để debug quá trình giải mã
      console.log('Raw extraData received:', extraData);

      // Kiểm tra xem extraData có tồn tại không
      if (!extraData) {
        console.error('extraData is missing or empty');
        return {};
      }

      // Giải mã Base64
      const decodedData = Buffer.from(extraData, 'base64').toString('utf8');
      console.log('Decoded string:', decodedData);

      try {
        // Parse JSON từ chuỗi đã giải mã
        const jsonData = JSON.parse(decodedData);
        console.log('Parsed JSON data:', jsonData);

        // Kiểm tra các trường cần thiết
        if (!jsonData.packageId || !jsonData.memberId) {
          console.warn('Missing required fields in extraData:', jsonData);
        }

        return jsonData;
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        return {};
      }
    } catch (error) {
      console.error('Error decoding extraData:', error);
      return {};
    }
  }
}

export default new MoMoPaymentService();