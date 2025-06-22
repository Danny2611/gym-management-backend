import mongoose from 'mongoose';
import WorkoutLog from '../models/WorkoutLog';
import Member from '../models/Member';
import Trainer from '../models/Trainer';
import connectDB from '../config/db';

const seedWorkoutLogs = async () => {
  try {
    await connectDB(); // Kết nối MongoDB

    // Xóa dữ liệu cũ
    await WorkoutLog.deleteMany({});
    console.log('🔄 Đã xóa dữ liệu WorkoutLogs cũ');

    // Lấy danh sách hội viên & huấn luyện viên
    const members = await Member.find().limit(5);
    const trainers = await Trainer.find().limit(3);

    if (members.length === 0) {
      throw new Error('❌ Không tìm thấy dữ liệu Members. Hãy chạy memberSeeder trước.');
    }

    // Dữ liệu nhật ký tập luyện mẫu
    const workoutLogs = [
      {
        member_id: members[0]._id,
        date: new Date('2024-02-15'),
        duration: 60,
        calories_burned: 500,
        exercises: [
          { name: 'Squat', reps: 12, sets: 3 },
          { name: 'Deadlift', reps: 10, sets: 3 },
        ],
        notes: 'Buổi tập cường độ cao',
        trainer_id: trainers[0]?._id || null,
      },
      {
        member_id: members[1]._id,
        date: new Date('2024-02-18'),
        duration: 45,
        calories_burned: 400,
        exercises: [
          { name: 'Bench Press', reps: 10, sets: 3 },
          { name: 'Pull-ups', reps: 8, sets: 3 },
        ],
        notes: 'Cần cải thiện sức mạnh tay',
        trainer_id: trainers[1]?._id || null,
      },
      {
        member_id: members[2]._id,
        date: new Date('2024-02-20'),
        duration: 50,
        calories_burned: 450,
        exercises: [
          { name: 'Running', reps: 1, sets: 1 },
          { name: 'Plank', reps: 1, sets: 3 },
        ],
        notes: 'Tập trung vào sức bền',
        trainer_id: trainers[2]?._id || null,
      },
      {
        member_id: members[3]._id,
        date: new Date('2024-02-25'),
        duration: 40,
        calories_burned: 350,
        exercises: [
          { name: 'Push-ups', reps: 20, sets: 3 },
          { name: 'Jump Rope', reps: 100, sets: 3 },
        ],
        notes: 'Tập nhẹ nhàng phục hồi cơ',
        trainer_id: null,
      },
      {
        member_id: members[4]._id,
        date: new Date('2024-02-28'),
        duration: 55,
        calories_burned: 480,
        exercises: [
          { name: 'Rowing Machine', reps: 1, sets: 3 },
          { name: 'Dumbbell Press', reps: 10, sets: 3 },
        ],
        notes: 'Cải thiện sức mạnh cơ vai',
        trainer_id: trainers[0]?._id || null,
      },
    ];

    // Thêm dữ liệu vào database
    await WorkoutLog.insertMany(workoutLogs);
    console.log('✅ Đã thêm 5 nhật ký tập luyện thành công');

  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu WorkoutLogs:', error);
  } finally {
    mongoose.connection.close(); // Đóng kết nối sau khi seed xong
  }
};

export default seedWorkoutLogs;
