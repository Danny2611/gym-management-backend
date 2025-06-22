import Appointment, { IAppointment } from '~/models/Appointment';
import Member from '~/models/Member';
import Trainer from '~/models/Trainer';
import { Types } from 'mongoose';

// Define types for query options and response
export interface AppointmentQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed';
  startDate?: Date;
  endDate?: Date;
  member_id?: string;
  trainer_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AppointmentResponse {
  _id: string;
  member: {
    _id: string;
    name: string;
  };
  trainer: {
    _id: string;
    name: string;
  };
  membership_id: string;
  notes?: string;
  date: Date;
  time: {
    start: string;
    end: string;
  };
  location?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'missed';
  created_at: Date;
  updated_at: Date;
}

// Get all appointments with pagination, filtering and sorting
export const getAllAppointments = async (
  options: AppointmentQueryOptions
): Promise<{
  appointments: AppointmentResponse[];
  totalAppointments: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    startDate,
    endDate,
    member_id,
    trainer_id,
    sortBy,
    sortOrder
  } = options;

  // Start building the pipeline
  const pipeline: any[] = [];
  
  // Match stage for filtering
  const matchStage: any = {};
  
  if (status) {
    matchStage.status = status;
  }
  
  if (startDate && endDate) {
    matchStage.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    matchStage.date = { $gte: startDate };
  } else if (endDate) {
    matchStage.date = { $lte: endDate };
  }
  
  if (member_id) {
    matchStage.member_id = new Types.ObjectId(member_id);
  }
  
  if (trainer_id) {
    matchStage.trainer_id = new Types.ObjectId(trainer_id);
  }
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  
  // Lookup stages for member and trainer names
  pipeline.push(
    {
      $lookup: {
        from: 'members',
        localField: 'member_id',
        foreignField: '_id',
        as: 'member'
      }
    },
    {
      $lookup: {
        from: 'trainers',
        localField: 'trainer_id',
        foreignField: '_id',
        as: 'trainer'
      }
    },
    {
      $unwind: '$member'
    },
    {
      $unwind: '$trainer'
    }
  );
  
  // Search by member or trainer name
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'member.name': { $regex: search, $options: 'i' } },
          { 'trainer.name': { $regex: search, $options: 'i' } }
        ]
      }
    });
  }
  
  // Get total count for pagination
  const countPipeline = [...pipeline];
  countPipeline.push({ $count: 'total' });
  
  const countResult = await Appointment.aggregate(countPipeline);
  const totalAppointments = countResult.length > 0 ? countResult[0].total : 0;
  const totalPages = Math.ceil(totalAppointments / limit);
  
  // Add sorting
  const sortStage: any = {};
  if (sortBy) {
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortStage['date'] = 1;
    sortStage['time.start'] = 1;
  }
  
  pipeline.push({ $sort: sortStage });
  
  // Add pagination
  pipeline.push(
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );
  
  // Select only required fields
  pipeline.push({
    $project: {
      _id: 1,
      member: {
        _id: '$member._id',
        name: '$member.name'
      },
      trainer: {
        _id: '$trainer._id',
        name: '$trainer.name'
      },
      membership_id: 1,
      notes: 1,
      date: 1,
      time: 1,
      location: 1,
      status: 1,
      created_at: 1,
      updated_at: 1
    }
  });
  
  const appointments = await Appointment.aggregate(pipeline);
  
  return {
    appointments: appointments.map(appointment => ({
      ...appointment,
      _id: appointment._id.toString(),
      membership_id: appointment.membership_id.toString()
    })),
    totalAppointments,
    totalPages,
    currentPage: page,
  };
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId: string): Promise<AppointmentResponse> => {
  const pipeline = [
    {
      $match: {
        _id: new Types.ObjectId(appointmentId)
      }
    },
    {
      $lookup: {
        from: 'members',
        localField: 'member_id',
        foreignField: '_id',
        as: 'member'
      }
    },
    {
      $lookup: {
        from: 'trainers',
        localField: 'trainer_id',
        foreignField: '_id', 
        as: 'trainer'
      }
    },
    {
      $unwind: '$member'
    },
    {
      $unwind: '$trainer'
    },
    {
      $project: {
        _id: 1,
        member: {
          _id: '$member._id',
          name: '$member.name'
        },
        trainer: {
          _id: '$trainer._id',
          name: '$trainer.name'  
        },
        membership_id: 1,
        notes: 1,
        date: 1,
        time: 1,
        location: 1,
        status: 1,
        created_at: 1,
        updated_at: 1
      }
    }
  ];

  const appointments = await Appointment.aggregate(pipeline);
  
  if (!appointments || appointments.length === 0) {
    throw new Error('Không tìm thấy lịch hẹn');
  }
  
  const appointment = appointments[0];
  
  return {
    ...appointment,
    _id: appointment._id.toString(),
    membership_id: appointment.membership_id.toString()
  };
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: 'confirmed' | 'pending' | 'cancelled' 
): Promise<AppointmentResponse> => {
  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new Error('Không tìm thấy lịch hẹn');
  }
  
  appointment.status = status;
  appointment.updated_at = new Date();
  await appointment.save();
  
  // Get member and trainer details
  const member = await Member.findById(appointment.member_id).select('name').lean();
  const trainer = await Trainer.findById(appointment.trainer_id).select('name').lean();
  
  if (!member || !trainer) {
    throw new Error('Không tìm thấy thông tin hội viên hoặc huấn luyện viên');
  }
  
  return {
    _id:  (appointment._id as Types.ObjectId).toString(),
    member: {
      _id: member._id.toString(),
      name: member.name
    },
    trainer: {
      _id: trainer._id.toString(),
      name: trainer.name
    },
    membership_id: appointment.membership_id.toString(),
    notes: appointment.notes,
    date: appointment.date,
    time: appointment.time,
    location: appointment.location,
    status: appointment.status,
    created_at: appointment.created_at,
    updated_at: appointment.updated_at
  };
};

// Get member appointments
export const getMemberAppointments = async (
  memberId: string,
  options: AppointmentQueryOptions
): Promise<{
  appointments: AppointmentResponse[];
  totalAppointments: number;
  totalPages: number;
  currentPage: number;
}> => {
  options.member_id = memberId;
  return getAllAppointments(options);
};

// Get trainer appointments
export const getTrainerAppointments = async (
  trainerId: string,
  options: AppointmentQueryOptions
): Promise<{
  appointments: AppointmentResponse[];
  totalAppointments: number;
  totalPages: number;
  currentPage: number;
}> => {
  options.trainer_id = trainerId;
  return getAllAppointments(options);
};

// Get appointment statistics
export const getAppointmentStats = async (): Promise<{
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  missed: number;
  upcomingToday: number;
  upcomingWeek: number;
}> => {
  const total = await Appointment.countDocuments();
  const confirmed = await Appointment.countDocuments({ status: 'confirmed' });
  const pending = await Appointment.countDocuments({ status: 'pending' });
  const cancelled = await Appointment.countDocuments({ status: 'cancelled' });
  const completed = await Appointment.countDocuments({ status: 'completed' });
  const missed = await Appointment.countDocuments({ status: 'missed' });
  
  // Get today's date and set to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get end of today
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  
  // Get end of week (7 days from today)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Count upcoming appointments for today
  const upcomingToday = await Appointment.countDocuments({
    date: { $gte: today, $lte: endOfToday },
    status: { $in: ['confirmed', 'pending'] }
  });
  
  // Count upcoming appointments for the week
  const upcomingWeek = await Appointment.countDocuments({
    date: { $gte: today, $lte: endOfWeek },
    status: { $in: ['confirmed', 'pending'] }
  });
  
  return {
    total,
    confirmed,
    pending,
    cancelled,
    completed,
    missed,
    upcomingToday,
    upcomingWeek
  };
};

export default {
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getMemberAppointments,
  getTrainerAppointments,
  getAppointmentStats,
};