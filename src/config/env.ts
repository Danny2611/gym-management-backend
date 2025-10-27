// src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Xác định môi trường
const nodeEnv = process.env.NODE_ENV || 'development';

// Load file .env tương ứng
const envFile = nodeEnv === 'production' 
  ? '.env.production' 
  : '.env.development';

const envPath = path.resolve(process.cwd(), envFile);

// Load env variables vào process.env
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️  Warning: Could not load ${envFile} file`);
} else {
  console.log(`✅ Loaded environment from: ${envFile}`);
}

console.log(`🚀 Running in ${nodeEnv.toUpperCase()} mode`);
console.log(`📍 Server will run on: ${process.env.APP_URL || `http://${process.env.HOST}:${process.env.PORT}`}`);

// Validate required env vars trong production
if (nodeEnv === 'production') {
  const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SESSION_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

// Export helper để check environment
export const isDevelopment = (): boolean => nodeEnv === 'development';
export const isProduction = (): boolean => nodeEnv === 'production';
export const isTest = (): boolean => nodeEnv === 'test';