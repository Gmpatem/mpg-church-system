import type { MemberInviteManagementData } from "@/features/member-invite/types";

export type AccessControlTabKey =
  | "overview"
  | "roles"
  | "page_access"
  | "invites"
  | "pending_access"
  | "activity_log";

export type AccessControlPermissionDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type AccessControlOverviewData = {
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  totalPermissionAssignments: number;
  activePermissionAssignments: number;
  totalPermissionDefinitions: number;
  roleCounts: {
    pastors: number;
    churchAdmins: number;
    techTeam: number;
    clerks: number;
    churchSecretaries: number;
  };
  permissions: AccessControlPermissionDefinition[];
};

export type AccessControlInvitesData = MemberInviteManagementData;

export type PendingAccessRequestItem = {
  id: string;
  churchId: string;
  inviteId: string | null;
  userId: string | null;
  memberId: string | null;
  requestedRoleId: string | null;
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
  requesterProfileName: string | null;
  requesterProfileEmail: string | null;
  approvalStatus: string | null;
  approvalStage: string | null;
  approvalRequestId: string | null;
};

export type AccessControlPendingAccessData = {
  churchId: string;
  churchSlug: string;
  requests: PendingAccessRequestItem[];
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
};

export type AccessControlTabData =
  | {
      tab: "overview";
      data: AccessControlOverviewData;
    }
  | {
      tab: "invites";
      data: AccessControlInvitesData;
    }
  | {
      tab: "pending_access";
      data: AccessControlPendingAccessData;
    }
  | {
      tab: "roles" | "page_access" | "activity_log";
      data: null;
    };


