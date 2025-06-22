import Notification from '../models/Notification';
import Member from '../models/Member';
import Trainer from '../models/Trainer';

const seedNotifications = async () => {
  try {
    // Xóa dữ liệu cũ
    await Notification.deleteMany({});
    console.log('Đã xóa dữ liệu Notifications cũ');

    // Lấy IDs từ các bảng liên quan
    const members = await Member.find().limit(5);
    const trainers = await Trainer.find().limit(5);

    if (members.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members. Hãy chạy memberSeeder trước.');
    }

    // Dữ liệu thông báo mẫu
    const notifications = [
      {
        member_id: members[0]._id,
        trainer_id: trainers[0]._id,
        message: 'Nhắc nhở: Bạn có buổi tập lúc 8:00 sáng mai với HLV Đặng Minh Anh',
        type: 'reminder',
        status: 'sent',
        created_at: new Date('2024-03-09')
      },
      {
        member_id: members[1]._id,
        trainer_id: trainers[1]._id,
        message: 'Nhắc nhở: Buổi học Yoga của bạn sẽ diễn ra vào 17:30 ngày mai',
        type: 'reminder',
        status: 'sent',
        created_at: new Date('2024-03-10')
      },
      {
        member_id: members[2]._id,
        trainer_id: trainers[2]._id,
        message: 'Khuyến mãi: Gia hạn gói Premium trong tháng này và nhận thêm 2 buổi PT miễn phí',
        type: 'promotion',
        status: 'sent',
        created_at: new Date('2024-03-08')
      },
      {
        member_id: members[3]._id,
        trainer_id: trainers[3]._id,
        message: 'Lịch hẹn: Buổi tư vấn dinh dưỡng với HLV Nguyễn Thị Evy đã được xác nhận',
        type: 'appointment',
        status: 'sent',
        created_at: new Date('2024-03-12')
      },
      {
        member_id: members[4]._id,
        trainer_id: trainers[4]._id,
        message: 'Thông báo: Phòng tập sẽ đóng cửa sớm vào ngày 20/03/2024 để bảo trì thiết bị',
        type: 'reminder',
        status: 'pending',
        created_at: new Date('2024-03-13')
      }
    ];

    // Thêm dữ liệu vào database
    await Notification.insertMany(notifications);
    console.log('Đã thêm 5 thông báo mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Notification:', error);
  }
};

export default seedNotifications;