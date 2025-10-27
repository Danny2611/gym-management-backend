// src/types/environment.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // App config
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      HOST: string;
      APP_URL: string;
      API_PREFIX: string;
      API_VERSION: string;

      // Database
      MONGODB_URI: string;

      // JWT
      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_ACCESS_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;
      JWT_ALGORITHM: string;
      JWT_ISSUER: string;
      JWT_AUDIENCE: string;

      // Session
      SESSION_SECRET: string;

      // Email
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      SMTP_FROM_EMAIL: string;
      SMTP_FROM_NAME: string;

      // Social Login - Google
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CALLBACK_URL: string;

      // Social Login - Facebook
      FACEBOOK_CLIENT_ID: string;
      FACEBOOK_APP_SECRET: string;
      FACEBOOK_CALLBACK_URL: string;

      // Payment - MoMo
      MOMO_PARTNER_CODE: string;
      MOMO_ACCESS_KEY: string;
      MOMO_SECRET_KEY: string;
      MOMO_ENDPOINT_URL: string;
      MOMO_IPN_URL: string;
      MOMO_REDIRECT_URL: string;

      // CORS
      FRONTEND_URL: string;

      // Upload
      UPLOAD_DIR: string;
      MAX_FILE_SIZE: string;

      // Logging
      LOG_LEVEL: string;
      LOG_FORMAT: string;
      LOG_DIR: string;

      // Web Push
      VAPID_PUBLIC_KEY: string;
      VAPID_PRIVATE_KEY: string;
      VAPID_SUBJECT: string;

      // Cloudinary
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
    }
  }
}

export {};