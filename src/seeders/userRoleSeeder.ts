import UserRole from '../models/UserRole';
import Member from '../models/Member';
import Trainer from '../models/Trainer';
import Role from '../models/Role';

const seedUserRoles = async () => {
  try {
    // Xóa dữ liệu cũ
    await UserRole.deleteMany({});
    console.log('Đã xóa dữ liệu UserRoles cũ');

    // Lấy danh sách Members và Trainers
    const members = await Member.find().limit(5);
    const trainers = await Trainer.find().limit(5);
    const roles = await Role.find();

    // Kiểm tra dữ liệu có tồn tại không
    if (members.length === 0 || trainers.length === 0 || roles.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members, Trainers hoặc Roles. Hãy chạy các seeder liên quan trước.');
    }

    // Lấy role theo tên
    const memberRole = roles.find(role => role.name === 'Member');
    const adminRole = roles.find(role => role.name === 'Admin');
    const trainerRole = roles.find(role => role.name === 'Trainer');

    // Nếu thiếu role, báo lỗi ngay
    if (!memberRole || !adminRole || !trainerRole) {
      throw new Error('Không tìm thấy vai trò phù hợp trong bảng Role. Hãy kiểm tra và seed dữ liệu Roles trước.');
    }

    // Dữ liệu phân quyền người dùng mẫu
    const userRoles = [
      {
        user_id: members[0]._id,
        role_id: memberRole._id
      },
      {
        user_id: members[1]._id,
        role_id: memberRole._id
      },
      {
        user_id: members[2]._id,
        role_id: adminRole._id
      },
      {
        user_id: trainers[0]._id,
        role_id: trainerRole._id
      }
    ];

    // Thêm dữ liệu vào database
    await UserRole.insertMany(userRoles);
    console.log('Đã thêm 3 phân quyền người dùng mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu UserRole:', error);
  }
};

export default seedUserRoles;