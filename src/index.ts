// // src/app.ts
// import express, { Application, Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import helmet from 'helmet'; // Bảo mật HTTP headers, giúp bảo vệ khỏi tấn công phổ biến.
// import morgan from 'morgan';// Ghi log chi tiết các request đến server, giúp debug dễ dàng hơn.
// import path from 'path';
// import compression from 'compression'; // Nén dữ liệu HTTP Response để tăng tốc độ tải trang
// import rateLimit from 'express-rate-limit'; // Chặn spam request (DDoS Protection)
// import session from 'express-session'; // Quản lý phiên đăng nhập (Session)

// import connectDB  from './config/db';
// import appConfig from './config/app';
// import corsConfig from './config/cors';
// import authConfig from './config/auth';

// // Import routes
// import authRoutes from './routes/api/authRoutes';
// // import userRoutes from './routes/api/userRoutes';
// // import adminRoutes from './routes/api/adminRoutes';
// // import publicRoutes from './routes/api/publicRoutes';
// // import serviceWorkerRoutes from './routes/pwa/serviceWorkerRoutes';

// // Tạo Express app
// const app: Application = express();

// // Kết nối database
// connectDB();

// // Cấu hình middleware cơ bản
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cors(corsConfig.current));
// app.use(helmet(appConfig.security.helmet));
// app.use(cookieParser());
// app.use(compression());

// // Cấu hình logging
// app.use(morgan(appConfig.logging.format));

// // Rate limiting
// const limiter = rateLimit(appConfig.rateLimit);
// app.use(limiter);

// // Session
// app.use(session(authConfig.session));

// // Thư mục tĩnh
// app.use(express.static(path.join(__dirname, '../public')));

// // API routes
// // const apiPrefix = `${appConfig.app.apiPrefix}/${appConfig.app.apiVersion}`;

// app.use('/api/auth', authRoutes);
// // app.use(`${apiPrefix}/user`, userRoutes);
// // app.use(`${apiPrefix}/admin`, adminRoutes);
// // app.use(apiPrefix, publicRoutes);
// // app.use('/pwa', serviceWorkerRoutes);

// // Route mặc định
// app.get('/', (req: Request, res: Response) => {
//   res.json({
//     name: appConfig.app.name,
//     version: appConfig.app.apiVersion,
//     env: appConfig.app.env,
//     status: 'running'
//   });
// });

// // Route không tìm thấy
// app.use((req: Request, res: Response) => {
//   res.status(404).json({ message: 'Route không tồn tại' });
// });

// // Xử lý lỗi
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.error(err.stack);
  
//   const statusCode = err.statusCode || 500;
//   const message = err.message || 'Đã xảy ra lỗi trên máy chủ';
  
//   res.status(statusCode).json({
//     status: 'error',
//     statusCode,
//     message,
//     ...(appConfig.app.debug && { stack: err.stack }),
//   });
// });

// // Thiết lập port và khởi động server
// const PORT = appConfig.app.port;

// app.listen(PORT, () => {
//   console.log(`Server đang chạy trên port ${PORT} trong môi trường ${appConfig.app.env}`);
// });

// export default app;

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import appConfig from './config/app';
import compression from 'compression'; // Nén dữ liệu HTTP Response để tăng tốc độ tải trang
import rateLimit from 'express-rate-limit'; // Chặn spam request (DDoS Protection)
import session from 'express-session'; // Quản lý phiên đăng nhập (Session)
// config
import connectDB  from './config/db';
import corsConfig from './config/cors';
import './config/passport'; // Import cấu hình OAuth
import cookieParser from 'cookie-parser'; // Đọc và xử lý cookie từ request

// Import scheduled jobs
import { initScheduledJobs } from './services/appointmentService';
import { initScheduledMembershipJobs } from './services/membershipService';
import { initScheduledWorkoutJobs } from './services/workoutService';
import { initScheduledTrainerJobs } from './services/trainerService';
import { initializePushService } from '~/config/push-notification';
import notificationService from './services/pwa/NotificationService';

//middleware
import {errorHandler} from './middlewares/errorHandler';

// routes
import authRoutes from './routes/api/authRoutes';
import userRoutes from "./routes/api/userRoutes";
import adminRoutes from '~/routes/api/adminRoutes';
import publicRoutes from "./routes/api/publicRoutes";
import pwaRoutes from "~/routes/pwa/pwaRoutes";


dotenv.config(); // Load biến môi trường từ file .env
const PORT = process.env.PORT ; // Lấy PORT từ .env, nếu không có thì dùng 5000

const app = express();

connectDB();

// Initialize scheduled jobs after database connection
initScheduledJobs();
initScheduledWorkoutJobs();
initScheduledMembershipJobs();
initScheduledTrainerJobs();
console.log('Scheduled jobs initialized');

initializePushService();
console.log('🚀 Starting Notification Service...');
notificationService.initializeScheduler(); // ✅ Khởi chạy scheduler




app.use(express.json());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "http://localhost:5000", "data:", "blob:"], // allow images
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);

app.use(passport.initialize());
app.use(cors(corsConfig.current));
app.use(errorHandler);
app.use(cookieParser());
 app.use(compression());

 
// // Rate limiting
// const limiter = rateLimit(appConfig.rateLimit);
// app.use(limiter);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  notificationService.stopScheduler();
  process.exit(0);
});



app.use('/public', express.static('public'));
app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/pwa", pwaRoutes);
export default app;
