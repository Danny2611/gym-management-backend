import Schedule from '../models/Schedule';
import Member from '../models/Member';
import Trainer from '../models/Trainer';
import Package from '../models/Package';
import mongoose from 'mongoose';

const seedSchedules = async () => {
  try {
    // Xóa dữ liệu cũ
    await Schedule.deleteMany({});
    console.log('Đã xóa dữ liệu Schedules cũ');

    // Lấy IDs từ các bảng liên quan
    const members = await Member.find().limit(5);
    const trainers = await Trainer.find().limit(5);
    const packages = await Package.find().limit(5);

    if (members.length === 0 || trainers.length === 0 || packages.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members, Trainers hoặc Packages. Hãy chạy các seeders liên quan trước.');
    }

    // Dữ liệu lịch tập mẫu
    const schedules = [
      {
        member_id: members[0]._id,
        trainer_id: trainers[0]._id,
        package_id: packages[0]._id,
        location: 'Phòng tập chính - Tầng 1',
        date: new Date('2024-03-10'),
        notes: 'Tập trung vào bài tập cơ vai và ngực',
        time: '08:00 - 09:30',
        created_at: new Date('2024-03-05')
      },
      {
        member_id: members[1]._id,
        trainer_id: trainers[1]._id,
        package_id: packages[1]._id,
        location: 'Phòng Yoga - Tầng 2',
        date: new Date('2024-03-11'),
        notes: 'Lớp Yoga cơ bản cho người mới bắt đầu',
        time: '17:30 - 19:00',
        created_at: new Date('2024-03-06')
      },
      {
        member_id: members[2]._id,
        trainer_id: trainers[2]._id,
        package_id: packages[2]._id,
        location: 'Khu vực Cardio - Tầng 1',
        date: new Date('2024-03-12'),
        notes: 'Tập cardio kết hợp bài tập HIIT',
        time: '15:00 - 16:30',
        created_at: new Date('2024-03-07')
      },
      {
        member_id: members[3]._id,
        trainer_id: trainers[3]._id,
        package_id: packages[3]._id,
        location: 'Phòng tập riêng - Tầng 3',
        date: new Date('2024-03-13'),
        notes: 'Đánh giá thể trạng và lập kế hoạch dinh dưỡng',
        time: '10:00 - 11:30',
        created_at: new Date('2024-03-07')
      },
      {
        member_id: members[4]._id,
        trainer_id: trainers[4]._id,
        package_id: packages[4]._id,
        location: 'Phòng võ thuật - Tầng 2',
        date: new Date('2024-03-14'),
        notes: 'Học kỹ thuật tự vệ cơ bản',
        time: '18:00 - 19:30',
        created_at: new Date('2024-03-08')
      }
    ];

    // Thêm dữ liệu vào database
    await Schedule.insertMany(schedules);
    console.log('Đã thêm 5 lịch tập mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Schedule:', error);
  }
};

export default seedSchedules;