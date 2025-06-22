import Membership, { IMembership } from '~/models/Membership';
import Member from '~/models/Member';
import Package from '~/models/Package';
import Payment from '~/models/Payment';
import { Types } from 'mongoose';
import { isBefore, subWeeks } from 'date-fns'; 
// Define types for query options and response
export interface MembershipQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'expired' | 'pending' | 'paused';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MembershipResponse {
  _id: string;
  member: {
    _id: string;
    name: string;
    email: string;
    avatar:string;
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
    sortBy,
    sortOrder,
  } = options;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
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
    .populate('member_id', 'name email avatar')
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
      avatar: (membership.member_id as any).avatar
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
    .populate('member_id', 'name email avatar')
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
      avatar: (membership.member_id as any).avatar,
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



export const deleteMembership = async (membershipId: string): Promise<boolean> => {
   console.log(membershipId);
  const membership = await Membership.findById(membershipId);

  if (!membership) {
    throw new Error('Không tìm thấy id của membership');
  }

  // Kiểm tra điều kiện: status === 'pending' và created_at > 1 tuần trước
  const oneWeekAgo = subWeeks(new Date(), 1);
  const isOlderThanAWeek = isBefore(membership.created_at, oneWeekAgo);

  if (membership.status !== 'pending' || !isOlderThanAWeek) {
    throw new Error('Chỉ được xóa các đăng ký đang chờ và đã tạo hơn 1 tuần');
  }

  await Membership.deleteOne({ _id: membershipId });
  return true;
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
  deleteMembership,
  getMembershipStats,
};