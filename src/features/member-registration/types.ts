import type { Tables } from "@/types/database";

export type ChurchMemberRegistration = Tables<"church_member_registrations">;
export type ChurchMemberRegistrationHouseholdMember =
  Tables<"church_member_registration_household_members">;
export type ChurchMemberRegistrationSettings =
  Tables<"church_member_registration_settings">;

export type RegistrationStatus =
  | "pending"
  | "needs_member_duplicate_review"
  | "needs_household_duplicate_review"
  | "needs_review"
  | "approved"
  | "rejected"
  | "converted"
  | "merged";

export type HouseholdAction =
  | "self_only"
  | "existing_household"
  | "new_household"
  | "not_sure";

export type RegistrationHouseholdMemberStatus =
  | "pending"
  | "needs_review"
  | "matched"
  | "created"
  | "skipped";

export type RegistrationWithFamily = ChurchMemberRegistration & {
  family_members: ChurchMemberRegistrationHouseholdMember[];
};

export type RegistrationListItem = ChurchMemberRegistration & {
  family_count: number;
};

export type PublicRegistrationResult = {
  ok: true;
  registrationId: string;
  accountSetupRequested?: boolean;
  accountSetupStatus?: string;
  loginEmail?: string | null;
} | {
  ok: false;
  error: string;
};

export type ConversionResult = {
  ok: true;
  memberId: string;
  householdId?: string | null;
  familyMemberIds: string[];
  message?: string;
} | {
  ok: false;
  error: string;
};

export type DuplicateCandidate = {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  reason: string;
};

export type RegistrationDuplicateState = {
  memberCandidates: DuplicateCandidate[];
  householdCandidates: {
    householdId: string;
    householdName: string;
    phone: string | null;
    email: string | null;
    reason: string;
  }[];
};
