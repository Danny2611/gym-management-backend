import PackageDetail from '../models/PackageDetail';
import Package from '../models/Package';

const seedPackageDetails = async () => {
  try {
    // Xóa dữ liệu cũ
    await PackageDetail.deleteMany({});
    console.log('Đã xóa dữ liệu PackageDetails cũ');

    // Lấy danh sách packages để lấy ID
    const packages = await Package.find();

    // Dữ liệu chi tiết cho từng gói
    const packageDetails = [
      {
        package_id: packages.find(p => p.name === 'Gói Cơ Bản')?._id,
        schedule: [
          "Giờ tập: 8:00 - 22:00 các ngày trong tuần",
          "Đăng ký và bắt đầu tập tại quầy lễ tân",
          "Thời gian tập tối đa 2 giờ mỗi lần"
        ],
        training_areas: [
          "Khu vực tập tạ cơ bản",
          "Phòng tập cardio",
          "Khu vực máy tập"
        ],
        additional_services: [
          "Tủ đồ chung",
          "Phòng thay đồ",
          "Nước uống miễn phí",
          "Wifi miễn phí"
        ],
        status: 'active',
        created_at: new Date()
      },
      {
        package_id: packages.find(p => p.name === 'Gói Premium')?._id,
        schedule: [
          "Giờ tập: 6:00 - 24:00 các ngày trong tuần",
          "Đăng ký và bắt đầu tập ngay khi đến",
          "Không giới hạn thời gian tập mỗi lần"
        ],
        training_areas: [
          "Khu vực tập tạ nâng cao",
          "Phòng tập cardio",
          "Khu vực máy tập chuyên dụng"
        ],
        additional_services: [
          "Tủ đồ cá nhân",
          "Phòng thay đồ hiện đại",
          "Nước uống và khăn miễn phí",
          "Wifi tốc độ cao",
          "Chỗ đỗ xe rộng rãi",
          "Đánh giá thể chất định kỳ"
        ],
        status: 'active',
        created_at: new Date()
      },
      {
        package_id: packages.find(p => p.name === 'Gói Platinum')?._id,
        schedule: [
          "Giờ tập: 24/7",
          "Ưu tiên đặt lịch PT",
          "Không giới hạn thời gian tập"
        ],
        training_areas: [
          "Khu vực tập tạ VIP",
          "Phòng tập cardio cao cấp",
          "Khu vực máy tập chuyên sâu",
          "Khu vực VIP đặc biệt",
          "Khu vực spa"
        ],
        additional_services: [
          "Tủ đồ VIP riêng",
          "Phòng thay đồ cao cấp",
          "Nước uống cao cấp và khăn tập",
          "Wifi tốc độ cao",
          "Chỗ đỗ xe VIP",
          "Dịch vụ spa",
          "Máy đo chỉ số cơ thể chuyên sâu"
        ],
        status: 'active',
        created_at: new Date()
      },
      {
        package_id: packages.find(p => p.name === 'Gói VIP')?._id,
        schedule: [
          "Giờ tập: 24/7",
          "Đặt lịch PT ưu tiên tuyệt đối",
          "Không giới hạn thời gian tập",
          "Hỗ trợ PT 24/7"
        ],
        training_areas: [
          "Khu vực tập tạ VIP độc quyền",
          "Phòng tập cardio cao cấp",
          "Khu vực máy tập chuyên nghiệp",
          "Khu vực VIP độc quyền",
          "Khu vực spa cao cấp",
          "Phòng hồi phục riêng"
        ],
        additional_services: [
          "Tủ đồ VIP cá nhân khóa sinh trắc học",
          "Phòng thay đồ và tắm riêng",
          "Đồ uống dinh dưỡng và khăn tập cao cấp",
          "Wifi tốc độ cao",
          "Bãi đỗ xe riêng",
          "Dịch vụ spa cao cấp",
          "Dịch vụ giặt là trang phục tập",
          "Đánh giá thể chất chuyên sâu hàng tuần",
          "Suất ăn dinh dưỡng mỗi ngày",
          "Phòng hồi phục riêng sau tập"
        ],
        status: 'active',
        created_at: new Date()
      },
      
    
      {
        package_id: packages.find(p => p.name === 'Gói Fitness')?._id,
        schedule: [
          "Giờ tập: 6:00 - 23:00 các ngày trong tuần",
          "Đăng ký lớp học cardio",
          "Theo dõi tiến trình giảm cân"
        ],
        training_areas: [
          "Khu vực cardio",
          "Phòng tập nhóm cardio",
          "Khu vực theo dõi chỉ số"
        ],
        additional_services: [
          "Tủ đồ chung",
          "Phòng thay đồ",
          "Nước uống miễn phí",
          "Wifi miễn phí",
          "Máy đo chỉ số cơ thể"
        ],
        status: 'active',
        created_at: new Date('2024-02-15')
      },
    
    ];

    // Thêm dữ liệu vào database
    await PackageDetail.insertMany(packageDetails);
    console.log('Đã thêm 5 chi tiết gói tập mẫu thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu PackageDetail:', error);
  }
};

export default seedPackageDetails;