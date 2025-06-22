// export type MembershipStatus = 'active' | 'expired' | 'pending' | 'paused';

export interface MembershipDetailsResponse {
  membership_id: string; 
  member_name: string;
  member_avatar: string;
  package_id: string;
  package_name: string;
  package_category: string;
  status: string;
  days_remaining: number;
  sessions_remaining: number;
  total_sessions: number;
}

