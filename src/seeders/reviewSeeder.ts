import Review from '../models/Review';
import Member from '../models/Member';
import Trainer from '../models/Trainer';
import Package from '../models/Package';

const seedReviews = async () => {
  try {
    // Xóa dữ liệu cũ
    await Review.deleteMany({});
    console.log('Đã xóa dữ liệu Reviews cũ');

    // Lấy IDs từ các bảng liên quan
    const members = await Member.find().limit(5);
    const trainers = await Trainer.find().limit(5);
    const packages = await Package.find().limit(5);

    if (members.length === 0 || trainers.length === 0 || packages.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members, Trainers hoặc Packages. Hãy chạy các seeders liên quan trước.');
    }

    // Dữ liệu đánh giá mẫu
    const reviews = [
      {
        member_id: members[0]._id,
        trainer_id: trainers[0]._id,
        package_id: null,
        rating: 5,
        comment: 'HLV rất nhiệt tình và chuyên nghiệp. Tôi đạt được mục tiêu giảm cân sau 1 tháng tập luyện.',
        is_approved: true,
        created_at: new Date('2024-02-15')
      },
      {
        member_id: members[1]._id,
        trainer_id: null,
        package_id: packages[0]._id,
        rating: 4,
        comment: 'Gói tập cơ bản có giá trị tốt, đủ các thiết bị cần thiết. Chỉ thiếu một số máy tập chuyên sâu.',
        is_approved: true,
        created_at: new Date('2024-02-20')
      },
      {
        member_id: members[2]._id,
        trainer_id: trainers[1]._id,
        package_id: null,
        rating: 5,
        comment: 'HLV Yoga tuyệt vời, rất kiên nhẫn hướng dẫn kỹ thuật. Sức khỏe tinh thần của tôi cải thiện rõ rệt.',
        is_approved: true,
        created_at: new Date('2024-02-25')
      },
      {
        member_id: members[3]._id,
        trainer_id: null,
        package_id: packages[2]._id,
        rating: 5,
        comment: 'Gói Premium đáng đồng tiền. Đặc biệt là dịch vụ massage thư giãn rất chất lượng.',
        is_approved: true,
        created_at: new Date('2024-03-01')
      },
      {
        member_id: members[4]._id,
        trainer_id: trainers[2]._id,
        package_id: packages[1]._id,
        rating: 4,
        comment: 'HLV cardio giúp tôi cải thiện sức bền đáng kể. Gói tập Standard cũng rất phù hợp với nhu cầu của tôi.',
        is_approved: false, // Chưa được phê duyệt
        created_at: new Date('2024-03-05')
      }
    ];

    // Thêm dữ liệu vào database
    await Review.insertMany(reviews);
    console.log('Đã thêm 5 đánh giá mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu Review:', error);
  }
};

export default seedReviews;