// # Xử lý thanh toán - Fixed version
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

    // Tạo signature cho MoMo
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${this.config.redirectUrl}&requestId=${requestId}&requestType=${this.config.requestType}`;
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Tạo request body
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

    try {
      // Gửi request đến MoMo API
      const response = await axios.post(this.endpointUrl, requestBody);
      return response.data;
    } catch (error) {
      console.error('MoMo payment request error:', error);
      throw new Error('Không thể kết nối với cổng thanh toán MoMo');
    }
  }

  /**
   * Xác thực callback từ MoMo - FIXED VERSION
   */
  verifyCallback(callbackData: any): boolean {
    try {
      console.log('Verifying MoMo callback data:', JSON.stringify(callbackData, null, 2));
      
      const { 
        partnerCode, 
        orderId, 
        requestId, 
        amount, 
        orderInfo, 
        orderType, 
        transId, 
        resultCode, 
        message, 
        payType, 
        responseTime, 
        extraData, 
        signature 
      } = callbackData;
      
      console.log('Received signature:', signature);
      
      // Tạo signature để xác thực theo đúng format của MoMo callback
      // Thứ tự các tham số khác với khi tạo payment request
      const rawSignature = 
        `accessKey=${this.config.accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&message=${message}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&orderType=${orderType}` +
        `&partnerCode=${partnerCode}` +
        `&payType=${payType}` +
        `&requestId=${requestId}` +
        `&responseTime=${responseTime}` +
        `&resultCode=${resultCode}` +
        `&transId=${transId}`;
      
      console.log('Raw signature string for callback:', rawSignature);
      console.log('Secret key used:', this.config.secretKey);
      
      const computedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(rawSignature)
        .digest('hex');
      
      console.log('Computed signature:', computedSignature);
      
      const isValid = computedSignature === signature;
      console.log('Signature validation result:', isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error verifying MoMo signature:', error);
      return false;
    }
  }

  /**
   * Xác thực IPN từ MoMo (tương tự callback nhưng có thể có format khác)
   */
  verifyIPN(ipnData: any): boolean {
    try {
      console.log('Verifying MoMo IPN data:', JSON.stringify(ipnData, null, 2));
      
      const { 
        partnerCode, 
        orderId, 
        requestId, 
        amount, 
        orderInfo, 
        orderType, 
        transId, 
        resultCode, 
        message, 
        payType, 
        responseTime, 
        extraData, 
        signature 
      } = ipnData;
      
      console.log('Received IPN signature:', signature);
      
      // Tạo signature để xác thực IPN (có thể khác với callback)
      const rawSignature = 
        `accessKey=${this.config.accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&message=${message}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&orderType=${orderType}` +
        `&partnerCode=${partnerCode}` +
        `&payType=${payType}` +
        `&requestId=${requestId}` +
        `&responseTime=${responseTime}` +
        `&resultCode=${resultCode}` +
        `&transId=${transId}`;
      
      console.log('Raw signature string for IPN:', rawSignature);
      
      const computedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(rawSignature)
        .digest('hex');
      
      console.log('Computed IPN signature:', computedSignature);
      
      const isValid = computedSignature === signature;
      console.log('IPN signature validation result:', isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error verifying MoMo IPN signature:', error);
      return false;
    }
  }

  /**
   * Giải mã extraData từ MoMo
   */
  decodeExtraData(extraData: string): any {
    try {
      console.log('Raw extraData received:', extraData);
      
      if (!extraData) {
        console.error('extraData is missing or empty');
        return {};
      }
      
      const decodedData = Buffer.from(extraData, 'base64').toString('utf8');
      console.log('Decoded string:', decodedData);
      
      try {
        const jsonData = JSON.parse(decodedData);
        console.log('Parsed JSON data:', jsonData);
        
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