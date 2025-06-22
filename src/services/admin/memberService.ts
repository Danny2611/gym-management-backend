import Member from '../../models/Member';
import Role from '../../models/Role';
import { Types } from 'mongoose';
import { MemberQueryOptions, MemberResponse } from '../../types/member';


//Get all members with pagination, filtering and sorting
  export const getAllMembers = async (
    options: MemberQueryOptions
  ): Promise<{
    members: MemberResponse[];
    totalMembers: number;
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

    // Search by name, email or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const totalMembers = await Member.countDocuments(query);
    const totalPages = Math.ceil(totalMembers / limit);

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.created_at = -1;
    }

    const members = await Member.find(query)
      .populate('role', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const memberResponses: MemberResponse[] = members.map(member => ({
      _id: member._id.toString(),
      name: member.name,
      avatar: member.avatar,
      email: member.email,
      gender: member.gender,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      address: member.address,
      role: {
        _id: member.role._id.toString(),
        name: (member.role as any).name, // Type assertion to fix TS warning
      },
      status: member.status,
      isVerified: member.isVerified,
      created_at: member.created_at,
      updated_at: member.updated_at,
    }));

    return {
      members: memberResponses,
      totalMembers,
      totalPages,
      currentPage: page,
    };
  };


// get member by ID
export const getMemberById = async (memberId: string): Promise<MemberResponse> => {

  const member = await Member.findById(memberId)
    .populate('role', 'name')
    .lean();
  
  if (!member) {
    throw new Error('Không tìm thấy hội viên');
  }
  
  return {
    _id: member._id.toString(),
    name: member.name,
    avatar: member.avatar,
    email: member.email,
    gender: member.gender,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    address: member.address,
    role: {
      _id: member.role._id.toString(),
        name: (member.role as any).name // Type assertion here
    },
    status: member.status,
    isVerified: member.isVerified,
    created_at: member.created_at,
    updated_at: member.updated_at
  };
};

//Create a new member
export const createMember = async (memberData: {
  name: string;
  email: string;
  password: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  dateOfBirth?: Date;
  address?: string;

  status?: 'active' | 'inactive' | 'pending' | 'banned';
  isVerified?: boolean;
}): Promise<MemberResponse> => {
  // Check if email already exists
  const existingMember = await Member.findOne({ email: memberData.email });
  if (existingMember) {
    throw new Error('Email đã tồn tại');
  }
  
    // Tìm vai trò mặc định
    const defaultRole = await Role.findOne({ name: 'Member' });
    if (!defaultRole) {
      throw new Error('Không tìm thấy vai trò mặc định');
    }
  // Create new member
  const member = await Member.create({
    name: memberData.name,
    email: memberData.email,
    password: memberData.password, // This will be hashed by a pre-save hook in the model
    gender: memberData.gender,
    phone: memberData.phone,
    dateOfBirth: memberData.dateOfBirth,
    address: memberData.address,
    role: defaultRole._id,
    status: memberData.status || 'active',
    isVerified: memberData.isVerified || false,
  });
  
  // Populate role and return member
  await member.populate('role', 'name');
  
  return {
    _id: member._id.toString(),
    name: member.name,
    avatar: member.avatar,
    email: member.email,
    gender: member.gender,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    address: member.address,
    role: {
      _id: member.role._id.toString(),
        name: (member.role as any).name // Type assertion here
    },
    status: member.status,
    isVerified: member.isVerified,
    created_at: member.created_at,
    updated_at: member.updated_at
  };
};

/**
 * Update member by ID
 */
export const updateMember = async (
  memberId: string,
  updateData: {
    name?: string;
    avatar?: string;
    email?: string;
    gender?: 'male' | 'female' | 'other';
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    roleId?: string;
    isVerified?: boolean;
  }
): Promise<MemberResponse> => {
  
  const member = await Member.findById(memberId);
  if (!member) {
   throw new Error('Không tìm thấy hội viên');
  }
  
  // Check if email is being updated and already exists
  if (updateData.email && updateData.email !== member.email) {
    const existingMember = await Member.findOne({ email: updateData.email });
    if (existingMember) {
    throw new Error('Mail đã tồn tại');
    }
  }
  
  // Validate role ID if provided
  if (updateData.roleId) {
    
    // Check if role exists
    const role = await Role.findById(updateData.roleId);
    if (!role) {
      throw new Error('Không tìm thấy Role');
    }
  }
  
  // Update fields
  if (updateData.name) member.name = updateData.name;
  if (updateData.avatar) member.avatar = updateData.avatar;
  if (updateData.email) member.email = updateData.email;
  if (updateData.gender) member.gender = updateData.gender;
  if (updateData.phone) member.phone = updateData.phone;
  if (updateData.dateOfBirth) member.dateOfBirth = updateData.dateOfBirth;
  if (updateData.address) member.address = updateData.address;
  if (updateData.roleId) member.role = new Types.ObjectId(updateData.roleId);
  if (updateData.isVerified !== undefined) member.isVerified = updateData.isVerified;
  
  member.updated_at = new Date();
  await member.save();
  
  // Populate role and return updated member
  await member.populate('role', 'name');
  
  return {
    _id: member._id.toString(),
    name: member.name,
    avatar: member.avatar,
    email: member.email,
    gender: member.gender,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    address: member.address,
    role: {
      _id: member.role._id.toString(),
        name: (member.role as any).name // Type assertion here
    },
    status: member.status,
    isVerified: member.isVerified,
    created_at: member.created_at,
    updated_at: member.updated_at
  };
};

/**
 * Update member status
 */
export const updateMemberStatus = async (
  memberId: string,
  status: 'active' | 'inactive' | 'pending' | 'banned'
): Promise<MemberResponse> => {

  
  const member = await Member.findById(memberId);
  if (!member) {
    throw new Error('Không tìm thấy hội viên');
  }
  
  // Update status
  member.status = status;
  member.updated_at = new Date();
  await member.save();
  
  // Populate role and return updated member
  await member.populate('role', 'name');
  
  return {
    _id: member._id.toString(),
    name: member.name,
    avatar: member.avatar,
    email: member.email,
    gender: member.gender,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    address: member.address,
    role: {
      _id: member.role._id.toString(),
        name: (member.role as any).name // Type assertion here
    },
    status: member.status,
    isVerified: member.isVerified,
    created_at: member.created_at,
    updated_at: member.updated_at
  };
};

/**
 * Delete member by ID
 */
export const deleteMember = async (memberId: string): Promise<boolean> => {
  
  
  const member = await Member.findById(memberId);
  if (!member) {
    throw new Error('Không tìm thấy hội viên');
  }
  
  await Member.deleteOne({ _id: memberId });
  return true;
};

/**
 * Get member statistics
 */
export const getMemberStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  pending: number;
  banned: number;
  verified: number;
  unverified: number;
}> => {
  const total = await Member.countDocuments();
  const active = await Member.countDocuments({ status: 'active' });
  const inactive = await Member.countDocuments({ status: 'inactive' });
  const pending = await Member.countDocuments({ status: 'pending' });
  const banned = await Member.countDocuments({ status: 'banned' });
  const verified = await Member.countDocuments({ isVerified: true });
  const unverified = await Member.countDocuments({ isVerified: false });
  
  return {
    total,
    active,
    inactive,
    pending,
    banned,
    verified,
    unverified
  };
};


export default {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    getMemberStats,
    updateMemberStatus,
}
