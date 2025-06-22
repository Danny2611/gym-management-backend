import mongoose from 'mongoose';
import Member from '../models/Member';
import Role from '../models/Role';
import bcrypt from 'bcrypt';

const seedMembers = async () => {
  try {
    // Xóa dữ liệu cũ
    await Member.deleteMany({});
    console.log('Đã xóa dữ liệu Members cũ');

    // Lấy role ID
    const memberRole = await Role.findOne({ name: 'Member' });
    if (!memberRole) {
      throw new Error('Vai trò Member không tồn tại. Hãy chạy roleSeeder trước.');
    }

  

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Dữ liệu mẫu hội viên với status
    const members = [
      {
        name: 'Nguyễn Văn An1',
        avatar: '/uploads/avatars/member1.jpg',
        email: 'nguyenvanan@example.com',
        password: hashedPassword,
        gender: 'male',
        phone: '0901234567',
        dateOfBirth: new Date('1992-05-15'),
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        role: memberRole._id,
        status: 'active',
        otp: null,
        otpExpires: null,
        isVerified: false,
        created_at: new Date('2023-01-10')
      },
      {
        name: 'Trần Thị Bình',
        avatar: '/uploads/avatars/member2.jpg',
        email: 'tranthibinh@example.com',
        password: hashedPassword,
        gender: 'female',
        phone: '0912345678',
        dateOfBirth: new Date('1995-09-23'),
        address: '456 Lê Lợi, Quận 3, TP.HCM',
        role: memberRole._id,
        status: 'inactive',
        otp: null,
        otpExpires: null,
        isVerified: false,
        created_at: new Date('2023-02-05')
      },
      {
        name: 'Lê Văn Cường',
        avatar: '/uploads/avatars/member3.jpg',
        email: 'levancuong@example.com',
        password: hashedPassword,
        gender: 'male',
        phone: '0923456789',
        dateOfBirth: new Date('1988-11-17'),
        address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
        role: memberRole._id,
        status: 'pending',
        otp: null,
        otpExpires: null,
        isVerified: false,
        created_at: new Date('2023-03-20')
      },
      {
        name: 'Phạm Thị Dung',
        avatar: '/uploads/avatars/member4.jpg',
        email: 'phamthidung@example.com',
        password: hashedPassword,
        gender: 'female',
        phone: '0934567890',
        dateOfBirth: new Date('1990-07-08'),
        address: '321 Võ Văn Tần, Quận 3, TP.HCM',
        role: memberRole._id,
        status: 'banned',
        otp: null,
        otpExpires: null,
        isVerified: false,
        created_at: new Date('2023-04-15')
      },
      {
        name: 'Hoàng Minh Em',
        avatar: '/uploads/avatars/member5.jpg',
        email: 'hoangminhem@example.com',
        password: hashedPassword,
        gender: 'male',
        phone: '0945678901',
        dateOfBirth: new Date('1993-12-25'),
        address: '654 Nguyễn Đình Chiểu, Quận 1, TP.HCM',
        role: memberRole._id,
        status: 'active',
        otp: null,
        otpExpires: null,
        isVerified: false,
        created_at: new Date('2023-05-30')
      }
    ];

    // Thêm dữ liệu vào database
    await Member.insertMany(members);
    console.log('Đã thêm 5 hội viên mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Member:', error);
  }
};

export default seedMembers;
