//types/member.ts

export interface MemberResponse {
  _id: string;
  name: string;
  avatar?: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  role: {
    _id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'banned';
  isVerified: boolean;
  created_at: Date;
  updated_at: Date;
}


export interface MemberQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'pending' | 'banned';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
