import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Member from '../models/Member';
import Package from '../models/Package';
import connectDB from '../config/db';

const seedPayments = async () => {
  try {
    await connectDB(); // Kết nối MongoDB trước khi seed

    // Xóa dữ liệu cũ
    await Payment.deleteMany({});
    console.log('🔄 Đã xóa dữ liệu Payments cũ');

    // Lấy danh sách thành viên & gói tập
    const members = await Member.find().limit(5);
    const packages = await Package.find().limit(5);

    if (members.length === 0 || packages.length === 0) {
      throw new Error('❌ Không tìm thấy dữ liệu Members hoặc Packages. Hãy chạy seeders liên quan trước.');
    }

    // Dữ liệu thanh toán mẫu
    const payments = [
      {
        member_id: members[0]._id,
        package_id: packages[0]._id,
        method: 'Chuyển khoản ngân hàng',
        amount: 500000,
        social_links: { facebook: 'https://facebook.com/nguyenvanan' },
        payment_date: new Date('2024-01-15'),
        rating: 4.5,
        status: 'success',
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
      },
      {
        member_id: members[1]._id,
        package_id: packages[1]._id,
        method: 'Tiền mặt',
        amount: 1000000,
        social_links: { 
          facebook: 'https://facebook.com/tranthibinh', 
          instagram: 'https://instagram.com/tranthibinh' 
        },
        payment_date: new Date('2024-01-20'),
        rating: 5.0,
        status: 'success',
        created_at: new Date('2024-01-20'),
        updated_at: new Date(),
      },
      {
        member_id: members[2]._id,
        package_id: packages[2]._id,
        method: 'Thẻ tín dụng',
        amount: 2000000,
        social_links: { facebook: 'https://facebook.com/levancuong' },
        payment_date: new Date('2024-01-25'),
        rating: 4.0,
        status: 'success',
        created_at: new Date('2024-01-25'),
        updated_at: new Date(),
      },
      {
        member_id: members[3]._id,
        package_id: packages[3]._id,
        method: 'Ví điện tử MoMo',
        amount: 5000000,
        social_links: { instagram: 'https://instagram.com/phamthidung' },
        payment_date: new Date('2024-02-05'),
        rating: 4.8,
        status: 'success',
        created_at: new Date('2024-02-05'),
        updated_at: new Date(),
      },
      {
        member_id: members[4]._id,
        package_id: packages[4]._id,
        method: 'ZaloPay',
        amount: 1800000,
        social_links: { 
          facebook: 'https://facebook.com/hoangminhem', 
          instagram: 'https://instagram.com/hoangminhem' 
        },
        payment_date: new Date('2024-02-10'),
        rating: 4.2,
        status: 'success',
        created_at: new Date('2024-02-10'),
        updated_at: new Date(),
      }
    ];

    // Thêm dữ liệu vào database
    await Payment.insertMany(payments);
    console.log('✅ Đã thêm 5 thanh toán mẫu thành công');

  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu Payment:', error);
  } finally {
    mongoose.connection.close(); // Đóng kết nối sau khi seed xong
  }
};

export default seedPayments;
