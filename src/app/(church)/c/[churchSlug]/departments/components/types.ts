import type { DepartmentFinanceWorkspaceData } from "@/features/department-finance/types";

export type DepartmentTabKey =
  | "overview"
  | "action-plan"
  | "activities"
  | "people"
  | "budget"
  | "documents";

export const departmentTabKeys: DepartmentTabKey[] = [
  "overview",
  "action-plan",
  "activities",
  "people",
  "budget",
  "documents",
];

export type SelectOption = {
  value: string;
  label: string;
};

export type DepartmentDialog =
  | null
  | { type: "create-department" }
  | { type: "edit-department"; departmentId: string }
  | { type: "add-member"; departmentId: string }
  | { type: "edit-member-assignment"; assignmentId: string }
  | { type: "remove-member"; assignmentId: string }
  | { type: "create-activity"; departmentId: string }
  | { type: "request-funds"; departmentId: string };

export type DepartmentViewModel = {
  id: string;
  churchId: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  memberCount: number;
  activeMemberCount: number;
  inactiveMemberCount: number;
  leaderCount: number;
  eventCount: number;
  announcementCount: number;
  pendingRequestCount: number;
  balance: number | null;
};

export type PersonViewModel = {
  id: string;
  assignmentId: string;
  departmentId: string;
  name: string;
  initials: string;
  memberCode: string | null;
  email: string | null;
  phone: string | null;
  membershipStatus: string | null;
  roleTitle: string | null;
  startDate: string | null;
  isActive: boolean;
};

export type LeadershipAssignmentViewModel = {
  id: string;
  departmentId: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  memberCode: string | null;
  roleCode: string | null;
  roleName: string;
  isPrimary: boolean;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

export type LeadershipRequestViewModel = {
  id: string;
  departmentId: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  requestedRoleCode: string | null;
  requestedRoleName: string;
  status: string;
  requestedAt: string | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
};

export type ActivityViewModel = {
  id: string;
  source: "event" | "announcement";
  title: string;
  description: string | null;
  category: string;
  status: string;
  workflowState: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  createdByName: string | null;
  approvalStatus: string | null;
  approvalStage: string | null;
};

export type ActionPlanItemViewModel = {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
  progress: number | null;
  assignedToName: string | null;
  relatedEventId: string | null;
};

export type ActionPlanData = {
  isConfigured: boolean;
  items: ActionPlanItemViewModel[];
  unavailableReason: string | null;
};

export type DocumentsData = {
  isConfigured: false;
  categories: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  unavailableReason: string;
};

export type DepartmentWorkspaceBundle = {
  department: DepartmentViewModel;
  people: PersonViewModel[];
  leadershipAssignments: LeadershipAssignmentViewModel[];
  leadershipRequests: LeadershipRequestViewModel[];
  activities: ActivityViewModel[];
  actionPlan: ActionPlanData;
  budget: DepartmentFinanceWorkspaceData | null;
  documents: DocumentsData;
  eventOptions: Array<{
    id: string;
    title: string;
    start: string;
  }>;
};

export type DepartmentWorkspaceStats = {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  assignedMembers: number;
  unassignedDepartments: number;
  eventLinkedDepartments: number;
  pendingFundRequests: number;
};

export type DepartmentWorkspaceCapabilities = {
  canManageDepartments: boolean;
  canManageAssignments: boolean;
  canManageActivities: boolean;
  canManageAnnouncements: boolean;
  canMutateActionPlan: boolean;
  canUseDocuments: boolean;
};

export type DepartmentsWorkspaceData = {
  church: {
    id: string;
    slug: string;
    name: string;
  };
  stats: DepartmentWorkspaceStats;
  departments: DepartmentViewModel[];
  selectedDepartmentId: string | null;
  selectedBundle: DepartmentWorkspaceBundle | null;
  options: {
    departments: Array<{
      id: string;
      name: string;
      code: string | null;
      is_active: boolean;
    }>;
    members: Array<{
      id: string;
      label: string;
      member_code: string | null;
      membership_status: string | null;
    }>;
  };
  capabilities: DepartmentWorkspaceCapabilities;
};

export type DepartmentFilterState = {
  search: string;
  status: string;
  page: number;
};

export type ActionPlanState = {
  search: string;
  status: string;
  priority: string;
  page: number;
};

export type ActivitiesState = {
  search: string;
  status: string;
  source: string;
  page: number;
};

export type PeopleState = {
  search: string;
  role: string;
  status: string;
  page: number;
};

export type BudgetState = {
  search: string;
  kind: string;
  status: string;
  page: number;
};

export type DocumentsState = {
  search: string;
  category: string;
  status: string;
  page: number;
};

export type DepartmentsWorkspaceState = {
  activeTab: DepartmentTabKey;
  selectedDepartmentId: string | null;
  selectedActionItemId: string | null;
  selectedActivityId: string | null;
  selectedPersonId: string | null;
  selectedBudgetEntryId: string | null;
  selectedDocumentId: string | null;
  overviewState: DepartmentFilterState;
  actionPlanState: ActionPlanState;
  activitiesState: ActivitiesState;
  peopleState: PeopleState;
  budgetState: BudgetState;
  documentsState: DocumentsState;
};
