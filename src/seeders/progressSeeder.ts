import mongoose from 'mongoose';
import Progress from '../models/Progress';
import Member from '../models/Member';
import connectDB from '../config/db';

const seedProgress = async () => {
  try {
    await connectDB(); // Kết nối MongoDB trước khi seed

    // Xóa dữ liệu cũ
    await Progress.deleteMany({});
    console.log('🔄 Đã xóa dữ liệu Progress cũ');

    // Lấy danh sách hội viên (chỉ lấy 5 người đầu tiên)
    const members = await Member.find().limit(5);

    if (members.length === 0) {
      throw new Error('❌ Không tìm thấy dữ liệu Members. Hãy chạy memberSeeder trước.');
    }

    // Dữ liệu theo dõi tiến độ tập luyện mẫu
    const progressData = [
      {
        member_id: members[0]._id,
        weight: 70,
        height: 175,
        muscle_mass: 35,
        body_fat: 18,
        bmi: 22.9,
        measurement_date: new Date('2024-01-15'),
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
      },
      {
        member_id: members[1]._id,
        weight: 60,
        height: 160,
        muscle_mass: 28,
        body_fat: 20,
        bmi: 23.4,
        measurement_date: new Date('2024-01-20'),
        created_at: new Date('2024-01-20'),
        updated_at: new Date(),
      },
      {
        member_id: members[2]._id,
        weight: 80,
        height: 180,
        muscle_mass: 40,
        body_fat: 15,
        bmi: 24.7,
        measurement_date: new Date('2024-01-25'),
        created_at: new Date('2024-01-25'),
        updated_at: new Date(),
      },
      {
        member_id: members[3]._id,
        weight: 55,
        height: 165,
        muscle_mass: 25,
        body_fat: 22,
        bmi: 20.2,
        measurement_date: new Date('2024-02-05'),
        created_at: new Date('2024-02-05'),
        updated_at: new Date(),
      },
      {
        member_id: members[4]._id,
        weight: 75,
        height: 170,
        muscle_mass: 38,
        body_fat: 17,
        bmi: 25.9,
        measurement_date: new Date('2024-02-10'),
        created_at: new Date('2024-02-10'),
        updated_at: new Date(),
      },
    ];

    // Thêm dữ liệu vào database
    await Progress.insertMany(progressData);
    console.log('✅ Đã thêm 5 bản ghi Progress thành công');

  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu Progress:', error);
  } finally {
    mongoose.connection.close(); // Đóng kết nối sau khi seed xong
  }
};

export default seedProgress;
