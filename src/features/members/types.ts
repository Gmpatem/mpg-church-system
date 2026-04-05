export interface MemberListItem {
  id: string;
  church_id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  member_code?: string | null;
  membership_status: string;
  membership_type?: string | null;
  household_id?: string | null;
  household_role?: "head" | "spouse" | "child" | "relative" | "guardian" | "other" | null;
  gender?: string | null;
  date_joined?: string | null;
  created_at?: string | null;
}

export interface MemberDirectoryFilters {
  q?: string;
  status?: string;
  householdId?: string;
  department?: string;
  membershipType?: string;
  sort?: "name_asc" | "joined_desc" | "status_asc";
}

export interface CreateMemberInput {
  churchId: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | null;
  membershipStatus?: "active" | "inactive" | "visitor" | "transferred";
  membershipType?: "regular" | "adherent" | "child" | "youth" | "senior" | null;
  memberCode?: string | null;
  householdId?: string | null;
  householdRole?: "head" | "spouse" | "child" | "relative" | "guardian" | "other" | null;
  dateJoined?: string | null;
  dateOfBirth?: string | null;
  baptismDate?: string | null;
  transferInDate?: string | null;
  transferOutDate?: string | null;
  previousChurch?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  profession?: string | null;
  maritalStatus?: "single" | "married" | "widowed" | "divorced" | "separated" | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  departmentId?: string | null;
}

export interface UpdateMemberInput extends CreateMemberInput {
  memberId: string;
}

export interface MemberMembershipEvent {
  id: string;
  type: "created" | "status_change" | "transfer_in" | "transfer_out" | "baptism" | "joined";
  title: string;
  description: string | null;
  occurred_at: string;
}

export interface MemberProfile {
  member: any;
  household: any | null;
  departments: Array<{
    id: string;
    department_name: string;
    role_in_department: string | null;
    joined_date: string | null;
  }>;
  statusHistory: Array<{
    id: string;
    old_status: string | null;
    new_status: string;
    reason: string | null;
    created_at: string;
  }>;
  membershipEvents: MemberMembershipEvent[];
}
