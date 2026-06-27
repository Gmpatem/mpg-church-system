export type DashboardCapabilities = {
  canManageMembers: boolean;
  canCreateEvents: boolean;
  canManageTreasury: boolean;
  canCreateAnnouncements: boolean;
  canViewAccessControl: boolean;
  canViewApprovals: boolean;
  canViewOffice: boolean;
  canViewReports: boolean;
  canViewSettings: boolean;
  canViewLeadership: boolean;
  canViewAudit: boolean;
};

export type DashboardChurch = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};

export type DashboardPulse = {
  memberCount: number;
  membersAddedThisMonth: number;
  householdCount: number;
  householdsWithoutHead: number;
  activeMinistryCount: number;
  upcomingEventCount: number;
  attentionCount: number;
};

export type DashboardEvent = {
  id: string;
  title: string;
  eventType: string;
  departmentName: string | null;
  location: string | null;
  startDatetime: string;
  status: string;
  workflowState: string | null;
  dateKey: string;
  group: "today" | "tomorrow" | "later";
  href: string;
};

export type DashboardMember = {
  id: string;
  name: string;
  email: string | null;
  membershipStatus: string | null;
  createdAt: string;
  href: string;
};

export type DashboardIndicator = {
  key:
    | "profiles_needing_completion"
    | "members_without_households"
    | "households_without_heads"
    | "departments_without_leaders"
    | "unassigned_members";
  count: number;
  href: string;
};

export type DashboardActionItem = {
  key:
    | "access_requests"
    | "leadership_requests"
    | "announcements_awaiting_publication"
    | "event_approvals"
    | "profiles_needing_completion"
    | "other_approvals";
  count: number;
  href: string;
};

export type DashboardUpdate = {
  id: string;
  type:
    | "member_added"
    | "treasury_entry"
    | "department_created"
    | "announcement_published"
    | "event_created";
  entityName: string;
  detail: string | null;
  createdAt: string;
  href: string;
  amount?: number;
};

export type DashboardMinistryBreakdown = {
  id: string;
  name: string;
  count: number;
  color: string;
};

export type DashboardMonthly = {
  eventsHeld: number;
  newMinistries: number;
};

export type DashboardRoutes = {
  members: string;
  households: string;
  ministries: string;
  events: string;
  calendar: string;
  attention: string;
  reviewAll: string | null;
  latestUpdates: string | null;
  auditTrail: string | null;
};

export type DashboardData = {
  church: DashboardChurch;
  generatedAt: string;
  todayKey: string;
  pulse: DashboardPulse;
  upcomingEvents: DashboardEvent[];
  recentMembers: DashboardMember[];
  followUpIndicators: DashboardIndicator[];
  actionItems: DashboardActionItem[];
  updates: DashboardUpdate[];
  ministries: DashboardMinistryBreakdown[];
  monthly: DashboardMonthly;
  capabilities: DashboardCapabilities;
  routes: DashboardRoutes;
};
