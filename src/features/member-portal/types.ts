import type { CalendarEvent } from "@/features/calendar/types";
import type { MemberMinistryPortalData } from "@/features/ministry-operations/types";
export type { CalendarEvent };

export type MemberPortalTabKey =
  | "overview"
  | "ministries"
  | "profile"
  | "giving"
  | "departments"
  | "events"
  | "calendar";

export type MemberPortalProfileSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_language: "en" | "fr" | null;
};

export type MemberPortalHouseholdSummary = {
  id: string;
  household_name: string;
} | null;

export type MemberPortalMemberSummary = {
  id: string;
  church_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  member_code: string | null;
  membership_status: string;
  membership_type: string | null;
  date_joined: string | null;
  baptism_date: string | null;
  household_id: string | null;
};

export type MemberPortalIdentity = {
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  profile: MemberPortalProfileSummary | null;
  member: MemberPortalMemberSummary;
  household: MemberPortalHouseholdSummary;
};

export type MemberPortalFoundationData = {
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  profile: MemberPortalProfileSummary | null;
  linkStatus: "linked" | "unlinked";
  identity: MemberPortalIdentity | null;
  unreadNotificationCount: number;
  requiresPasswordChange?: boolean;
};

export type MemberPortalOverviewNotificationItem = {
  id: string;
  title: string;
  description: string;
  href?: string | null;
  createdAt?: string | null;
  isRead?: boolean;
  eventType?: string | null;
};

export type MemberPortalUpcomingEventItem = {
  id: string;
  title: string;
  event_type: string;
  location: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
};

export type MemberPortalOverviewData = {
  identity: MemberPortalIdentity;
  activeDepartmentCount: number;
  activeRoleCount: number;
  upcomingDutyCount: number;
  attendance: {
    lastSeenAt: string | null;
    lastMethod: string | null;
    presentCountLast90Days: number;
    currentMonthPresent: number;
  };
  upcomingEvents: MemberPortalUpcomingEventItem[];
  notifications: MemberPortalOverviewNotificationItem[];
};

export type MemberPortalProfileData = {
  identity: MemberPortalIdentity;
  fields: {
    fullName: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    maritalStatus: string | null;
    baptismDate: string | null;
    dateJoined: string | null;
    membershipStatus: string;
    membershipType: string | null;
    memberCode: string | null;
    previousChurch: string | null;
    householdName: string | null;
  };
};

export type MemberPortalRoleItem = {
  id: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  roleDescription: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

export type MemberPortalDepartmentItem = {
  id: string;
  departmentId: string | null;
  departmentName: string;
  departmentCode: string | null;
  roleTitle: string | null;
  isActive: boolean;
  startDate: string | null;
};

export type MemberPortalDepartmentsData = {
  identity: MemberPortalIdentity;
  activeRoleCount: number;
  inactiveRoleCount: number;
  activeDepartmentCount: number;
  inactiveDepartmentCount: number;
  roles: MemberPortalRoleItem[];
  departments: MemberPortalDepartmentItem[];
};

export type MemberPortalGivingItem = {
  id: string;
  amount: number;
  inflowType: string | null;
  inflowDate: string;
  note: string | null;
  referenceNumber: string | null;
};

export type MemberPortalGivingData = {
  totalGiving: number;
  yearToDateTotal: number;
  currentMonthTotal: number;
  currentMonthCount: number;
  totalTithe: number;
  totalOffering: number;
  totalDonation: number;
  recent: MemberPortalGivingItem[];
};

export type MemberPortalTabData =
  | {
      tab: "overview";
      data: MemberPortalOverviewData;
    }
  | {
      tab: "ministries";
      data: MemberMinistryPortalData;
    }
  | {
      tab: "profile";
      data: MemberPortalProfileData;
    }
  | {
      tab: "departments";
      data: MemberPortalDepartmentsData;
    }
  | {
      tab: "giving";
      data: MemberPortalGivingData;
    }
  | {
      tab: "events";
      data: CalendarEvent[];
    }
  | {
      tab: "calendar";
      data: CalendarEvent[];
    };




