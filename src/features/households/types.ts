export interface HouseholdListItem {
  id: string;
  church_id: string;
  household_name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  head_of_household_id?: string | null;
  head_of_household_name?: string | null;
  member_count: number;
  created_at?: string | null;
}

export interface HouseholdMemberItem {
  id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  phone?: string | null;
  email?: string | null;
  membership_status: string;
  household_role?: "head" | "spouse" | "child" | "relative" | "guardian" | "other" | null;
}

export interface HouseholdDetail {
  household: HouseholdListItem;
  members: HouseholdMemberItem[];
}
