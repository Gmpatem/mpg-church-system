export type SmallGroupsTabKey =
  | "overview"
  | "groups"
  | "meetings"
  | "members"
  | "outreach";

export type MeetingSubTab = "upcoming" | "past" | "cancelled";
export type OutreachSubTab = "all" | "planned" | "in-progress" | "completed" | "follow-up";

export type SmallGroupsDialog =
  | { type: "create-group" }
  | { type: "edit-group"; groupId: string }
  | { type: "add-member"; groupId?: string }
  | { type: "schedule-meeting"; groupId?: string }
  | { type: "record-attendance"; meetingId: string }
  | { type: "create-outreach"; groupId?: string }
  | {
      type: "generate-report";
      reportKind?: "attendance" | "growth" | "members" | "outreach";
      groupId?: string;
    }
  | { type: "notes"; groupId: string }
  | { type: "change-leader"; groupId: string }
  | { type: "archive-group"; groupId: string }
  | null;

export type SelectOption = {
  value: string;
  label: string;
};

export type PersonSummary = {
  id: string;
  name: string;
  initials: string;
  email: string | null;
  phone: string | null;
  memberCode: string | null;
  membershipStatus: string | null;
  address: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
};

export type SmallGroupViewModel = {
  id: string;
  name: string;
  initials: string;
  description: string | null;
  typeLabel: string | null;
  status: "active" | "inactive" | "paused";
  neighborhood: string | null;
  location: string | null;
  address: string | null;
  leader: PersonSummary | null;
  assistantLeader: PersonSummary | null;
  memberCount: number;
  memberPreview: PersonSummary[];
  meetingDayLabel: string | null;
  meetingTimeLabel: string | null;
  nextMeetingAt: string | null;
  averageAttendancePercent: number | null;
  meetingsThisMonth: number | null;
  outreachActivityCount: number | null;
  createdAt: string | null;
};

export type SmallGroupMeetingViewModel = {
  id: string;
  groupId: string;
  groupName: string;
  groupInitials: string;
  topic: string;
  description: string | null;
  meetingType: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  conductor: PersonSummary | null;
  expectedAttendance: number | null;
  recordedAttendance: number | null;
  attendancePercent: number | null;
  status: "upcoming" | "scheduled" | "completed" | "cancelled";
  notes: string | null;
};

export type GroupMemberViewModel = {
  assignmentId: string;
  groupId: string;
  memberId: string;
  member: PersonSummary;
  role: "leader" | "assistant_leader" | "member";
  roleLabel: string;
  roleSubtitle: string;
  joinedAt: string | null;
  status: "active" | "inactive" | "invited";
  lastFourAttendance: Array<"present" | "absent" | "unknown">;
  attendancePercent: number | null;
  meetingsAttended: number | null;
  meetingsExpected: number | null;
};

export type OutreachActivityViewModel = {
  id: string;
  groupId: string | null;
  groupName: string | null;
  groupInitials: string | null;
  title: string;
  location: string | null;
  type: "Evangelism" | "Service" | "Care Visit" | "Home Visit" | "Other";
  status: "planned" | "in-progress" | "completed" | "follow-up";
  activityAt: string;
  peopleReached: number | null;
  followUpRate: number | null;
  notes: string | null;
  responsiblePerson: PersonSummary | null;
  newConnections: number | null;
  decisions: number | null;
};

export type SmallGroupsStats = {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  averageAttendanceDisplay: string;
  averageAttendancePercent: number | null;
  outreachActivities: number;
  peopleReached: number;
  newConnections: number | null;
  decisions: number | null;
  followUpRate: number | null;
};

export type AttendanceTrendPoint = {
  label: string;
  value: number;
};

export type SmallGroupsWorkspaceData = {
  churchId: string;
  churchSlug: string;
  stats: SmallGroupsStats;
  groups: SmallGroupViewModel[];
  meetings: SmallGroupMeetingViewModel[];
  groupMembers: GroupMemberViewModel[];
  outreachActivities: OutreachActivityViewModel[];
  people: PersonSummary[];
  attendanceTrend: AttendanceTrendPoint[];
  options: {
    groups: SelectOption[];
    neighborhoods: SelectOption[];
    leaders: SelectOption[];
    meetingDays: SelectOption[];
    meetingTypes: SelectOption[];
    groupRoles: SelectOption[];
    outreachTypes: SelectOption[];
  };
  backend: {
    hasSmallGroupsTables: boolean;
    connectedActions: string[];
    missingOperations: string[];
  };
};

export type GroupsState = {
  search: string;
  status: string;
  neighborhood: string;
  leaderId: string;
  meetingDay: string;
  page: number;
};

export type MeetingsState = {
  search: string;
  groupId: string;
  dateRange: string;
  meetingType: string;
  status: string;
  subTab: MeetingSubTab;
  page: number;
};

export type MembersState = {
  groupId: string;
  search: string;
  role: string;
  status: string;
  joinedRange: string;
  page: number;
};

export type OutreachState = {
  search: string;
  groupId: string;
  activityType: string;
  dateRange: string;
  status: string;
  subTab: OutreachSubTab;
  page: number;
};

export type SmallGroupsWorkspaceState = {
  activeTab: SmallGroupsTabKey;
  selectedGroupId: string | null;
  selectedMeetingId: string | null;
  selectedGroupMemberId: string | null;
  selectedOutreachId: string | null;
  groupsState: GroupsState;
  meetingsState: MeetingsState;
  membersState: MembersState;
  outreachState: OutreachState;
};

export const smallGroupsTabKeys: SmallGroupsTabKey[] = [
  "overview",
  "groups",
  "meetings",
  "members",
  "outreach",
];
