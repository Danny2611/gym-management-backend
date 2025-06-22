import { Types } from 'mongoose';
import Membership from '../models/Membership';
import Member from '../models/Member';
import cron from 'node-cron';
import { MembershipDetailsResponse } from '~/types/membership';

//user

//Lấy thông tin chi tiết của hội viên và gói tập có giá cao nhất
const getMembershipDetails = async (
   memberId: string,
): Promise<MembershipDetailsResponse> => {
  try {
    // Convert string ID to ObjectId if needed
    const memberObjectId = typeof memberId === 'string'
      ? new Types.ObjectId(memberId)
      : memberId;

    // Lấy thông tin hội viên
    const member = await Member.findById(memberObjectId)
      .select('name avatar')
      .lean();

    if (!member) {
      throw new Error('Không tìm thấy hội viên');
    }

    // Lấy tất cả các gói tập active của hội viên
    let memberships = await Membership.find({
      member_id: memberObjectId,
      status: { $in: ['active', 'expired'] }
    })
      .populate({
        path: 'package_id',
        select: 'name price category training_sessions',
      })
      .lean();


    // Nếu không có gói tập active, tìm gói tập expired
    if (!memberships || memberships.length === 0) {
      memberships = await Membership.find({
        member_id: memberObjectId,
        status: 'expired',
      })
        .populate({
          path: 'package_id',
          select: 'name price category training_sessions',
        })
        .lean();
    }

    // Nếu không có gói tập active hoặc expired nào
    if (!memberships || memberships.length === 0) {
      // Trả về thông tin cơ bản nếu không có gói tập nào
      return {
        membership_id: 'null', 
        member_name: member.name,
        member_avatar: member.avatar || '/placeholder-avatar.jpg',
        package_id: '',
        package_name: 'Chưa đăng ký',
        package_category: 'basic',
         status: 'null',
        days_remaining: 0,
        sessions_remaining: 0,
        total_sessions: 0,
      };
    }

     // Tìm gói tập active trước, nếu không có thì tìm gói tập expired
    let selectedMembership = memberships.find(m => m.status === 'active');
    // Nếu không có gói active, tìm gói expired
    if (!selectedMembership) {
      selectedMembership = memberships.find(m => m.status === 'expired');
    }
     if (!selectedMembership) {
      selectedMembership = memberships[0];
    }
    // Tìm gói tập có giá cao nhất
    const highestPriceMembership = memberships.reduce((highest, current) => {
      const currentPrice = (current.package_id as any)?.price || 0;
      const highestPrice = (highest.package_id as any)?.price || 0;
      return currentPrice > highestPrice ? current : highest;
    }, memberships[0]);

    // Tính số ngày còn lại
    let daysRemaining = 0;
    
    if (highestPriceMembership.end_date) {
      const today = new Date();
      const endDate = new Date(highestPriceMembership.end_date);
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Tính số buổi tập còn lại
    const sessionsRemaining = highestPriceMembership.available_sessions - highestPriceMembership.used_sessions;
    const totalSessions = highestPriceMembership.available_sessions;

    // Lấy thông tin gói tập
    const packageInfo = highestPriceMembership.package_id as any;

    return {
       membership_id: selectedMembership._id.toString(),
      member_name: member.name,
      member_avatar: member.avatar || '/placeholder-avatar.jpg',
      package_id: packageInfo?._id?.toString() || '',
      package_name: packageInfo?.name || 'Không có thông tin',
      package_category: packageInfo?.category || 'basic',
      days_remaining: daysRemaining,
      sessions_remaining: sessionsRemaining,
      total_sessions: totalSessions,
      status: selectedMembership.status || 'unknown'
    };
  } catch (error) {
    console.error('Error fetching membership details:', error);
    throw new Error('Không thể lấy thông tin hội viên');
  }
};

//Tự động cập nhật các gói membership hết hạn
export async function updateExpiredMemberships(): Promise<void> {
  try {
    const today = new Date();
    
    // Tìm các membership có end_date đã qua mà vẫn có status là active
    const result = await Membership.updateMany(
      {
        status: 'active',
        end_date: { $lt: today }
      },
      {
        $set: { 
          status: 'expired', 
          updated_at: new Date()
        }
      }
    );
    
    console.log(`Đã cập nhật ${result.modifiedCount} membership hết hạn.`);
  } catch (error) {
    console.error('Lỗi khi cập nhật membership hết hạn:', error);
  }
}

//Reset các membership hết hạn về trạng thái null
export async function resetExpiredMemberships(): Promise<void> {
  try {
    const today = new Date();
    
    // Tìm các membership có end_date đã qua mà vẫn có status là active
    const result = await Membership.updateMany(
      {
        status: 'expired',
        end_date: { $lt: today }
      },
      {
        $set: { 
          start_date: null,
          end_date: null,
          available_sessions: 0,
          used_sessions: 0,
          last_sessions_reset: null,
          updated_at: new Date()
        }
      }
    );
    
    console.log(`Đã reset ${result.modifiedCount} membership hết hạn.`);
  } catch (error) {
    console.error('Lỗi khi reset membership hết hạn:', error);
  }
}


//Khởi tạo các công việc được lập lịch cho membership
// export function initScheduledMembershipJobs(): void {
//   // Chạy hàng ngày lúc 00:10
//   cron.schedule('10 0 * * *', async () => {
//     console.log('Running scheduled job: Update expired memberships');
//     await updateExpiredMemberships();
//     // Bỏ comment dòng dưới nếu muốn reset các giá trị của membership hết hạn
//     // await resetExpiredMemberships();
//   });
// }

export async function initScheduledMembershipJobs(): Promise<void> {
  try {
    // Chạy ngay khi app khởi động
    console.log('🔁 Kiểm tra và cập nhật membership hết hạn khi khởi động app...');
    await updateExpiredMemberships();

    // Lên lịch chạy hàng ngày lúc 00:10
    cron.schedule('10 0 * * *', async () => {
      console.log('⏰ Running scheduled job: Update expired memberships');
      await updateExpiredMemberships();
      // await resetExpiredMemberships(); // Nếu cần reset thêm
    });

    console.log('✅ Lên lịch thành công cho job cập nhật membership.');
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo job cập nhật membership:', error);
  }
}
//=========================================================
//admin




export default {
  getMembershipDetails,
   updateExpiredMemberships,
  resetExpiredMemberships,
  initScheduledMembershipJobs
};