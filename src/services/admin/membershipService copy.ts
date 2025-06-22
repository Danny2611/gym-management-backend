import Membership, { IMembership } from '~/models/Membership';
import Member from '~/models/Member';
import Package from '~/models/Package';
import Payment from '~/models/Payment';
import { Types } from 'mongoose';

// Define types for query options and response
export interface MembershipQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'expired' | 'pending' | 'paused';
  memberId?: string;
  packageId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MembershipResponse {
  _id: string;
  member: {
    _id: string;
    name: string;
    email: string;
  };
  package: {
    _id: string;
    name: string;
    price: number;
    duration: number;
    training_sessions: number;
  };
  payment_id: string;
  start_date: Date | null;
  end_date: Date | null;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'pending' | 'paused';
  available_sessions: number;
  used_sessions: number;
  last_sessions_reset?: Date;
  created_at: Date;
  updated_at: Date;
}

// Get all memberships with pagination, filtering and sorting
export const getAllMemberships = async (
  options: MembershipQueryOptions
): Promise<{
  memberships: MembershipResponse[];
  totalMemberships: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    memberId,
    packageId,
    sortBy,
    sortOrder,
  } = options;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by member ID
  if (memberId) {
    query.member_id = new Types.ObjectId(memberId);
  }

  // Filter by package ID
  if (packageId) {
    query.package_id = new Types.ObjectId(packageId);
  }

  const totalMemberships = await Membership.countDocuments(query);
  const totalPages = Math.ceil(totalMemberships / limit);

  const sort: any = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.created_at = -1;
  }

  const memberships = await Membership.find(query)
    .populate('member_id', 'name email')
    .populate('package_id', 'name price duration training_sessions')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Search in populated member name or email
  let filteredMemberships = memberships;
  if (search) {
    filteredMemberships = memberships.filter((membership) => {
      const memberName = (membership.member_id as any).name?.toLowerCase() || '';
      const memberEmail = (membership.member_id as any).email?.toLowerCase() || '';
      const packageName = (membership.package_id as any).name?.toLowerCase() || '';
      
      return (
        memberName.includes(search.toLowerCase()) ||
        memberEmail.includes(search.toLowerCase()) ||
        packageName.includes(search.toLowerCase())
      );
    });
  }

  const membershipResponses: MembershipResponse[] = filteredMemberships.map((membership) => ({
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  }));

  return {
    memberships: membershipResponses,
    totalMemberships,
    totalPages,
    currentPage: page,
  };
};

// Get membership by ID
export const getMembershipById = async (membershipId: string): Promise<MembershipResponse> => {
  const membership = await Membership.findById(membershipId)
    .populate('member_id', 'name email')
    .populate('package_id', 'name price duration training_sessions')
    .lean();

  if (!membership) {
    throw new Error('Không tìm thấy đăng ký thành viên');
  }

  return {
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
};

// Get memberships by member ID
export const getMembershipsByMemberId = async (memberId: string): Promise<MembershipResponse[]> => {
  const memberships = await Membership.find({ member_id: new Types.ObjectId(memberId) })
    .populate('member_id', 'name email')
    .populate('package_id', 'name price duration training_sessions')
    .sort({ created_at: -1 })
    .lean();

  return memberships.map((membership) => ({
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  }));
};

// Create a new membership
export const createMembership = async (membershipData: {
  member_id: string;
  package_id: string;
  payment_id: string;
  start_date?: Date;
  end_date?: Date;
  auto_renew?: boolean;
  status?: 'active' | 'expired' | 'pending' | 'paused';
}): Promise<MembershipResponse> => {
  // Validate member exists
  const member = await Member.findById(membershipData.member_id);
  if (!member) {
    throw new Error('Không tìm thấy hội viên');
  }

  // Validate package exists
  const packageItem = await Package.findById(membershipData.package_id);
  if (!packageItem) {
    throw new Error('Không tìm thấy gói thành viên');
  }

  // Calculate end date if not provided but start date and package duration exists
  let endDate = membershipData.end_date || null;
  if (membershipData.start_date && packageItem.duration && !endDate) {
    endDate = new Date(membershipData.start_date);
    endDate.setDate(endDate.getDate() + packageItem.duration);
  }

  // Create new membership
  const membership = await Membership.create({
    member_id: new Types.ObjectId(membershipData.member_id),
    package_id: new Types.ObjectId(membershipData.package_id),
    payment_id: new Types.ObjectId(membershipData.payment_id),
    start_date: membershipData.start_date || null,
    end_date: endDate,
    auto_renew: membershipData.auto_renew || false,
    status: membershipData.status || 'active',
    available_sessions: packageItem.training_sessions || 0,
    used_sessions: 0,
    last_sessions_reset: new Date(),
  });

  // Populate membership and return
  await membership.populate('member_id', 'name email');
  await membership.populate('package_id', 'name price duration training_sessions');

  return {
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
};

// Update membership by ID
export const updateMembership = async (
  membershipId: string,
  updateData: {
    package_id?: string;
    payment_id?: string;
    start_date?: Date;
    end_date?: Date;
    auto_renew?: boolean;
    status?: 'active' | 'expired' | 'pending' | 'paused';
    available_sessions?: number;
    used_sessions?: number;
  }
): Promise<MembershipResponse> => {
  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new Error('Không tìm thấy đăng ký thành viên');
  }

  // Validate package if provided
  if (updateData.package_id) {
    const packageItem = await Package.findById(updateData.package_id);
    if (!packageItem) {
      throw new Error('Không tìm thấy gói thành viên');
    }
  }

  // Update fields
  if (updateData.package_id) membership.package_id = new Types.ObjectId(updateData.package_id);
  if (updateData.payment_id) membership.payment_id = new Types.ObjectId(updateData.payment_id);
  if (updateData.start_date !== undefined) membership.start_date = updateData.start_date;
  if (updateData.end_date !== undefined) membership.end_date = updateData.end_date;
  if (updateData.auto_renew !== undefined) membership.auto_renew = updateData.auto_renew;
  if (updateData.status) membership.status = updateData.status;
  if (updateData.available_sessions !== undefined) membership.available_sessions = updateData.available_sessions;
  if (updateData.used_sessions !== undefined) membership.used_sessions = updateData.used_sessions;

  membership.updated_at = new Date();
  await membership.save();

  // Populate and return updated membership
  await membership.populate('member_id', 'name email');
  await membership.populate('package_id', 'name price duration training_sessions');

  return {
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
};

// Update membership status
export const updateMembershipStatus = async (
  membershipId: string,
  status: 'active' | 'expired' | 'pending' | 'paused'
): Promise<MembershipResponse> => {
  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new Error('Không tìm thấy đăng ký thành viên');
  }

  // Update status
  membership.status = status;
  membership.updated_at = new Date();
  await membership.save();

  // Populate and return updated membership
  await membership.populate('member_id', 'name email');
  await membership.populate('package_id', 'name price duration training_sessions');

  return {
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
};

// Delete membership by ID
export const deleteMembership = async (membershipId: string): Promise<boolean> => {
  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new Error('Không tìm thấy đăng ký thành viên');
  }

  await Membership.deleteOne({ _id: membershipId });
  return true;
};

// Update training sessions
export const updateTrainingSessions = async (
  membershipId: string,
  sessionsUsed: number
): Promise<MembershipResponse> => {
  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new Error('Không tìm thấy đăng ký thành viên');
  }

  if (membership.status !== 'active') {
    throw new Error('Đăng ký thành viên không hoạt động');
  }

  if (membership.available_sessions < sessionsUsed) {
    throw new Error('Số buổi tập còn lại không đủ');
  }

  // Update sessions
  membership.available_sessions -= sessionsUsed;
  membership.used_sessions += sessionsUsed;
  membership.updated_at = new Date();
  await membership.save();

  // Populate and return updated membership
  await membership.populate('member_id', 'name email');
  await membership.populate('package_id', 'name price duration training_sessions');

  return {
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: (membership.package_id as any)._id.toString(),
      name: (membership.package_id as any).name,
      price: (membership.package_id as any).price,
      duration: (membership.package_id as any).duration,
      training_sessions: (membership.package_id as any).training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
};

// Reset training sessions (e.g., on a monthly basis)
export const resetTrainingSessions = async (membershipId: string): Promise<MembershipResponse> => {
  const membership = await Membership.findById(membershipId);
  if (!membership) {
    throw new Error('Không tìm thấy đăng ký thành viên');
  }

  if (membership.status !== 'active') {
    throw new Error('Đăng ký thành viên không hoạt động');
  }

  // Populate package to get training_sessions
  await membership.populate('package_id');
  const packageItem = membership.package_id as any;

  // Reset sessions
  membership.available_sessions = packageItem.training_sessions || 0;
  membership.used_sessions = 0;
  membership.last_sessions_reset = new Date();
  membership.updated_at = new Date();
  await membership.save();

  // Populate and return updated membership
  await membership.populate('member_id', 'name email');

  return {
    _id: (membership._id as Types.ObjectId).toString(),
    member: {
      _id: (membership.member_id as any)._id.toString(),
      name: (membership.member_id as any).name,
      email: (membership.member_id as any).email,
    },
    package: {
      _id: packageItem._id.toString(),
      name: packageItem.name,
      price: packageItem.price,
      duration: packageItem.duration,
      training_sessions: packageItem.training_sessions,
    },
    payment_id: membership.payment_id.toString(),
    start_date: membership.start_date,
    end_date: membership.end_date,
    auto_renew: membership.auto_renew,
    status: membership.status,
    available_sessions: membership.available_sessions,
    used_sessions: membership.used_sessions,
    last_sessions_reset: membership.last_sessions_reset,
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
};

// Check for expired memberships and update their status
export const checkAndUpdateExpiredMemberships = async (): Promise<number> => {
  const today = new Date();
  const expiredMemberships = await Membership.find({
    end_date: { $lt: today },
    status: 'active',
  });

  for (const membership of expiredMemberships) {
    membership.status = 'expired';
    membership.updated_at = today;
    await membership.save();
  }

  return expiredMemberships.length;
};

// Get membership statistics
export const getMembershipStats = async (): Promise<{
  total: number;
  active: number;
  expired: number;
  pending: number;
  paused: number;
  autoRenew: number;
  availableSessions: number;
  usedSessions: number;
}> => {
  const total = await Membership.countDocuments();
  const active = await Membership.countDocuments({ status: 'active' });
  const expired = await Membership.countDocuments({ status: 'expired' });
  const pending = await Membership.countDocuments({ status: 'pending' });
  const paused = await Membership.countDocuments({ status: 'paused' });
  const autoRenew = await Membership.countDocuments({ auto_renew: true });

  // Calculate sum of available and used sessions
  const sessions = await Membership.aggregate([
    {
      $group: {
        _id: null,
        availableSessions: { $sum: '$available_sessions' },
        usedSessions: { $sum: '$used_sessions' },
      },
    },
  ]);

  const availableSessions = sessions.length > 0 ? sessions[0].availableSessions : 0;
  const usedSessions = sessions.length > 0 ? sessions[0].usedSessions : 0;

  return {
    total,
    active,
    expired,
    pending,
    paused,
    autoRenew,
    availableSessions,
    usedSessions,
  };
};

export default {
  getAllMemberships,
  getMembershipById,
  getMembershipsByMemberId,
  createMembership,
  updateMembership,
  updateMembershipStatus,
  deleteMembership,
  updateTrainingSessions,
  resetTrainingSessions,
  checkAndUpdateExpiredMemberships,
  getMembershipStats,
};