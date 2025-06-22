import dotenv from 'dotenv';
import { Algorithm, Secret } from 'jsonwebtoken';

dotenv.config();

// // // Thiết lập JWT
// // interface JwtConfig {
// //   secret: Secret;
// //   accessTokenExpiry: string | number; // expiresIn có thể là string hoặc number
// //   refreshTokenExpiry: string | number; // expiresIn có thể là string hoặc number
// //   algorithm: Algorithm;
// //   issuer: string;
// //   audience: string;
// // }

// // // Kiểm tra và đảm bảo giá trị hợp lệ cho JWT config
// // const ensureJwtConfig = (): JwtConfig => {
// //   const secret = process.env.JWT_SECRET || 'default-secret';
// //   if (!secret) {
// //     throw new Error('JWT_SECRET is not defined in environment variables');
// //   }

// //   const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '1h';
// //   const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

// //   const validAlgorithms: Algorithm[] = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
// //   const algorithm = (process.env.JWT_ALGORITHM || 'HS256') as Algorithm;
// //   if (!validAlgorithms.includes(algorithm)) {
// //     throw new Error(`Invalid JWT algorithm: ${algorithm}`);
// //   }

// //   const issuer = process.env.JWT_ISSUER || 'gym_management-api';
// //   const audience = process.env.JWT_AUDIENCE || 'gym_management-client';

// //   return {
// //     secret,
// //     accessTokenExpiry,
// //     refreshTokenExpiry,
// //     algorithm,
// //     issuer,
// //     audience,
// //   };
// // };

// // const jwtConfig = ensureJwtConfig();

// // // Thiết lập OAuth cho đăng nhập bằng Google
// // const googleOAuth = {
// //   clientID: process.env.GOOGLE_CLIENT_ID || '',
// //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
// //   callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:2000/api/auth/google/callback',
// //   scope: ['profile', 'email'],
// // };

// // // Thiết lập OAuth cho đăng nhập bằng Facebook
// // const facebookOAuth = {
// //   clientID: process.env.FACEBOOK_APP_ID || '',
// //   clientSecret: process.env.FACEBOOK_APP_SECRET || '',
// //   callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:2000/api/auth/facebook/callback',
// //   profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
// //   scope: ['email', 'public_profile'],
// // };

// // // Thiết lập mật khẩu
// // const passwordConfig = {
// //   saltRounds: 10, // Số vòng băm cho bcrypt
// //   resetTokenExpiry: '1h', // Token đặt lại mật khẩu hết hạn sau 1 giờ
// //   minLength: 8, // Độ dài tối thiểu của mật khẩu
// //   requireSpecialChar: true, // Yêu cầu ký tự đặc biệt
// //   requireNumber: true, // Yêu cầu số
// //   requireUppercase: true, // Yêu cầu chữ hoa
// // };

// Cấu hình cho các phiên (session)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Sử dụng HTTPS trong sản phẩm
    maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    httpOnly: true,
  },
};

// // // Phân quyền
const roleConfig = {
  admin: 'admin',
  member: 'member',

};

export default {
//  jwt: jwtConfig,
//  google: googleOAuth,
 // facebook: facebookOAuth,
 // password: passwordConfig,
  session: sessionConfig,
  roles: roleConfig,
};


