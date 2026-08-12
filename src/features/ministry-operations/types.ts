export type MinistryScopeType = "department" | "small_group";
export type MinistryDutyStatus = "scheduled" | "confirmed" | "served" | "missed" | "replacement_requested" | "replaced" | "cancelled";
export type MinistryTaskStatus = "open" | "in_progress" | "done" | "cancelled";
export type MinistryPriority = "low" | "normal" | "high";

export type MinistryActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export type MinistryPerson = {
  id: string;
  name: string;
  initials: string;
  memberCode: string | null;
  email: string | null;
  phone: string | null;
  roleTitle?: string | null;
  householdName?: string | null;
};

export type MinistryDutyType = {
  id: string;
  name: string;
  systemKey: string | null;
  iconKey: string | null;
  description: string | null;
  requiresAttendanceSupport: boolean;
  isActive: boolean;
};

export type MinistryDutyAssignment = {
  id: string;
  dutyTypeId: string | null;
  dutyName: string;
  dutySystemKey: string | null;
  requiresAttendanceSupport: boolean;
  memberId: string;
  memberName: string;
  memberInitials: string;
  serviceDate: string;
  startsAt: string | null;
  endsAt: string | null;
  status: MinistryDutyStatus;
  leaderNote: string | null;
  memberNote: string | null;
  replacementReason: string | null;
  confirmedAt: string | null;
  servedAt: string | null;
  requestedReplacementAt: string | null;
};

export type MinistryTask = {
  id: string;
  title: string;
  description: string | null;
  assignedToMemberId: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  priority: MinistryPriority;
  status: MinistryTaskStatus;
};

export type MinistryReport = {
  id: string;
  title: string;
  reportType: string;
  periodStart: string | null;
  periodEnd: string | null;
  summary: string | null;
  status: "draft" | "submitted" | "reviewed";
  submittedAt: string | null;
};

export type MinistryOperationsData = {
  church: {
    id: string;
    slug: string;
    name: string | null;
  };
  scope: {
    type: MinistryScopeType;
    id: string;
    name: string;
    subtitle: string;
    code: string | null;
  };
  access: {
    canManage: boolean;
    viewerMemberId: string | null;
  };
  stats: {
    members: number;
    upcomingDuties: number;
    openTasks: number;
    reportsDue: number;
  };
  members: MinistryPerson[];
  dutyTypes: MinistryDutyType[];
  duties: MinistryDutyAssignment[];
  tasks: MinistryTask[];
  reports: MinistryReport[];
};

export type MemberMinistryPortalData = {
  church: {
    slug: string;
    name: string | null;
  };
  member: {
    id: string;
    name: string;
  };
  ministries: Array<{
    id: string;
    scopeType: MinistryScopeType;
    scopeId: string;
    name: string;
    roleTitle: string | null;
    href: string;
    upcomingDutyCount: number;
    nextDutyLabel: string | null;
  }>;
  duties: MinistryDutyAssignment[];
};

export type MemberDutyDetailData = {
  churchSlug: string;
  churchName: string | null;
  memberId: string;
  duty: MinistryDutyAssignment;
  scope: {
    type: MinistryScopeType;
    id: string;
    name: string;
  };
  canOpenAttendanceSupport: boolean;
};

export type AttendanceSupportMember = {
  id: string;
  name: string;
  initials: string;
  memberCode: string | null;
  householdName: string | null;
  departmentLabel: string | null;
};

export type AttendanceSupportData = {
  churchSlug: string;
  churchName: string | null;
  assignmentId: string;
  occurrence: {
    id: string;
    title: string;
    occurrenceDate: string;
  } | null;
  duty: MinistryDutyAssignment;
  stats: {
    present: number;
    notMarkedYet: number;
    visitors: number;
    review: number;
  };
  notMarkedMembers: AttendanceSupportMember[];
};