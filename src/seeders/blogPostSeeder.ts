import mongoose from 'mongoose';
import { BlogPost } from '../models/BlogPost';
import { BlogCategory } from '../models/BlogCategory';
import Trainer from '../models/Trainer';
import { generateSlug } from '../utils/slugUtils';

const seedBlogPosts = async () => {
  try {
    // Tìm category "Gym News"
    const gymNewsCategory = await BlogCategory.findOne({ slug: 'gym-news' });
    if (!gymNewsCategory) throw new Error('Không tìm thấy category "Gym News"');

    // Tìm huấn luyện viên "Trần Công Danh"
    const trainer = await Trainer.findOne({ email: 'trancongdanh@example.com' });
    if (!trainer) throw new Error('Không tìm thấy trainer Trần Công Danh');


    const blogPosts = [
      
       {
        title: 'Yoga Nidra: Giải Pháp Mới Cho Phục Hồi Sau Tập Luyện Cường Độ Cao',
        excerpt: 'Phương pháp Yoga Nidra đang được các vận động viên chuyên nghiệp áp dụng như một công cụ phục hồi hiệu quả sau những buổi tập cường độ cao.',
        content: `<p>Trong những năm gần đây, Yoga Nidra - còn gọi là "giấc ngủ yoga" - đang trở thành một phương pháp phục hồi được ưa chuộng trong giới thể thao chuyên nghiệp. Không chỉ giới hạn trong cộng đồng yoga truyền thống, nhiều vận động viên từ các môn thể thao cường độ cao như CrossFit, powerlifting và các môn thể thao đồng đội đang áp dụng kỹ thuật này để tăng cường khả năng phục hồi.</p>

<h3>Yoga Nidra là gì?</h3>
<p>Yoga Nidra là một hình thức thiền định có hướng dẫn, trong đó người tham gia nằm hoàn toàn tĩnh lặng trong khi một giáo viên hoặc bản ghi âm hướng dẫn họ qua một loạt các kỹ thuật thư giãn sâu. Mặc dù được gọi là "giấc ngủ yoga", người tham gia thực sự ở trong trạng thái giữa thức và ngủ - một trạng thái tỉnh táo sâu sắc nhưng hoàn toàn thư giãn.</p>

<p>Một buổi Yoga Nidra điển hình bao gồm:</p>
<ul>
  <li>Thiết lập một ý định hoặc "sankalpa"</li>
  <li>Quét cơ thể có ý thức (body scanning)</li>
  <li>Nhận thức về hơi thở</li>
  <li>Nhận thức về cảm giác đối lập (nóng/lạnh, nặng/nhẹ)</li>
  <li>Hình dung có hướng dẫn</li>
  <li>Trở về trạng thái tỉnh táo hoàn toàn</li>
</ul>

<h3>Lợi ích cho vận động viên</h3>
<p>Nghiên cứu được công bố trên International Journal of Sports Physical Therapy vào tháng 2/2024 đã theo dõi 45 vận động viên chuyên nghiệp áp dụng Yoga Nidra như một phần của quy trình phục hồi trong 8 tuần. Kết quả cho thấy những lợi ích đáng kể:</p>

<ul>
  <li><strong>Phục hồi cơ nhanh hơn:</strong> Giảm 27% thời gian phục hồi sau tập luyện cường độ cao</li>
  <li><strong>Cải thiện chất lượng giấc ngủ:</strong> Tăng 23% thời gian ngủ sâu được đo bằng thiết bị theo dõi giấc ngủ</li>
  <li><strong>Giảm căng thẳng:</strong> Giảm 31% mức cortisol (hormone stress) trong máu</li>
  <li><strong>Tăng cường tập trung:</strong> Cải thiện 18% khả năng tập trung trong các bài kiểm tra nhận thức</li>
  <li><strong>Giảm nguy cơ chấn thương:</strong> Nhóm sử dụng Yoga Nidra báo cáo ít chấn thương hơn 24% so với nhóm đối chứng</li>
</ul>

<h3>Các vận động viên hàng đầu đang sử dụng Yoga Nidra</h3>
<p>Nhiều vận động viên tinh hoa đã tích hợp Yoga Nidra vào chế độ tập luyện của họ:</p>

<p>LeBron James, siêu sao bóng rổ NBA, đã chia sẻ rằng anh thực hành Yoga Nidra 3-4 lần mỗi tuần như một phần của quy trình phục hồi. "Tôi nhận thấy sự khác biệt rõ rệt trong khả năng phục hồi của mình giữa các trận đấu," James chia sẻ trong một cuộc phỏng vấn gần đây.</p>

<p>Tia-Clair Toomey, vô địch CrossFit Games 5 lần liên tiếp, cũng là người ủng hộ mạnh mẽ của phương pháp này: "Yoga Nidra đã thay đổi cách tôi tiếp cận việc phục hồi. 20 phút thực hành Yoga Nidra cho tôi cảm giác như đã ngủ sâu 2 giờ."</p>

<h3>Làm thế nào để tích hợp Yoga Nidra vào lịch trình tập luyện</h3>
<p>Các chuyên gia khuyến nghị các cách sau để đưa Yoga Nidra vào chế độ tập luyện của bạn:</p>

<ul>
  <li><strong>Thời điểm lý tưởng:</strong> Thực hành 15-30 phút ngay sau buổi tập cường độ cao hoặc trước khi đi ngủ</li>
  <li><strong>Tần suất:</strong> 3-4 lần mỗi tuần để có kết quả tối ưu</li>
  <li><strong>Tài nguyên:</strong> Các ứng dụng như Insight Timer, Calm và Headspace cung cấp hướng dẫn Yoga Nidra chất lượng cao</li>
  <li><strong>Kết hợp:</strong> Kết hợp với các phương pháp phục hồi khác như ngâm nước đá, liệu pháp nén và dinh dưỡng tối ưu</li>
</ul>

<p>Tiến sĩ Sarah Matthews, nhà nghiên cứu về y học thể thao tại Đại học Stanford, giải thích: "Yoga Nidra tác động đến hệ thần kinh phó giao cảm, kích hoạt phản ứng 'rest-and-digest' thay vì 'fight-or-flight'. Điều này đặc biệt quan trọng đối với vận động viên, những người thường xuyên trong trạng thái căng thẳng cao do cường độ tập luyện và áp lực cạnh tranh."</p>

<p>Khi các vận động viên tiếp tục tìm kiếm lợi thế cạnh tranh, Yoga Nidra đang nổi lên như một công cụ phục hồi mạnh mẽ mà không đòi hỏi thiết bị đặc biệt hoặc chi phí cao. Cho dù bạn là vận động viên chuyên nghiệp hay người tập gym thông thường, việc tích hợp kỹ thuật cổ xưa này vào thói quen hiện đại có thể mang lại lợi ích đáng kể cho hiệu suất và sức khỏe tổng thể của bạn.</p>`,
        slug: generateSlug('Yoga Nidra: Giải Pháp Mới Cho Phục Hồi Sau Tập Luyện Cường Độ Cao'),
        coverImage: '/images/blog/gymnews4.jpg',
        publishDate: new Date('2024-02-20'),
        readTime: 9,
        category: gymNewsCategory._id,
        author: trainer._id,
        tags: ['yoga', 'wellness', 'fitness'],
      },
     
    ]

    for (const post of blogPosts) {
      const blogPost = new BlogPost(post);
      await blogPost.save();
    }

    console.log('Đã thêm 3 bài viết blog liên quan tới "Gym news" thành công.');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu BlogPost:', error);
  }
};

export default seedBlogPosts;
