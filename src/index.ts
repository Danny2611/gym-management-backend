
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression'; // Nén dữ liệu HTTP Response để tăng tốc độ tải trang

// config
import connectDB  from './config/db';
// import corsConfig from './config/cors';
import './config/passport'; // Import cấu hình OAuth
import cookieParser from 'cookie-parser'; // Đọc và xử lý cookie từ request

// Import scheduled jobs
import { initScheduledJobs } from './services/appointmentService';
import { initScheduledMembershipJobs } from './services/membershipService';
import { initScheduledWorkoutJobs } from './services/workoutService';
import { initScheduledTrainerJobs } from './services/trainerService';
import { initializePushService } from './config/push-notification';
import notificationService from './services/pwa/NotificationService';

//middleware
// import {errorHandler} from './middlewares/errorHandler';

// routes
import authRoutes from './routes/api/authRoutes';
import userRoutes from "./routes/api/userRoutes";
import adminRoutes from './routes/api/adminRoutes';
import publicRoutes from "./routes/api/publicRoutes";
import pwaRoutes from "./routes/pwa/pwaRoutes";


dotenv.config(); 
const PORT = process.env.PORT ; 
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
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       imgSrc: ["'self'", "https://gym-management-backend-production-c5e0.up.railway.app", "data:", "blob:"], // allow images
//       scriptSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//     },
//   })
// );

// const allowedOrigins = [
//   "https://gym-management-fronted-4jgg.vercel.app",
  
//   "http://localhost:5173"
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));
app.use(cors({
  origin: "https://gym-management-fronted-4jgg.vercel.app", // tên miền frontend
  credentials: true // nếu bạn có dùng cookie, session
}));
app.use(passport.initialize());
// app.use(cors(corsConfig.current));

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

// app.use(errorHandler);
export default app;
