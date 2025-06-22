import Appointment from '../models/Appointment';
import Member from '../models/Member';
import Trainer from '../models/Trainer';

const seedAppointments = async () => {
  try {
    // Xóa dữ liệu cũ
    await Appointment.deleteMany({});
    console.log('Đã xóa dữ liệu Appointments cũ');

    // Lấy IDs từ các bảng liên quan
    const members = await Member.find().limit(5);
    const trainers = await Trainer.find().limit(5);

    if (members.length === 0 || trainers.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members hoặc Trainers. Hãy chạy các seeders liên quan trước.');
    }

    // Dữ liệu lịch hẹn mẫu
    const appointments = [
      {
        member_id: members[0]._id,
        trainer_id: trainers[0]._id,
        notes: 'Buổi tư vấn đầu tiên để đánh giá thể lực và lập kế hoạch tập luyện',
        date: new Date('2024-03-15'),
        time: '09:00 - 10:00',
        location: 'Phòng tư vấn - Tầng 1',
        status: 'confirmed',
        created_at: new Date('2024-03-10'),
        updated_at: new Date('2024-03-10')
      },
      {
        member_id: members[1]._id,
        trainer_id: trainers[1]._id,
        notes: 'Buổi hướng dẫn kỹ thuật Yoga cơ bản',
        date: new Date('2024-03-16'),
        time: '14:00 - 15:00',
        location: 'Phòng Yoga - Tầng 2',
        status: 'confirmed',
        created_at: new Date('2024-03-10'),
        updated_at: new Date('2024-03-10')
      },
      {
        member_id: members[2]._id,
        trainer_id: trainers[2]._id,
        notes: 'Đánh giá sức bền và lập kế hoạch tập luyện cardio',
        date: new Date('2024-03-17'),
        time: '16:00 - 17:00',
        location: 'Khu vực Cardio - Tầng 1',
        status: 'pending',
        created_at: new Date('2024-03-11'),
        updated_at: new Date('2024-03-11')
      },
      {
        member_id: members[3]._id,
        trainer_id: trainers[3]._id,
        notes: 'Tư vấn dinh dưỡng và chế độ ăn uống phù hợp',
        date: new Date('2024-03-18'),
        time: '10:30 - 11:30',
        location: 'Phòng tư vấn - Tầng 1',
        status: 'confirmed',
        created_at: new Date('2024-03-12'),
        updated_at: new Date('2024-03-12')
      },
      {
        member_id: members[4]._id,
        trainer_id: trainers[4]._id,
        notes: 'Hướng dẫn kỹ thuật tự vệ cơ bản',
        date: new Date('2024-03-19'),
        time: '18:00 - 19:00',
        location: 'Phòng võ thuật - Tầng 2',
        status: 'confirmed',
        created_at: new Date('2024-03-12'),
        updated_at: new Date('2024-03-12')
      }
    ];

    // Thêm dữ liệu vào database
    await Appointment.insertMany(appointments);
    console.log('Đã thêm 5 lịch hẹn mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Appointment:', error);
  }
};

export default seedAppointments;