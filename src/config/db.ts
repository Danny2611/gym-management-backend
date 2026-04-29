import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }

    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // fail nhanh nếu không connect được
    });

    console.log('✅ MongoDB connected successfully');

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};