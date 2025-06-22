import Trainer, { ITrainer, ISchedule, IWorkingHours } from '~/models/Trainer';
import { Types } from 'mongoose';

// Define types for query options and response
export interface TrainerQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?:string;
  specialization?: string;
  experience?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TrainerResponse {
  _id: string;
  image?: string;
  name: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  phone?: string;
  email: string;
  status: 'active' | 'inactive';
  schedule?: ISchedule[];
  created_at: Date;
  updated_at: Date;
}

// Get all trainers with pagination, filtering and sorting
export const getAllTrainers = async (
  options: TrainerQueryOptions
): Promise<{
  trainers: TrainerResponse[];
  totalTrainers: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    search,
     status,
    specialization,
    experience,
    sortBy,
    sortOrder
  } = options;

  const query: any = {};

  // Apply filters
   if (status) {
    query.status = status;
  }
  if (specialization) {
    query.specialization = specialization;
  }

  if (experience !== undefined) {
    query.experience = { $gte: experience };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } }
    ];
  }

  const totalTrainers = await Trainer.countDocuments(query);
  const totalPages = Math.ceil(totalTrainers / limit);

  const sort: any = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.created_at = -1;
  }

  const trainers = await Trainer.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const trainerResponses: TrainerResponse[] = trainers.map(trainer => ({
    _id: trainer._id.toString(),
    image: trainer.image,
    name: trainer.name,
    bio: trainer.bio,
    specialization: trainer.specialization,
    experience: trainer.experience,
 
    phone: trainer.phone,
    email: trainer.email,
    schedule: trainer.schedule,
    status: trainer.status,
    created_at: trainer.created_at,
    updated_at: trainer.updated_at
  }));

  return {
    trainers: trainerResponses,
    totalTrainers,
    totalPages,
    currentPage: page
  };
};

// Get trainer by ID
export const getTrainerById = async (trainerId: string): Promise<TrainerResponse> => {
  const trainer = await Trainer.findById(trainerId).lean();

  if (!trainer) {
    throw new Error('Không tìm thấy huấn luyện viên');
  }

  return {
    _id: trainer._id.toString(),
    image: trainer.image,
    name: trainer.name,
    bio: trainer.bio,
    specialization: trainer.specialization,
    experience: trainer.experience,
    phone: trainer.phone,
    email: trainer.email,
    status: trainer.status,
    schedule: trainer.schedule,
    created_at: trainer.created_at,
    updated_at: trainer.updated_at
  };
};

// Create a new trainer
export const createTrainer = async (
  trainerData: Partial<ITrainer>
): Promise<TrainerResponse> => {
  // Check if email already exists
  const existingTrainer = await Trainer.findOne({ email: trainerData.email });
  if (existingTrainer) {
    throw new Error('Email đã tồn tại trong hệ thống');
  }

  // Initialize schedule for all days of the week if not provided
  if (!trainerData.schedule || trainerData.schedule.length === 0) {
    trainerData.schedule = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      available: false,
      workingHours: []
    }));
  }

  // Create the trainer
  const newTrainer = new Trainer({
    ...trainerData,
    created_at: new Date(),
    updated_at: new Date()
  });

  const savedTrainer = await newTrainer.save();

  return {
    _id: (savedTrainer._id as Types.ObjectId).toString(),
    image: savedTrainer.image,
    name: savedTrainer.name,
    bio: savedTrainer.bio,
    specialization: savedTrainer.specialization,
    experience: savedTrainer.experience,
    phone: savedTrainer.phone,
    email: savedTrainer.email,
    status: savedTrainer.status,
    schedule: savedTrainer.schedule,
    created_at: savedTrainer.created_at,
    updated_at: savedTrainer.updated_at
  };
};

// Update an existing trainer
export const updateTrainer = async (
  trainerId: string,
  trainerData: Partial<ITrainer>
): Promise<TrainerResponse> => {
  // Check if email already exists and is not the current trainer
  if (trainerData.email) {
    const existingTrainer = await Trainer.findOne({ 
      email: trainerData.email, 
      _id: { $ne: trainerId } 
    });
    
    if (existingTrainer) {
      throw new Error('Email đã tồn tại trong hệ thống');
    }
  }

  // Update the trainer
  const updatedTrainer = await Trainer.findByIdAndUpdate(
    trainerId,
    {
      ...trainerData,
      updated_at: new Date()
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedTrainer) {
    throw new Error('Không tìm thấy huấn luyện viên');
  }

  return {
    _id: updatedTrainer._id.toString(),
    image: updatedTrainer.image,
    name: updatedTrainer.name,
    bio: updatedTrainer.bio,
    specialization: updatedTrainer.specialization,
    experience: updatedTrainer.experience,
    phone: updatedTrainer.phone,
    email: updatedTrainer.email,
    status: updatedTrainer.status,
    schedule: updatedTrainer.schedule,
    created_at: updatedTrainer.created_at,
    updated_at: updatedTrainer.updated_at
  };
};

// Soft delete a trainer (set deleted_at)
export const deleteTrainer = async (trainerId: string): Promise<boolean> => {
  const trainer = await Trainer.findOne({ _id: trainerId, deleted_at: null });

  if (!trainer) {
    throw new Error('Không tìm thấy huấn luyện viên');
  }

  // Soft delete the trainer
  await Trainer.updateOne(
    { _id: trainerId },
    { deleted_at: new Date(), status: 'inactive'    }
  );

  return true;
};


// Toggle package status (active/inactive)
export const toggleTrainerStatus = async (TrainerId: string): Promise<TrainerResponse> => {
  const pkg = await Trainer.findOne({ _id: TrainerId, deleted_at: null });

  if (!pkg) {
    throw new Error('Không tìm thấy gói dịch vụ');
  }

  const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
  
  const updatedTrainer = await Trainer.findByIdAndUpdate(
    TrainerId,
    { status: newStatus, updated_at: new Date() },
    { new: true }
  ).lean();

   if (!updatedTrainer) {
    throw new Error('Không thể cập nhật trạng thái gói dịch vụ');
  }


  return {
    _id: updatedTrainer._id.toString(),
    image: updatedTrainer.image,
    name: updatedTrainer.name,
    bio: updatedTrainer.bio,
    specialization: updatedTrainer.specialization,
    experience: updatedTrainer.experience,
    phone: updatedTrainer.phone,
    email: updatedTrainer.email,
    status: updatedTrainer.status,
    schedule: updatedTrainer.schedule,
    created_at: updatedTrainer.created_at,
    updated_at: updatedTrainer.updated_at
  };
};

// Update trainer schedule
export const updateTrainerSchedule = async (
  trainerId: string,
  schedule: ISchedule[]
): Promise<TrainerResponse> => {
  // Validate the schedule
  if (!Array.isArray(schedule) || schedule.length !== 7) {
    throw new Error('Lịch làm việc phải có đầy đủ 7 ngày trong tuần');
  }

  for (const day of schedule) {
    if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      throw new Error('Ngày trong tuần phải từ 0 (Chủ nhật) đến 6 (Thứ 7)');
    }

    if (day.available && (!day.workingHours || day.workingHours.length === 0)) {
      throw new Error('Phải cung cấp thời gian làm việc cho ngày có trạng thái khả dụng');
    }

    if (day.workingHours) {
      for (const hours of day.workingHours) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(hours.start) || !timeRegex.test(hours.end)) {
          throw new Error('Thời gian phải theo định dạng HH:MM');
        }

        // Validate that end time is after start time
        const startTime = new Date(`1970-01-01T${hours.start}:00`);
        const endTime = new Date(`1970-01-01T${hours.end}:00`);
        if (endTime <= startTime) {
          throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
        }
      }
    }
  }

  // Update the trainer's schedule
  const updatedTrainer = await Trainer.findByIdAndUpdate(
    trainerId,
    {
      schedule: schedule,
      updated_at: new Date()
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedTrainer) {
    throw new Error('Không tìm thấy huấn luyện viên');
  }

  return {
    _id: updatedTrainer._id.toString(),
    image: updatedTrainer.image,
    name: updatedTrainer.name,
    bio: updatedTrainer.bio,
    specialization: updatedTrainer.specialization,
    experience: updatedTrainer.experience,
    phone: updatedTrainer.phone,
    email: updatedTrainer.email,
    schedule: updatedTrainer.schedule,
    status: updatedTrainer.status,
    created_at: updatedTrainer.created_at,
    updated_at: updatedTrainer.updated_at
  };
};

// Get trainer availability by date range
export const getTrainerAvailability = async (
  trainerId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  trainer: TrainerResponse,
  availableDates: Array<{
    date: Date,
    dayOfWeek: number,
    workingHours: IWorkingHours[]
  }>
}> => {
  const trainer = await Trainer.findById(trainerId).lean();

  if (!trainer) {
    throw new Error('Không tìm thấy huấn luyện viên');
  }

  const availableDates: Array<{
    date: Date,
    dayOfWeek: number,
    workingHours: IWorkingHours[]
  }> = [];

  // Create a copy of the start date to avoid modifying the original
  const currentDate = new Date(startDate);
  
  // Iterate over all dates in the range
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Find schedule for this day of week
    const daySchedule = trainer.schedule?.find(s => s.dayOfWeek === dayOfWeek);
    
    if (daySchedule && daySchedule.available && daySchedule.workingHours && daySchedule.workingHours.length > 0) {
      availableDates.push({
        date: new Date(currentDate), // Create a new date to avoid reference issues
        dayOfWeek,
        workingHours: daySchedule.workingHours
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    trainer: {
      _id: trainer._id.toString(),
      image: trainer.image,
      name: trainer.name,
      bio: trainer.bio,
      specialization: trainer.specialization,
      experience: trainer.experience,
      phone: trainer.phone,
      email: trainer.email,
      schedule: trainer.schedule,
      status: trainer.status,
      created_at: trainer.created_at,
      updated_at: trainer.updated_at
    },
    availableDates
  };
};

// Get trainer statistics
export const getTrainerStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  bySpecialization: Record<string, number>;
  experienceRanges: {
    novice: number;      // 0-2 years
    intermediate: number; // 3-5 years
    experienced: number;  // 6-10 years
    expert: number;       // 11+ years
  };
}> => {
  const total = await Trainer.countDocuments();
   const active = await Trainer.countDocuments({ status: 'active', deleted_at: null });
    const inactive = await Trainer.countDocuments({ status: 'inactive', deleted_at: null });
  // Get counts by specialization
  const specializationCounts = await Trainer.aggregate([
    { $group: { _id: '$specialization', count: { $sum: 1 } } }
  ]);

  const bySpecialization: Record<string, number> = {};
  specializationCounts.forEach(spec => {
    if (spec._id) {
      bySpecialization[spec._id] = spec.count;
    } else {
      bySpecialization['unspecified'] = spec.count;
    }
  });

  // Get counts by experience ranges
  const novice = await Trainer.countDocuments({ experience: { $gte: 0, $lte: 2 } });
  const intermediate = await Trainer.countDocuments({ experience: { $gte: 3, $lte: 5 } });
  const experienced = await Trainer.countDocuments({ experience: { $gte: 6, $lte: 10 } });
  const expert = await Trainer.countDocuments({ experience: { $gte: 11 } });

  return {
    total,
     active,
    inactive,
    bySpecialization,
    experienceRanges: {
      novice,
      intermediate,
      experienced,
      expert
    }
  };
};

export default {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  updateTrainerSchedule,
  getTrainerAvailability,
  getTrainerStats,
   toggleTrainerStatus
};