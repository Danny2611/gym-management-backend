// src/config/app.ts
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình cơ bản của ứng dụng
const appConfig = {
  name: 'Gym Manager API',
  env: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV !== 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  url: process.env.APP_URL || 'https://gym-management-backend-production-c5e0.up.railway.app',
  apiPrefix: process.env.API_PREFIX || '/api',
  apiVersion: process.env.API_VERSION || 'v1',
};

// Cấu hình giới hạn request
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // giới hạn 100 request mỗi IP trong mỗi windowMs
  standardHeaders: true, // Trả về headers chuẩn rate limit `RateLimit-*`
  legacyHeaders: false, // Tắt headers không chuẩn `X-RateLimit-*`
  message: 'Quá nhiều yêu cầu từ IP của bạn, vui lòng thử lại sau 15 phút',
};

// Cấu hình tải file
const uploadConfig = {
  destination: process.env.UPLOAD_DIR || 'uploads/',
  maxSize: parseInt(process.env.MAX_FILE_SIZE || '5000000', 10), // 5MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// Cấu hình logging
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'combined',
  directory: process.env.LOG_DIR || 'logs',
};

// Cấu hình Security
const securityConfig = {
  helmet: {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true,
  },
  csrf: {
    enabled: process.env.NODE_ENV === 'production',
    cookieName: 'XSRF-TOKEN',
    headerName: 'X-XSRF-TOKEN',
  },
};

// Cấu hình sẵn cho PWA
const pwaConfig = {
  enabled: true,
  cacheStrategy: 'networkFirst', // networkFirst, cacheFirst, staleWhileRevalidate
  cacheStaticFiles: true,
  serviceWorkerPath: '/service-worker.js',
  manifestPath: '/manifest.json',
  offlinePage: '/offline.html',
};

export default {
  app: appConfig,
  rateLimit: rateLimitConfig,
  upload: uploadConfig,
  logging: loggingConfig,
  security: securityConfig,
  pwa: pwaConfig,
};