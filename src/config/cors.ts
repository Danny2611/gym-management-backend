// // # Cấu hình CORS

// // src/config/cors.ts
// import dotenv from 'dotenv';
// import { CorsOptions } from 'cors';

// dotenv.config();

// // Danh sách origin được phép truy cập
// const whitelist = [
//   'http://localhost:3000', 
//   'http://localhost:4173',
//   'https://momo.vn',
//   'https://payment.momo.vn',
//   'https://test-payment.momo.vn',
//   'https://gym-management-fronted-2qoa.vercel.app', 
//   process.env.FRONTEND_URL || 'https://gym-management-fronted-2qoa.vercel.app'
// ];


// // Cấu hình CORS
// const corsOptions: CorsOptions = {

//     origin: (origin, callback) => {

//     if (!origin) return callback(null, true);
    
//     if (whitelist.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.error(`CORS blocked origin: ${origin}`);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'], // ✅ THÊM Ở ĐÂY
//   exposedHeaders: ['Content-Length', 'X-Rate-Limit'],
//   credentials: true,
//   preflightContinue: false,
//   optionsSuccessStatus: 200,
//   maxAge: 86400,
// };


// // Cấu hình CORS đơn giản cho môi trường phát triển
// const developmentCorsOptions: CorsOptions = {
//   origin: '*', // Cho phép tất cả origin trong môi trường phát triển
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
//   credentials: true,
// };

// export default {
//   production: corsOptions,
//   development: developmentCorsOptions,
//   // Sử dụng cấu hình dựa trên môi trường
//   get current(): CorsOptions {
//     return process.env.NODE_ENV === 'production' ? this.production : this.development;
//   },
// };