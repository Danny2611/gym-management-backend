import SuccessStory from '../models/SuccessStory';
import Member from '../models/Member';

const seedSuccessStories = async () => {
  try {
    // Xóa dữ liệu cũ
    await SuccessStory.deleteMany({});
    console.log('Đã xóa dữ liệu SuccessStories cũ');

    // Lấy IDs từ bảng Member
    const members = await Member.find().limit(5);

    if (members.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Members. Hãy chạy memberSeeder trước.');
    }

    // Dữ liệu câu chuyện thành công mẫu
    const successStories = [
      {
        user_id: members[0]._id,
        title: 'Giảm 15kg trong 6 tháng',
        story: 'Tôi đã từng nặng 90kg và gặp nhiều vấn đề sức khỏe như cao huyết áp, mỡ máu cao. Sau 6 tháng tập luyện nghiêm túc tại phòng gym với sự hỗ trợ của HLV, tôi đã giảm được 15kg và cải thiện đáng kể các chỉ số sức khỏe. Tôi cảm thấy trẻ trung và năng động hơn rất nhiều.',
        image: '/uploads/success-stories/story1.jpg',
        is_published: true,
        created_at: new Date('2024-01-20')
      },
      {
        user_id: members[1]._id,
        title: 'Thoát khỏi đau lưng mãn tính',
        story: 'Tôi đã bị đau lưng mãn tính trong nhiều năm do công việc văn phòng. Bác sĩ khuyên tôi nên tập luyện để tăng cường cơ lưng. Sau 3 tháng tập Yoga và các bài tập cơ lõi tại đây, tình trạng đau lưng của tôi đã cải thiện đáng kể, giờ tôi có thể làm việc hiệu quả mà không cần đến thuốc giảm đau.',
        image: '/uploads/success-stories/story2.jpg',
        is_published: true,
        created_at: new Date('2024-02-05')
      },
      {
        user_id: members[2]._id,
        title: 'Từ gầy yếu đến khỏe mạnh',
        story: 'Trước đây tôi chỉ nặng 50kg với chiều cao 1m75, rất tự ti về vóc dáng. Sau 1 năm tập luyện kết hợp với chế độ dinh dưỡng được HLV tư vấn, tôi đã tăng 15kg cơ nạc, cải thiện sức mạnh và sự tự tin. Giờ đây tôi có thể tự hào về vóc dáng của mình.',
        image: '/uploads/success-stories/story3.jpg',
        is_published: true,
        created_at: new Date('2024-02-15')
      },
      {
        user_id: members[3]._id,
        title: 'Vượt qua trầm cảm nhờ tập luyện',
        story: 'Sau khi sinh con, tôi rơi vào trạng thái trầm cảm sau sinh nghiêm trọng. Bác sĩ khuyên tôi nên tập thể dục đều đặn. Tôi đã đăng ký tập tại phòng gym và tham gia các lớp Zumba. Sau 6 tháng, tình trạng trầm cảm của tôi đã cải thiện đáng kể, tôi cảm thấy vui vẻ và năng động hơn rất nhiều.',
        image: '/uploads/success-stories/story4.jpg',
        is_published: false, // Chưa được phê duyệt
        created_at: new Date('2024-02-25')
      },
      {
        user_id: members[4]._id,
        title: 'Chinh phục marathon ở tuổi 45',
        story: 'Ở tuổi 45, tôi từng nghĩ rằng việc chạy marathon là không thể. Nhưng với sự hướng dẫn của HLV tại phòng gym, tôi đã luyện tập chạy bộ một cách khoa học. Sau 8 tháng chuẩn bị, tôi đã hoàn thành cuộc thi marathon đầu tiên trong đời với thời gian 4 giờ 15 phút. Đây là minh chứng cho việc không bao giờ là quá muộn để bắt đầu.',
        image: '/uploads/success-stories/story5.jpg',
        is_published: true,
        created_at: new Date('2024-03-05')
      }
    ];

    // Thêm dữ liệu vào database
    await SuccessStory.insertMany(successStories);
    console.log('Đã thêm 5 câu chuyện thành công mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu SuccessStory:', error);
  }
};

export default seedSuccessStories;