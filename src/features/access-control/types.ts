import type { MemberInviteManagementData } from "@/features/member-invite/types";

export type AccessControlTabKey =
  | "permissions"
  | "invites"
  | "pending_access";

export type AccessControlPermissionDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type AccessControlRoleDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type AccessControlUserRoleAssignment = {
  id: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  assignedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export type AccessControlUserPermissionAssignment = {
  id: string;
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  grantedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export type AccessControlWorkspaceUser = {
  userId: string;
  displayName: string;
  email: string | null;
  status: string;
  activeRoleCodes: string[];
  activeRoleNames: string[];
  roleSummary: string;
  activePermissionCodes: string[];
  roles: AccessControlUserRoleAssignment[];
  permissions: AccessControlUserPermissionAssignment[];
  lastUpdatedAt: string | null;
};

export type AccessControlPermissionsData = {
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  currentUserId: string;
  canManage: boolean;
  summary: {
    totalUsers: number;
    totalRoleAssignments: number;
    activeRoleAssignments: number;
    totalPermissionAssignments: number;
    activePermissionAssignments: number;
  };
  roleDefinitions: AccessControlRoleDefinition[];
  permissions: AccessControlPermissionDefinition[];
  users: AccessControlWorkspaceUser[];
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
      tab: "permissions";
      data: AccessControlPermissionsData;
    }
  | {
      tab: "invites";
      data: AccessControlInvitesData;
    }
  | {
      tab: "pending_access";
      data: AccessControlPendingAccessData;
    };


