import FAQ from '../models/FAQ';

const seedFAQs = async () => {
  try {
    // Xóa dữ liệu cũ
    await FAQ.deleteMany({});
    console.log('Đã xóa dữ liệu FAQs cũ');

    // Dữ liệu câu hỏi thường gặp mẫu
    const faqs = [
      {
        question: 'Phòng tập mở cửa và đóng cửa vào những giờ nào?',
        answer: 'Phòng tập mở cửa từ 6:00 sáng đến 22:00 tối từ thứ Hai đến thứ Bảy, và từ 8:00 sáng đến 20:00 tối vào Chủ nhật và ngày lễ.',
        category: 'Thông tin chung',
        created_at: new Date('2024-01-10')
      },
      {
        question: 'Làm thế nào để đăng ký thành viên?',
        answer: 'Bạn có thể đăng ký thành viên trực tiếp tại quầy lễ tân của phòng tập hoặc đăng ký online thông qua website của chúng tôi. Bạn sẽ cần cung cấp CMND/CCCD, điền đầy đủ thông tin cá nhân và chọn gói tập phù hợp.',
        category: 'Đăng ký & Thành viên',
        created_at: new Date('2024-01-15')
      },
      {
        question: 'Các phương thức thanh toán được chấp nhận?',
        answer: 'Chúng tôi chấp nhận thanh toán bằng tiền mặt, thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng và các ví điện tử như MoMo, ZaloPay. Đối với thanh toán online, bạn sẽ nhận được email xác nhận sau khi thanh toán thành công.',
        category: 'Thanh toán',
        created_at: new Date('2024-01-20')
      },
      {
        question: 'Làm thế nào để đặt lịch với huấn luyện viên cá nhân?',
        answer: 'Bạn có thể đặt lịch với huấn luyện viên cá nhân thông qua ứng dụng di động của chúng tôi, website hoặc trực tiếp tại quầy lễ tân. Chúng tôi khuyến nghị đặt lịch trước ít nhất 24 giờ để đảm bảo thời gian bạn mong muốn còn trống.',
        category: 'Lịch tập & Huấn luyện viên',
        created_at: new Date('2024-02-05')
      },
      {
        question: 'Chính sách hoàn tiền và hủy gói tập như thế nào?',
        answer: 'Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày đăng ký nếu chưa sử dụng dịch vụ. Đối với việc hủy gói tập đang sử dụng, chúng tôi sẽ hoàn lại phần tiền tương ứng với thời gian còn lại sau khi trừ phí hủy (10% giá trị còn lại). Các trường hợp đặc biệt như bệnh lý có xác nhận của bác sĩ sẽ được xem xét miễn phí hủy.',
        category: 'Thanh toán',
        created_at: new Date('2024-02-15')
      }
    ];

    // Thêm dữ liệu vào database
    await FAQ.insertMany(faqs);
    console.log('Đã thêm 5 câu hỏi thường gặp mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu FAQ:', error);
  }
};

export default seedFAQs;