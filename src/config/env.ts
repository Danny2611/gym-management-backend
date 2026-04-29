import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

// ✅ CHỈ load file khi KHÔNG phải production
if (nodeEnv !== 'production') {
  const envFile = nodeEnv === 'test' ? '.env.test' : '.env.development';
  const envPath = path.resolve(process.cwd(), envFile);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(`⚠️ Could not load ${envFile}`);
  } else {
    console.log(`✅ Loaded environment from: ${envFile}`);
  }
} else {
  console.log('🚀 Using environment variables from platform (Render)');
}

console.log(`🚀 Running in ${nodeEnv.toUpperCase()} mode`);
console.log(`📍 Server URL: ${process.env.APP_URL || `http://localhost:${process.env.PORT}`}`);

// ✅ Validate production env
if (nodeEnv === 'production') {
  const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing ENV: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

export const isDevelopment = () => nodeEnv === 'development';
export const isProduction = () => nodeEnv === 'production';
export const isTest = () => nodeEnv === 'test';