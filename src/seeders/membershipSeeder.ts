import Membership from '../models/Membership';
import Member from '../models/Member';
import Package from '../models/Package';

const seedMemberships = async () => {
  try {
    // Xóa dữ liệu cũ
    await Membership.deleteMany({});
    console.log('Đã xóa dữ liệu Memberships cũ');

    // Lấy IDs từ các bảng liên quan
    const members = await Member.find().limit(5);
    const packages = await Package.find().limit(5);

    if (members.length === 0 || packages.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members hoặc Packages. Hãy chạy các seeders liên quan trước.');
    }

    // Dữ liệu gói tập của hội viên mẫu
    const memberships = [
      {
        member_id: members[0]._id,
        package_id: packages[0]._id,
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-02-14'),
        auto_renew: true,
        status: 'active'
      },
      {
        member_id: members[1]._id,
        package_id: packages[1]._id,
        start_date: new Date('2024-01-20'),
        end_date: new Date('2024-03-20'),
        auto_renew: false,
        status: 'active'
      },
      {
        member_id: members[2]._id,
        package_id: packages[2]._id,
        start_date: new Date('2024-01-25'),
        end_date: new Date('2024-04-25'),
        auto_renew: true,
        status: 'active'
      },
      {
        member_id: members[3]._id,
        package_id: packages[3]._id,
        start_date: new Date('2024-02-05'),
        end_date: new Date('2024-08-04'),
        auto_renew: false,
        status: 'active'
      },
      {
        member_id: members[4]._id,
        package_id: packages[4]._id,
        start_date: new Date('2024-02-10'),
        end_date: new Date('2024-04-10'),
        auto_renew: true,
        status: 'active'
      }
    ];

    // Thêm dữ liệu vào database
    await Membership.insertMany(memberships);
    console.log('Đã thêm 5 gói tập của hội viên mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Membership:', error);
  }
};

export default seedMemberships;