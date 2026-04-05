export type LeadershipTabKey =
  | "overview"
  | "requests"
  | "active_leaders";

export type LeadershipOverviewData = {
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  pendingRequestCount: number;
  approvedLeaderCount: number;
  departmentsWithLeadersCount: number;
};

export type DepartmentLeadershipRequestItem = {
  id: string;
  churchId: string;
  inviteId: string | null;
  userId: string | null;
  memberId: string | null;
  departmentId: string;
  departmentName: string;
  requestedRoleCode: string | null;
  requestedRoleName: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewerNote: string | null;
  source: string;
  memberName: string | null;
  memberEmail: string | null;
  memberCode: string | null;
  approvalStatus: string | null;
  approvalStage: string | null;
  approvalRequestId: string | null;
};

export type LeadershipRequestsData = {
  churchId: string;
  churchSlug: string;
  requests: DepartmentLeadershipRequestItem[];
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
};

export type ActiveDepartmentLeaderItem = {
  id: string;
  churchId: string;
  departmentId: string;
  departmentName: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  memberCode: string | null;
  leadershipRoleCode: string | null;
  leadershipRoleName: string;
  isPrimary: boolean;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

export type ActiveDepartmentLeadersData = {
  churchId: string;
  churchSlug: string;
  leaders: ActiveDepartmentLeaderItem[];
};

export type LeadershipTabData =
  | {
      tab: "overview";
      data: LeadershipOverviewData;
    }
  | {
      tab: "requests";
      data: LeadershipRequestsData;
    }
  | {
      tab: "active_leaders";
      data: ActiveDepartmentLeadersData;
    };

