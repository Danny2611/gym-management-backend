import Trainer from '../models/Trainer';
import Role from '../models/Role';

const seedTrainers = async () => {
  try {
    // Xóa dữ liệu cũ
    await Trainer.deleteMany({});
    console.log('Đã xóa dữ liệu Trainers cũ');

    // Lấy role ID
    const trainerRole = await Role.findOne({ name: 'Trainer' });
    if (!trainerRole) {
      throw new Error('Vai trò Trainer không tồn tại. Hãy chạy roleSeeder trước.');
    }

    // Dữ liệu huấn luyện viên mẫu với lịch làm việc
    const trainers = [
      {
        name: 'Đặng Minh Anh',
        image: '/uploads/trainers/trainer1.jpg',
        bio: 'Chuyên gia thể hình với hơn 8 năm kinh nghiệm. Từng tham gia nhiều cuộc thi thể hình quốc gia.',
        specialization: 'Thể hình, Giảm cân',
        experience: 8,
        phone: '0976543210',
        email: 'dangminhanh@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' },
              { start: '14:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' },
              { start: '14:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' },
              { start: '14:00', end: '20:00' },
            ]
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' },
              { start: '14:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' },
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '09:00', end: '15:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: false,
            workingHours: []
          }
        ],
        created_at: new Date('2022-06-10')
      },
      {
        name: 'Lý Thanh Bình',
        image: '/uploads/trainers/trainer2.jpg',
        bio: 'HLV Yoga và Pilates với chứng chỉ quốc tế. Chuyên về các bài tập tăng cường sức khỏe tinh thần và thể chất.',
        specialization: 'Yoga, Pilates',
        experience: 6,
        phone: '0987654321',
        email: 'lythanhbinh@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '16:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '16:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '16:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '16:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: true,
            workingHours: [
              { start: '08:00', end: '12:00' }
            ]
          }
        ],
        created_at: new Date('2022-08-15')
      },
      {
        name: 'Trần Công Danh',
        image: '/uploads/trainers/trainer3.jpg',
        bio: 'Cựu vận động viên điền kinh, chuyên về các bài tập cardio và sức bền. Giúp nhiều khách hàng đạt được mục tiêu giảm cân hiệu quả.',
        specialization: 'Cardio, Sức bền',
        experience: 5,
        phone: '0965432109',
        email: 'trancongdanh@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: true,
            workingHours: [
              { start: '10:00', end: '14:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '10:00', end: '14:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: true,
            workingHours: [
              { start: '10:00', end: '14:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '10:00', end: '14:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '10:00', end: '16:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: false,
            workingHours: []
          }
        ],
        created_at: new Date('2022-10-20')
      },
      {
        name: 'Nguyễn Thị Evy',
        image: '/uploads/trainers/trainer4.jpg',
        bio: 'Chuyên gia dinh dưỡng kiêm HLV thể hình. Sở hữu nhiều chứng chỉ dinh dưỡng quốc tế.',
        specialization: 'Dinh dưỡng, Tập luyện phục hồi',
        experience: 7,
        phone: '0954321098',
        email: 'nguyenthievy@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '09:00', end: '13:00' },
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: true,
            workingHours: [
              { start: '09:00', end: '13:00' },
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: true,
            workingHours: [
              { start: '09:00', end: '13:00' },
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '09:00', end: '13:00' },
              { start: '14:00', end: '18:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '09:00', end: '13:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: false,
            workingHours: []
          }
        ],
        created_at: new Date('2022-12-05')
      },
      {
        name: 'Phan Gia Huy',
        image: '/uploads/trainers/trainer5.jpg',
        bio: 'HLV chuyên về võ thuật tổng hợp và tự vệ. Từng đoạt huy chương vàng võ thuật Đông Nam Á.',
        specialization: 'MMA, Tự vệ',
        experience: 9,
        phone: '0943210987',
        email: 'phangiahuy@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: true,
            workingHours: [
              { start: '12:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '12:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: true,
            workingHours: [
              { start: '12:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '14:00', end: '22:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '14:00', end: '20:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: false,
            workingHours: []
          }
        ],
        created_at: new Date('2023-02-15')
      },
      {
        name: 'Trần Mai Linh',
        image: '/uploads/trainers/trainer6.jpg',
        bio: 'Chuyên gia về các bài tập Yoga và Mindfulness, giúp nhiều học viên giảm stress và cải thiện sức khỏe tinh thần.',
        specialization: 'Yoga, Mindfulness, Thiền',
        experience: 7,
        phone: '0932109876',
        email: 'tranmailinh@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '17:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '17:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '17:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '06:00', end: '10:00' },
              { start: '17:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '07:00', end: '12:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: true,
            workingHours: [
              { start: '07:00', end: '12:00' }
            ]
          }
        ],
        created_at: new Date('2023-04-10')
      },
      {
        name: 'Nguyễn Đức Nam',
        image: '/uploads/trainers/trainer7.jpg',
        bio: 'Huấn luyện viên chuyên về các bài tập Fitness và Cardio. Có kinh nghiệm trong việc giúp khách hàng cải thiện sức khỏe tim mạch.',
        specialization: 'Cardio, Fitness, Giảm cân',
        experience: 6,
        phone: '0921098765',
        email: 'nguyenducnam@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: true,
            workingHours: [
              { start: '07:00', end: '12:00' },
              { start: '16:00', end: '22:00' }
            ]
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '07:00', end: '12:00' },
              { start: '16:00', end: '22:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: true,
            workingHours: [
              { start: '07:00', end: '12:00' },
              { start: '16:00', end: '22:00' }
            ]
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '07:00', end: '12:00' },
              { start: '16:00', end: '22:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '08:00', end: '14:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: false,
            workingHours: []
          }
        ],
        created_at: new Date('2023-05-20')
      },
      {
        name: 'Lê Anh Tuấn',
        image: '/uploads/trainers/trainer8.jpg',
        bio: 'Chuyên gia về luyện tập sức mạnh và phát triển cơ bắp. Có nhiều năm kinh nghiệm trong việc hướng dẫn các bài tập nâng cao.',
        specialization: 'Thể hình, Sức mạnh, Phát triển cơ bắp',
        experience: 10,
        phone: '0910987654',
        email: 'leanhtuan@example.com',
        role: trainerRole._id,
        schedule: [
          {
            dayOfWeek: 1, // Thứ Hai
            available: false,
            workingHours: []
          },
          {
            dayOfWeek: 2, // Thứ Ba
            available: true,
            workingHours: [
              { start: '08:00', end: '13:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 3, // Thứ Tư
            available: true,
            workingHours: [
              { start: '08:00', end: '13:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 4, // Thứ Năm
            available: true,
            workingHours: [
              { start: '08:00', end: '13:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 5, // Thứ Sáu
            available: true,
            workingHours: [
              { start: '08:00', end: '13:00' },
              { start: '15:00', end: '21:00' }
            ]
          },
          {
            dayOfWeek: 6, // Thứ Bảy
            available: true,
            workingHours: [
              { start: '09:00', end: '15:00' }
            ]
          },
          {
            dayOfWeek: 0, // Chủ Nhật
            available: true,
            workingHours: [
              { start: '09:00', end: '13:00' }
            ]
          }
        ],
        created_at: new Date('2023-06-15')
      }
    ];

    // Thêm dữ liệu vào database
    await Trainer.insertMany(trainers);
    console.log('Đã thêm 8 huấn luyện viên mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Trainer:', error);
  }
};

export default seedTrainers;