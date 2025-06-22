import dotenv from 'dotenv';
import { Algorithm, Secret } from 'jsonwebtoken';

dotenv.config();

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


