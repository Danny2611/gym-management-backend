import Package from '../models/Package';

const seedPackages = async () => {
  try {
    // Xóa dữ liệu cũ
    await Package.deleteMany({});
    console.log('Đã xóa dữ liệu Packages cũ');

    // Dữ liệu gói tập
    const packages = [
      {
        name: 'Gói Cơ Bản',
        max_members: 150,
        price: 1290000,
        duration: 30,
        description: 'Phù hợp cho người mới bắt đầu tập luyện, bao gồm các trang thiết bị cơ bản.',
        benefits: [
          'Sử dụng tất cả trang thiết bị cơ bản',
          'Tư vấn dinh dưỡng cơ bản',
          'Giờ tập: 8:00 - 22:00 các ngày trong tuần',
          'Hỗ trợ kỹ thuật cơ bản'
        ],
        status: 'active',
        category: 'basic',
        training_sessions: 0,
        session_duration: 0,
        created_at: new Date()
      },
      {
        name: 'Gói Premium',
        max_members: 100,
        price: 2490000,
        duration: 60,
        description: 'Gói tập nâng cao với các đặc quyền bổ sung, phù hợp cho người đã có kinh nghiệm tập luyện.',
        benefits: [
          'Sử dụng tất cả trang thiết bị',
          '2 buổi tập cùng PT mỗi tháng', 
          'Đánh giá thể chất định kỳ',
          'Tư vấn dinh dưỡng cá nhân hóa',
          'Giờ tập: 6:00 - 24:00 các ngày trong tuần'
        ],
        status: 'active',
        category: 'premium',
        popular: true,
        training_sessions: 2,
        session_duration: 60,
        created_at: new Date()
      },
      {
        name: 'Gói Platinum',
        max_members: 60,
        price: 3990000,
        duration: 90,
        description: 'Gói tập cao cấp với đầy đủ dịch vụ VIP, phù hợp cho người muốn đạt hiệu quả tập luyện cao.',
        benefits: [
          'Sử dụng tất cả trang thiết bị và khu vực VIP',
          '4 buổi tập cùng PT mỗi tháng',
          'Đánh giá thể chất hàng tuần', 
          'Kế hoạch dinh dưỡng cá nhân hóa',
          'Ưu tiên đặt lịch PT',
          'Sử dụng spa (1 lần/tháng)',
          'Giờ tập: 24/7'
        ],
        status: 'active',
        category: 'platinum',
        training_sessions: 4,
        session_duration: 60,
        created_at: new Date()
      },
      {
        name: 'Gói VIP',
        max_members: 30,
        price: 5990000,
        duration: 180,
        description: 'Gói tập đẳng cấp nhất dành cho người tập chuyên nghiệp hoặc muốn dịch vụ tốt nhất.',
        benefits: [
          'Sử dụng tất cả trang thiết bị và khu vực VIP độc quyền',
          '8 buổi tập cùng PT cao cấp mỗi tháng',
          'Đánh giá thể chất chuyên sâu hàng tuần',
          'Kế hoạch dinh dưỡng và tập luyện cá nhân hóa toàn diện',
          'Ưu tiên cao nhất khi đặt lịch tập',
          'Dịch vụ spa cao cấp (2 lần/tháng)',
          'Chế độ dinh dưỡng đặc biệt (1 bữa/ngày)',
          'Giờ tập: 24/7 với hỗ trợ riêng'
        ],
        status: 'active',
        category: 'vip',
        training_sessions: 8,
        session_duration: 75,
        created_at: new Date()
      },
      
      {
        name: 'Gói Fitness',
        max_members: 90,
        price: 1490000,
        duration: 60,
        description: 'Tập trung vào các bài tập cardio và giảm cân, phù hợp cho người muốn cải thiện sức khỏe tim mạch.',
        benefits: [
          'Sử dụng tất cả trang thiết bị cardio',
          'Tham gia các lớp học nhóm cardio không giới hạn',
          'Đánh giá đốt calo hàng tuần',
          'Tư vấn kế hoạch giảm cân',
          'Giờ tập: 6:00 - 23:00 các ngày trong tuần'
        ],
        status: 'active',
        category: 'fitness',
        training_sessions: 3,
        session_duration: 60,
        created_at: new Date('2024-02-15')
      },
      
    ];

    // Thêm dữ liệu vào database
    await Package.insertMany(packages);
    console.log('Đã thêm 5 gói tập mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Package:', error);
  }
};

export default seedPackages;
