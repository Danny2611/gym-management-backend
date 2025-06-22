import pushNotificationService from './pushNotificationService';
import { pushConfig, renderTemplate } from '~/config/push-notification';

// Event handlers cho các sự kiện trong hệ thống

// Khi appointment được tạo/xác nhận
export const handleAppointmentConfirmed = async (appointmentId: string) => {
  try {
    const Appointment = require('~/models/Appointment');
    const appointment = await Appointment.findById(appointmentId)
      .populate('member_id', 'name email')
      .populate('trainer_id', 'name');

    if (!appointment) return;

    const template = renderTemplate(pushConfig.templates.appointment_reminder, {
      trainerName: appointment.trainer_id.name,
      time: appointment.time.start,
      date: new Intl.DateTimeFormat('vi-VN').format(appointment.date),
      location: appointment.location || 'Phòng tập'
    });

    await pushNotificationService.sendToUser(
      appointment.member_id._id.toString(),
      {
        title: '✅ Lịch hẹn đã được xác nhận',
        message: `Lịch hẹn với PT ${appointment.trainer_id.name} đã được xác nhận`,
        type: 'appointment',
        data: {
          appointmentId: appointment._id,
          status: 'confirmed'
        }
      }
    );

    console.log(`📧 Sent appointment confirmation to ${appointment.member_id.name}`);
  } catch (error) {
    console.error('Error in handleAppointmentConfirmed:', error);
  }
};

// Khi membership được gia hạn
export const handleMembershipRenewed = async (membershipId: string) => {
  try {
    const Membership = require('~/models/Membership');
    const membership = await Membership.findById(membershipId)
      .populate('member_id', 'name email')
      .populate('package_id', 'name');

    if (!membership) return;

    await pushNotificationService.sendToUser(
      membership.member_id._id.toString(),
      {
        title: '🎉 Gia hạn thành công',
        message: `Gói ${membership.package_id.name} đã được gia hạn thành công!`,
        type: 'membership',
        data: {
          membershipId: membership._id,
          newEndDate: membership.end_date
        }
      }
    );

    console.log(`📧 Sent membership renewal confirmation to ${membership.member_id.name}`);
  } catch (error) {
    console.error('Error in handleMembershipRenewed:', error);
  }
};

// Khi workout được hoàn thành
export const handleWorkoutCompleted = async (workoutId: string) => {
  try {
    const WorkoutSchedule = require('~/models/WorkoutSchedule');
    const workout = await WorkoutSchedule.findById(workoutId)
      .populate('member_id', 'name email');

    if (!workout) return;

    await pushNotificationService.sendToUser(
      workout.member_id._id.toString(),
      {
        title: '💪 Tập luyện hoàn thành',
        message: 'Chúc mừng bạn đã hoàn thành buổi tập hôm nay!',
        type: 'workout',
        data: {
          workoutId: workout._id,
          status: 'completed'
        }
      }
    );

    console.log(`📧 Sent workout completion notification to ${workout.member_id.name}`);
  } catch (error) {
    console.error('Error in handleWorkoutCompleted:', error);
  }
};
