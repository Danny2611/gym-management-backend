//services/notificationService.ts
import cron from 'node-cron';
import Member from '../../models/Member';
import Membership from '../../models/Membership';
import Appointment from '../../models/Appointment';
import Promotion from '../../models/Promotion';
import WorkoutSchedule from '../../models/WorkoutSchedule';
import pushNotificationService from './pushNotificationService';
import { pushConfig, renderTemplate } from '../../config/push-notification';
import { Types } from 'mongoose';
import Notification from '../../models/Notification'; // Dùng `import` thay vì `require`

// Định nghĩa interfaces cho populated objects
interface PopulatedMember {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedPackage {
  _id: Types.ObjectId;
  name: string;
  price: number;
}

interface PopulatedTrainer {
  _id: Types.ObjectId;
  name: string;
}

interface PopulatedMembership {
  _id: Types.ObjectId;
  member_id: PopulatedMember;
  package_id: PopulatedPackage;
  end_date: Date;
  status: string;
}

interface PopulatedAppointment {
  _id: Types.ObjectId;
  member_id: PopulatedMember;
  trainer_id: PopulatedTrainer;
  date: Date;
  time: {
    start: string;
    end: string;
  };
  location?: string;
  status: string;
}

interface PopulatedWorkoutSchedule {
  _id: Types.ObjectId;
  member_id: PopulatedMember;
  timeStart: Date;
  muscle_groups?: string[];
  location?: string;
  status: string;
}

class NotificationService {
  private isInitialized = false;

  constructor() {
    this.initializeScheduler();
  }

  // Khởi tạo các cron job
  initializeScheduler() {
    if (this.isInitialized) return;

    console.log('🔔 Initializing Notification Service...');

    // Kiểm tra membership sắp hết hạn - mỗi ngày lúc 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🏋️ Running membership expiry check...');
      await this.checkMembershipExpiry();
    });

    // Kiểm tra appointment reminder - mỗi giờ
    cron.schedule('0 * * * *', async () => {
      console.log('📅 Running appointment reminder check...');
      await this.checkAppointmentReminders();
    });

    // Kiểm tra workout reminder - mỗi 30 phút
    cron.schedule('*/30 * * * *', async () => {
      console.log('💪 Running workout reminder check...');
      await this.checkWorkoutReminders();
    });

    // Kiểm tra promotion mới - mỗi ngày lúc 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🎉 Running promotion notification check...');
      await this.checkNewPromotions();
    });

    this.isInitialized = true;
    console.log('✅ Notification Service initialized successfully!');
  }

  // 1. Kiểm tra membership sắp hết hạn
  async checkMembershipExpiry() {
    try {
      const today = new Date();
      const notificationDays = pushConfig.schedulingConfig.packageExpiryNotificationDays;

      for (const days of notificationDays) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() + days);
        checkDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(checkDate);
        nextDay.setDate(checkDate.getDate() + 1);

        // Tìm membership sắp hết hạn với type assertion
              const rawMemberships = await Membership.find({
            status: 'active',
            end_date: {
                $gte: checkDate,
                $lt: nextDay
            }
            })
            .populate('member_id', 'name email')
            .populate('package_id', 'name price')
            .lean();
            // Ép kiểu từ unknown để tránh lỗi TS2352
            const expiringMemberships = rawMemberships as unknown as PopulatedMembership[];


        for (const membership of expiringMemberships) {
          // Bỏ qua nếu end_date bị null
          if (!membership.end_date) continue;

          // Kiểm tra xem đã gửi thông báo chưa
          const alreadySent = await this.checkIfNotificationSent(
            membership.member_id._id.toString(),
            'membership_expiry',
            `${membership._id}_${days}days`
          );

          if (!alreadySent) {
            const template = renderTemplate(pushConfig.templates.membership_expiry, {
              packageName: membership.package_id.name,
              expiryDate: this.formatDate(membership.end_date),
              daysLeft: days
            });

            await pushNotificationService.sendToUser(
              membership.member_id._id.toString(),
              {
                title: template.title,
                message: template.body,
                type: 'membership',
                data: {
                  membershipId: membership._id,
                  packageId: membership.package_id._id,
                  expiryDate: membership.end_date,
                  daysLeft: days,
                  uniqueId: `${membership._id}_${days}days`
                }
              }
            );

            console.log(`📧 Sent membership expiry notification to ${membership.member_id.name} (${days} days)`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in checkMembershipExpiry:', error);
    }
  }

// 2. Kiểm tra lịch hẹn và gửi nhắc nhở
async checkAppointmentReminders() {
  try {
    const now = new Date();
    const reminderHours = pushConfig.schedulingConfig.appointmentReminderHours;

    for (const hours of reminderHours) {
      const reminderTime = new Date();
      reminderTime.setHours(now.getHours() + hours, 0, 0, 0); // ví dụ: 11:00 nếu giờ hiện tại là 10:00 và hours = 1

      const nextHour = new Date(reminderTime);
      nextHour.setHours(reminderTime.getHours() + 1); // khung giờ kết thúc, ví dụ: 12:00

      // Lấy tất cả các lịch hẹn confirmed trong khoảng 2 ngày (để không bị sót khi gộp time.start)
      const rawAppointments = await Appointment.find({
        status: 'confirmed',
        date: {
          $gte: new Date(reminderTime.getTime() - 24 * 60 * 60 * 1000), // hôm trước
          $lte: new Date(nextHour.getTime() + 24 * 60 * 60 * 1000),     // hôm sau
        }
      })
        .populate('member_id', 'name email')
        .populate('trainer_id', 'name')
        .lean();

      const appointments = rawAppointments as unknown as PopulatedAppointment[];

      for (const appointment of appointments) {
        // Gộp date và time.start lại thành 1 DateTime chính xác
        const [hour, minute] = appointment.time.start.split(':').map(Number);
        const appointmentDateTime = new Date(appointment.date);
        appointmentDateTime.setHours(hour, minute, 0, 0); // ví dụ: 2025-06-01T14:00:00

        // Kiểm tra nếu lịch nằm trong khung reminderTime → nextHour
        if (appointmentDateTime >= reminderTime && appointmentDateTime < nextHour) {
          const alreadySent = await this.checkIfNotificationSent(
            appointment.member_id._id.toString(),
            'appointment_reminder',
            `${appointment._id}_${hours}h`
          );

          if (!alreadySent) {
            const template = renderTemplate(pushConfig.templates.appointment_reminder, {
              trainerName: appointment.trainer_id.name,
              time: appointment.time.start,
              date: this.formatDate(appointment.date),
              location: appointment.location || 'Phòng tập'
            });

            await pushNotificationService.sendToUser(
              appointment.member_id._id.toString(),
              {
                title: template.title,
                message: template.body,
                type: 'appointment',
                data: {
                  appointmentId: appointment._id,
                  trainerId: appointment.trainer_id._id,
                  appointmentTime: appointmentDateTime,
                  hoursBeforeReminder: hours,
                  uniqueId: `${appointment._id}_${hours}h`
                }
              }
            );

            console.log(`📧 Sent appointment reminder to ${appointment.member_id.name} (${hours} hours before)`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAppointmentReminders:', error);
  }
}



  // 3. Kiểm tra workout reminder

  async checkWorkoutReminders() {
    try {
      const now = new Date();
      console.log(`🔍 Current time: ${now.toISOString()}`);
      
      // Tạo khoảng thời gian từ 30 phút tới đến 90 phút tới (để bắt hết các workout trong 1 tiếng tới)
      const startTime = new Date(now);
      startTime.setMinutes(startTime.getMinutes() + 30);
      startTime.setSeconds(0, 0);
      
      const endTime = new Date(now);
      endTime.setMinutes(endTime.getMinutes() + 90);
      endTime.setSeconds(0, 0);

      console.log(`🔍 Checking workouts between ${startTime.toISOString()} and ${endTime.toISOString()}`);

      // Tìm workout schedule sắp tới
      const rawUpcomingWorkouts = await WorkoutSchedule.find({
        status: 'upcoming',
        timeStart: {
          $gte: startTime,
          $lt: endTime
        }
      })
      .populate('member_id', 'name email')
      .lean();
      
      const upcomingWorkouts = rawUpcomingWorkouts as unknown as PopulatedWorkoutSchedule[];
      
      console.log(`📊 Found ${upcomingWorkouts.length} upcoming workouts`);

      if (upcomingWorkouts.length === 0) {
        console.log('ℹ️  No upcoming workouts found for the next hour');
        return;
      }

      for (const workout of upcomingWorkouts) {
        try {
          console.log(`🏃 Processing workout for ${workout.member_id.name} at ${workout.timeStart.toISOString()}`);
          
          // Tính thời gian còn lại đến workout (tính bằng phút)
          const timeUntilWorkout = Math.floor((workout.timeStart.getTime() - now.getTime()) / (1000 * 60));
          console.log(`⏰ Time until workout: ${timeUntilWorkout} minutes`);
          
          // Chỉ gửi thông báo cho workout trong khoảng 30-90 phút tới
          if (timeUntilWorkout < 30 || timeUntilWorkout > 90) {
            console.log(`⏭️ Skipping workout - outside notification window (${timeUntilWorkout} minutes)`);
            continue;
          }

          // Kiểm tra xem đã gửi thông báo chưa
          const alreadySent = await this.checkIfNotificationSent(
            workout.member_id._id.toString(),
            'workout_reminder',
            `${workout._id}_1h`
          );

          if (!alreadySent) {
            const workoutType = (workout.muscle_groups ?? []).length > 0 
              ? workout.muscle_groups!.join(', ') 
              : 'Tập luyện';
                      
            const template = renderTemplate(pushConfig.templates.workout_reminder, {
              workoutType: workoutType,
              time: this.formatTime(workout.timeStart),
              location: workout.location || 'Phòng tập'
            });

            await pushNotificationService.sendToUser(
              workout.member_id._id.toString(),
              {
                title: template.title,
                message: template.body,
                type: 'workout',
                data: {
                  workoutId: workout._id.toString(),
                  workoutTime: workout.timeStart.toISOString(),
                  muscleGroups: workout.muscle_groups,
                  location: workout.location,
                  uniqueId: `${workout._id}_1h`
                }
              }
            );

            console.log(`✅ Sent workout reminder to ${workout.member_id.name} for ${workoutType} at ${this.formatTime(workout.timeStart)}`);
          } else {
            console.log(`⏭️ Notification already sent to ${workout.member_id.name} for workout at ${this.formatTime(workout.timeStart)}`);
          }
        } catch (notificationError) {
          console.error(`❌ Error sending notification to ${workout.member_id.name}:`, notificationError);
        }
      }
    } catch (error) {
      console.error('❌ Error in checkWorkoutReminders:', error);
    }
  }


  // 4. Kiểm tra promotion mới
  async checkNewPromotions() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Tìm promotion bắt đầu hôm nay
      const newPromotions = await Promotion.find({
        status: 'active',
        start_date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      for (const promotion of newPromotions) {
        // Kiểm tra đã gửi thông báo promotion này chưa
        const alreadySent = await this.checkIfNotificationSent(
          'all', // Gửi cho tất cả members
          'promotion',
          `promo_${promotion._id}`
        );

        if (!alreadySent) {
          // Lấy danh sách tất cả member active
          const activeMembers = await Member.find({ 
            status: 'active',
            isVerified: true 
          }).select('_id');

          const memberIds = activeMembers.map(m => m._id.toString());

          const template = renderTemplate(pushConfig.templates.promotion, {
            discount: promotion.discount,
            endDate: this.formatDate(promotion.end_date),
            promotionName: promotion.name
          });

          // Gửi bulk notification
          await pushNotificationService.sendBulkNotifications(
            memberIds,
            {
              title: template.title,
              message: template.body,
              type: 'promotion',
              data: {
                promotionId: promotion._id,
                discount: promotion.discount,
                startDate: promotion.start_date,
                endDate: promotion.end_date,
                uniqueId: `promo_${promotion._id}`
              }
            }
          );

          console.log(`📧 Sent promotion notification to ${memberIds.length} members`);
        }
      }
    } catch (error) {
      console.error('❌ Error in checkNewPromotions:', error);
    }
  }

  // Helper: Kiểm tra thông báo đã được gửi chưa
  private async checkIfNotificationSent(
    memberId: string | 'all',
    type: string,
    uniqueId: string
  ): Promise<boolean> {
    try {

      
      const query: any = {
        type: type,
        'data.uniqueId': uniqueId
      };

      if (memberId !== 'all') {
        query.member_id = memberId;
      }

      const existingNotification = await Notification.findOne(query);
      return !!existingNotification;
    } catch (error) {
      console.error('Error checking notification:', error);
      return false;
    }
  }

  // Helper: Format date
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  // Helper: Format time
  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  }

  // Manual methods for testing/admin
  async sendMembershipExpiryNow(membershipId: string) {
    const membership = await Membership.findById(membershipId)
      .populate('member_id', 'name email')
      .populate('package_id', 'name') as PopulatedMembership | null;

    if (!membership) throw new Error('Membership not found');

    const daysLeft = Math.ceil(
      (new Date(membership.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const template = renderTemplate(pushConfig.templates.membership_expiry, {
      packageName: membership.package_id.name,
      expiryDate: this.formatDate(membership.end_date),
      daysLeft: daysLeft
    });

    return await pushNotificationService.sendToUser(
      membership.member_id._id.toString(),
      {
        title: template.title,
        message: template.body,
        type: 'membership',
        data: {
          membershipId: membership._id,
          packageId: membership.package_id._id,
          expiryDate: membership.end_date,
          daysLeft: daysLeft
        }
      }
    );
  }

  async sendPromotionNow(promotionId: string) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) throw new Error('Promotion not found');

    const activeMembers = await Member.find({ 
      status: 'active',
      isVerified: true 
    }).select('_id');

    const memberIds = activeMembers.map(m => m._id.toString());

    const template = renderTemplate(pushConfig.templates.promotion, {
      discount: promotion.discount,
      endDate: this.formatDate(promotion.end_date),
      promotionName: promotion.name
    });

    return await pushNotificationService.sendBulkNotifications(
      memberIds,
      {
        title: template.title,
        message: template.body,
        type: 'promotion',
        data: {
          promotionId: promotion._id,
          discount: promotion.discount,
          startDate: promotion.start_date,
          endDate: promotion.end_date
        }
      }
    );
  }

  // Stop all schedulers
  stopScheduler() {
    cron.getTasks().forEach(task => task.stop());
    this.isInitialized = false;
    console.log('🛑 Notification Service stopped');
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;