// src/index.ts
import express from 'express';
import './config/env'; 
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';

// config
// import corsConfig from './config/cors';
import './config/passport';
import cookieParser from 'cookie-parser';

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

import morgan from 'morgan';
import { connectDB } from './config/db';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// ======================= MIDDLEWARE =======================
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL, // dùng ENV thay vì hardcode
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(passport.initialize());
app.use(cookieParser());
app.use(compression());

// ======================= HEALTH CHECK =======================
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// ======================= STATIC =======================
app.use('/public', express.static(path.join(__dirname, '../public')));

// ======================= ROUTES =======================
app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/pwa", pwaRoutes);

// ======================= START SERVER =======================
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected');

    // Initialize scheduled jobs AFTER DB ready
    initScheduledJobs();
    initScheduledWorkoutJobs();
    initScheduledMembershipJobs();
    initScheduledTrainerJobs();
    console.log('✅ Scheduled jobs initialized');

    // Push notification
    initializePushService();
    console.log('🚀 Starting Notification Service...');
    notificationService.initializeScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ======================= GRACEFUL SHUTDOWN =======================
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM received. Shutting down gracefully...');
  notificationService.stopScheduler();
  process.exit(0);
});

// app.use(errorHandler);

export default app;