import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import seedMembers from './memberSeeder';
import seedFAQs from './faqSeeder';
import seedNotifications from './notificationSeeder';
import seedPackages from './packageSeeder';
import seedPayments from './paymentSeeder';
import seedPromotions from './promotionSeeder';
import seedTrainers from './trainerSeeder';
import seedSuccessStories from './successStorySeeder';
import seedMemberships from './membershipSeeder';
import seedUserRoles from './userRoleSeeder';
import seedReviews from './reviewSeeder';
import seedSchedules from './scheduleSeeder';
import seedProgress from './progressSeeder';
import seedAppointments from './appointmentSeeder';
import seedWorkoutLogs from './workoutLogSeeder';
import seedPackageDetails from './packageDetailSeeder';
import seedBlogCategories from './blogCategorySeeder';
import seedBlogPosts from './blogPostSeeder';

// import các seeders khác nếu cần
// npx ts-node src/seeders/seed.ts 
dotenv.config(); // Load biến môi trường

const seedAll = async () => {
  try {
    await connectDB(); // Kết nối MongoDB
    // await seedMemberships();
    // await seedAppointments(); 
    // await seedFAQs();
    // await seedNotifications();
    // await seedPackages();
    // await seedPromotions();
    // await seedBlogCategories();
    await seedBlogPosts();
    // await seedPayments();
    // await seedPromotions();
    // await seedTrainers();
    // await seedSuccessStories();
    // await seedUserRoles();
    // await seedMembers();
    // await seedReviews();
    // await seedSchedules();
    // await seedProgress();
    // await seedWorkoutLogs();
    // await seedAppointments();
   



    console.log('✅ Seed dữ liệu thành công');
    mongoose.connection.close(); // Đóng kết nối sau khi hoàn tất
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    mongoose.connection.close();
  }
};

seedAll();
