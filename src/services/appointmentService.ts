// services/appointmentService.ts
import Appointment, { IAppointment } from '../models/Appointment';
import Membership, { IMembership } from '../models/Membership';
import Package, { IPackage } from '../models/Package';
import Trainer, { ITrainer, ISchedule } from '../models/Trainer';
import { startOfMonth, endOfMonth } from 'date-fns';
import cron from 'node-cron';
import { Types } from 'mongoose';
import { UpcomingAppointment } from '../types/appointment';


interface MemberScheduleFilters {
  status?: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed';
  startDate?: Date | string;
  endDate?: Date | string;
  trainerId?: Types.ObjectId;
  timeSlot?: string; // For filtering by time of day
}

interface CreateAppointmentData {
  member_id: Types.ObjectId;
  trainer_id: Types.ObjectId;
  membership_id: Types.ObjectId;
  date: Date | string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

interface RescheduleAppointmentData {
  appointmentId: Types.ObjectId;
  memberId: Types.ObjectId;
  date: Date | string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

// Tạo lịch hẹn mới
const createAppointment = async (appointmentData: CreateAppointmentData): Promise<IAppointment> => {
  const { member_id, trainer_id, membership_id, date, startTime, endTime, location, notes } = appointmentData;
  
  const membership = await checkAndUpdateAvailableSessions(membership_id);
  if (!membership) {
    throw new Error('Gói tập đã hết số lượt đăng ký với PT');
  }
  const isAvailable = await isTrainerAvailable(trainer_id, date, startTime, endTime);
  if (!isAvailable) {
    throw new Error('Trainer is not available at the selected time');
  }
  
  const appointment = new Appointment({
    member_id,
    trainer_id,
    membership_id,
    date,
    time: {
      start: startTime,
      end: endTime
    },
    location,
    notes,
    status: 'pending'
  });
  
  await appointment.save();

  // Cập nhật workingHours của trainer
  const trainer = await Trainer.findById(trainer_id);
  if (trainer && trainer.schedule) {
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay(); // 0 - Sunday, 1 - Monday, etc.

    const scheduleForDay = trainer.schedule.find(s => s.dayOfWeek === dayOfWeek && s.available);
    if (scheduleForDay && scheduleForDay.workingHours) {
      const targetSlot = scheduleForDay.workingHours.find(
        (slot) => slot.start === startTime && slot.end === endTime
      );
      if (targetSlot) {
        targetSlot.available = false;
        await trainer.save(); // lưu trainer sau khi cập nhật
      }
    }
  }

  membership.available_sessions -= 1;
  membership.used_sessions += 1;
  await membership.save();
  
  return appointment;
};

// Helper function to categorize appointments into time slots
// This matches the frontend time slots
const getTimeSlotForHour = (hour: number): string => {
  if (hour >= 6 && hour < 12) return "Sáng (6:00-12:00)";
  if (hour >= 12 && hour < 15) return "Trưa (12:00-15:00)";
  if (hour >= 15 && hour < 18) return "Chiều (15:00-18:00)";
  if (hour >= 18 && hour < 22) return "Tối (18:00-22:00)";
  return "Khác";
};

// Helper function to format appointment data for frontend
const formatAppointmentForFrontend = (appointment: any): any => {
  // Format date as YYYY-MM-DD for frontend
  const formattedDate = appointment.date instanceof Date 
    ? appointment.date.toISOString().split('T')[0]
    : new Date(appointment.date).toISOString().split('T')[0];
  
  // Extract trainer info
  const trainerName = (appointment.trainer_id as any)?.name || null;
  const trainerImage = (appointment.trainer_id as any)?.image || null;
  const trainerSpecialization = (appointment.trainer_id as any)?.specialization || null;
  
  // Format time range
  const timeRange = `${appointment.time.start} - ${appointment.time.end}`;
  
  return {
    id: appointment._id,
    trainer: {
      id: appointment.trainer_id?._id || null,
      name: trainerName,
      image: trainerImage,
      specialization: trainerSpecialization
    },
    date: formattedDate,
    time: timeRange,
    location: appointment.location || "Phòng Tập Chính",
    status: appointment.status,
    notes: appointment.notes || ""
  };
};


// Kiểm tra trainer có lịch trống không
const isTrainerAvailable = async (trainerId: Types.ObjectId, date: Date | string, startTime: string, endTime: string): Promise<boolean> => {
  const trainer = await Trainer.findById(trainerId);
  if (!trainer) return false;
  
  // Lấy thứ trong tuần (0-6)
  const dayOfWeek = new Date(date).getDay();
  
  // Kiểm tra xem trainer có làm việc vào ngày này không
  const scheduleForDay = trainer.schedule?.find(s => s.dayOfWeek === dayOfWeek);
  if (!scheduleForDay || !scheduleForDay.available) return false;
  
  // Kiểm tra thời gian nằm trong giờ làm việc của trainer
  const isTimeSlotAvailable = scheduleForDay.workingHours?.some(wh => {
    return startTime >= wh.start && endTime <= wh.end;
  });
  if (!isTimeSlotAvailable) return false;
  
  // Kiểm tra xem trainer đã có lịch hẹn vào thời gian này chưa
  const existingAppointments = await Appointment.find({
    trainer_id: trainerId,
    date: { $eq: new Date(date) },
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      { 'time.start': { $lt: endTime, $gte: startTime } },
      { 'time.end': { $gt: startTime, $lte: endTime } },
      { 
        $and: [
          { 'time.start': { $lte: startTime } },
          { 'time.end': { $gte: endTime } }
        ]
      }
    ]
  });
  
  return existingAppointments.length === 0;
};

// Kiểm tra và cập nhật số buổi tập còn lại của membership
const checkAndUpdateAvailableSessions = async (membershipId: Types.ObjectId): Promise<IMembership> => {
  const membership = await Membership.findById(membershipId);
  if (!membership) throw new Error('Membership not found');
  
  if (membership.status !== 'active') {
    throw new Error('Membership is not active');
  }
  
  // Kiểm tra xem có cần reset số buổi tập hàng tháng không
  const now = new Date();
  const lastResetDate = membership.last_sessions_reset || membership.start_date;
  const thisMonth = startOfMonth(now);
  
  if (lastResetDate && thisMonth > lastResetDate) {
    // Tháng mới, reset số buổi tập
    const packageData = await Package.findById(membership.package_id);
    membership.available_sessions = packageData?.training_sessions || 0;
    membership.last_sessions_reset = now;
    await membership.save();
  }
  
  if (membership.available_sessions <= 0) {
    throw new Error('No available training sessions left in this membership');
  }
  
  return membership;
};




// Lấy tất cả lịch hẹn của member
const getAllMemberAppointments = async (
  memberId: Types.ObjectId | string,
  filters: any = {}
): Promise<any[]> => {
  try {
    // Convert string ID to ObjectId if needed
    const memberObjectId = typeof memberId === 'string' 
      ? new Types.ObjectId(memberId) 
      : memberId;
    
    // Build query based on filters
    const query: any = {
      member_id: memberObjectId,
    };
    
    // Add status filter if provided
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Add date range filter if provided
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }
    
    // Get appointments with populated data
    let appointmentsQuery = Appointment.find(query)
      .populate('trainer_id', 'name specialization image')
      .populate('membership_id', 'package_id start_date end_date')
      .populate({
        path: 'membership_id.package_id',
        select: 'name category'
      })
      .sort({ date: 1, 'time.start': 1 });
    
    // Handle search by trainer name or location
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      
      // We need to use aggregation for text search across populated fields
      const appointments = await appointmentsQuery.exec();
      
      return appointments
        .filter(app => {
          const trainerName = (app.trainer_id as any)?.name || '';
          const location = app.location || '';
          const notes = app.notes || '';
          
          return searchRegex.test(trainerName) || 
                 searchRegex.test(location) || 
                 searchRegex.test(notes);
        })
        .map(appointment => formatAppointmentForFrontend(appointment));
    }
    
    const appointments = await appointmentsQuery.exec();
    
    // Transform appointments to match frontend model
    return appointments.map(appointment => formatAppointmentForFrontend(appointment));
  } catch (error) {
    console.error('Error fetching member appointments:', error);
    throw new Error('Failed to fetch member appointments');
  }
};
// Lấy thông tin chi tiết của một lịch hẹn
const getAppointmentById = async (appointmentId: Types.ObjectId): Promise<IAppointment | null> => {
  // Tìm lịch hẹn theo appointmentId
  const appointment = await Appointment.findById(appointmentId)
    .populate('member_id', 'name avatar') // Dữ liệu của member
    .populate('trainer_id', 'name specialization image') // Dữ liệu của trainer
    .populate('membership_id', 'package_id start_date end_date') // Dữ liệu của membership
    .populate({
      path: 'membership_id.package_id', 
      select: 'name category' // Dữ liệu của package trong membership
    });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  return appointment;
};

// Lấy danh sách lịch tập đã xác nhận
const getMemberSchedule = async (
  memberId: Types.ObjectId | string, 
  filters: MemberScheduleFilters = {}
): Promise<any[]> => {
  try {
    // Convert string ID to ObjectId if needed
    const memberObjectId = typeof memberId === 'string' 
      ? new Types.ObjectId(memberId) 
      : memberId;
    
    // Build query based on filters
    const query: any = {
      member_id: memberObjectId,
      status: filters.status || 'confirmed', // Default to confirmed appointments
    };
    
    // Add date range filter if provided
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }
    
    // Add trainer filter if provided
    if (filters.trainerId) {
      query.trainer_id = typeof filters.trainerId === 'string' 
        ? new Types.ObjectId(filters.trainerId) 
        : filters.trainerId;
    }
    
    // Get appointments with populated data
    const appointments = await Appointment.find(query)
      .populate('trainer_id', 'name specialization image')
      .populate({
        path: 'membership_id',
        select: 'package_id start_date end_date',
        populate: {
          path: 'package_id',
          select: 'name category'
        }
      })
      .sort({ date: 1, 'time.start': 1 })
      .lean();
    
    // Transform appointments to match frontend model

    
    const scheduleData = appointments.map(appointment => {
      // Get package name from the populated data
      const packageName = (appointment.membership_id as any)?.package_id?.name || 'Gói tập';

      
      // Extract time for display
      const startTime = appointment.time.start;
      const endTime = appointment.time.end;
      const  time = {
        startTime: startTime,
        endTime: endTime
      }
      // Format date as YYYY-MM-DD for frontend
      const formattedDate = appointment.date instanceof Date 
        ? appointment.date.toISOString().split('T')[0]
        : new Date(appointment.date).toISOString().split('T')[0];
      
      // Determine status for frontend
      // The frontend uses: "upcoming" | "completed" | "missed"
      // While backend uses: "confirmed" | "pending" | "cancelled"
      let displayStatus = "upcoming";
      if (appointment.status === "cancelled") {
        displayStatus = "missed";
      } else {
        // Check if the appointment is in the past
        const now = new Date();
        const appointmentEndTime = new Date(appointment.date);
        const [hours, minutes] = appointment.time.end.split(':').map(Number);
        appointmentEndTime.setHours(hours, minutes);
        
        if (appointmentEndTime < now) {
          displayStatus = "completed";
        }
      }
      
      // Apply time slot filter if provided
      if (filters.timeSlot) {
        const hour = parseInt(startTime.split(':')[0]);
        const timeSlot = getTimeSlotForHour(hour);
        
        if (filters.timeSlot !== timeSlot) {
          return null; // Skip this appointment, it doesn't match the time slot
        }
      }
      const trainerName = (appointment.trainer_id as any)?.name || null;
      const trainerImage = (appointment.trainer_id as any)?.image || null;

      // Return formatted data that matches frontend expectations
      return {
        id: appointment._id,
        date: formattedDate,
        time: time,
        location: appointment.location || "Phòng Tập Chính",
        notes: appointment.notes || "",
        package_name: packageName,
        trainer_id: appointment.trainer_id?._id || null,
        trainer_name: trainerName,
        trainer_image: trainerImage,
        status: displayStatus as "upcoming" | "completed" | "missed"
      };
    }).filter(Boolean); // Remove any null entries filtered out by time slot
    
    return scheduleData;
  } catch (error) {
    console.error('Error fetching member schedule:', error);
    throw new Error('Failed to fetch member schedule');
  }
};


// Hủy lịch hẹn
const cancelAppointment = async (
  appointmentId: Types.ObjectId,
  memberId: Types.ObjectId
): Promise<IAppointment> => {
  // Tìm lịch hẹn theo ID
  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    const error = new Error('Không tìm thấy lịch hẹn') as any;
    error.statusCode = 404;
    throw error;
  }
  
  // Kiểm tra quyền sở hữu
  if (!appointment.member_id.equals(memberId)) {
    const error = new Error('Bạn không có quyền hủy lịch hẹn này') as any;
    error.statusCode = 403;
    throw error;
  }
  
  // Kiểm tra điều kiện hủy lịch:
  // 1. Lịch hẹn đang ở trạng thái pending 
  // 2. Hoặc thời gian hủy cách ngày hẹn ít nhất 1 ngày
  const now = new Date();
  const appointmentDate = new Date(appointment.date);
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const isAtLeastOneDayBefore = (appointmentDate.getTime() - now.getTime()) >= oneDayInMs;
  

  const canCancel =
  (appointment.status === 'pending' || appointment.status === 'confirmed') &&
  isAtLeastOneDayBefore;

  if (!canCancel) {
  const error = new Error('Bạn chỉ có thể hủy lịch hẹn ở trạng thái chờ xác nhận hoặc đã xác nhận, và trước ngày hẹn ít nhất 1 ngày') as any;
  error.statusCode = 400;
  throw error;
}

  
  
  // Cập nhật trạng thái lịch hẹn
  appointment.status = 'cancelled';
  await appointment.save();
  
  // Cập nhật lại số buổi tập trong gói tập nếu cần
  // Hoàn trả buổi tập đã trừ khi đặt lịch
  const membership = await Membership.findById(appointment.membership_id);
  if (membership) {
    membership.available_sessions += 1;
    membership.used_sessions -= 1;
    await membership.save();
  }
  
  return appointment;
};

// Đổi lịch hẹn
const rescheduleAppointment = async (
  data: RescheduleAppointmentData
): Promise<IAppointment> => {
  const { appointmentId, memberId, date, startTime, endTime, location, notes } = data;
  
  // Tìm lịch hẹn theo ID
  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    const error = new Error('Không tìm thấy lịch hẹn') as any;
    error.statusCode = 404;
    throw error;
  }
  
  // Kiểm tra quyền sở hữu
  if (!appointment.member_id.equals(memberId)) {
    const error = new Error('Bạn không có quyền đổi lịch hẹn này') as any;
    error.statusCode = 403;
    throw error;
  }
  
  // Kiểm tra điều kiện đổi lịch:
  // 1. Lịch hẹn đang ở trạng thái pending 
  // 2. Không phải trạng thái completed
  // 3. Thời gian đổi lịch cách ngày hẹn ít nhất 1 ngày
  const now = new Date();
  const appointmentDate = new Date(appointment.date);
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const isAtLeastOneDayBefore = (appointmentDate.getTime() - now.getTime()) >= oneDayInMs;
  
  if (appointment.status === 'completed') {
    const error = new Error('Không thể đổi lịch hẹn đã hoàn thành') as any;
    error.statusCode = 400;
    throw error;
  }
  
  if (appointment.status !== 'pending' && !isAtLeastOneDayBefore) {
    const error = new Error('Bạn chỉ có thể đổi lịch hẹn ở trạng thái chờ xác nhận hoặc trước ngày hẹn ít nhất 1 ngày') as any;
    error.statusCode = 400;
    throw error;
  }
  
  // Kiểm tra xem trainer có lịch trống không với thời gian mới
  const isAvailable = await isTrainerAvailable(
    appointment.trainer_id,
    date,
    startTime,
    endTime
  );
  
  if (!isAvailable) {
    const error = new Error('Huấn luyện viên không có lịch trống vào thời gian này') as any;
    error.statusCode = 400;
    throw error;
  }
  
  // Cập nhật thông tin lịch hẹn
  appointment.date = new Date(date);
  appointment.time = {
    start: startTime,
    end: endTime
  };
  
  if (location) {
    appointment.location = location;
  }
  
  if (notes) {
    appointment.notes = notes;
  }
  
  appointment.updated_at = new Date();
  
  // Lưu thay đổi
  await appointment.save();
  
  return appointment;
};

const updateMissedAppointments = async (): Promise<void> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    
    // Find all confirmed appointments from yesterday that weren't completed
    const result = await Appointment.updateMany(
      {
        date: {
          $gte: yesterday,
          $lte: endOfYesterday
        },
        status: 'confirmed'
      },
      {
        $set: { status: 'missed' }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} missed appointments`);
  } catch (error) {
    console.error('Error updating missed appointments:', error);
  }
};
export const initScheduledJobs = (): void => {
  cron.schedule('5 0 * * *', async () => {
    console.log('Running scheduled job: Update missed appointments');
    await updateMissedAppointments();
  });
};

// Lấy các lịch hẹn trong 7 ngày tới

export async function getUpcomingAppointments(memberId: string): Promise<UpcomingAppointment[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const appointments = await Appointment.find({
      member_id: new Types.ObjectId(memberId),
      date: { $gte: today, $lt: nextWeek },
      status: { $in: ['confirmed', 'pending'] },
    }).sort({ date: 1, 'time.start': 1 });

    const formattedAppointments: UpcomingAppointment[] = appointments.map(app => {
      const [startHour, startMinute] = app.time.start.split(':').map(Number);
      const [endHour, endMinute] = app.time.end.split(':').map(Number);

      const timeStart = new Date(app.date);
      timeStart.setHours(startHour, startMinute, 0, 0);

      const timeEnd = new Date(app.date);
      timeEnd.setHours(endHour, endMinute, 0, 0);

      return {
        date: app.date,
        timeStart,
        timeEnd,
        location: app.location,
        status: app.status === 'confirmed' ? 'upcoming' : app.status,
      };
    });

    return formattedAppointments;
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn sắp tới:', error);
    throw new Error('Không thể lấy danh sách lịch hẹn sắp tới');
  }
}
export default {
  createAppointment,
  getAllMemberAppointments,
  cancelAppointment,
  isTrainerAvailable,
  getAppointmentById,
  getMemberSchedule,
  rescheduleAppointment,
  updateMissedAppointments,
  getUpcomingAppointments
};