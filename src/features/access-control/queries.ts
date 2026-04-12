import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import type { ChurchAccessContext } from "@/features/access/types";
import { getChurchInviteManagementData } from "@/features/member-invite/queries";
import { getPendingApprovalQueue } from "@/features/approvals/queries";
import type {
  AccessControlPermissionsData,
  AccessControlRoleDefinition,
  AccessControlPermissionDefinition,
  AccessControlPendingAccessData,
  AccessControlTabData,
  AccessControlTabKey,
  AccessControlUserPermissionAssignment,
  AccessControlUserRoleAssignment,
  AccessControlWorkspaceUser,
  PendingAccessRequestItem,
} from "./types";

type PermissionDefinitionRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type RoleDefinitionRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type ChurchUserRow = {
  user_id: string;
  status: string;
};

type ProfileLookupRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type MemberIdentityRow = {
  profile_id: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type RoleCodeRow = {
  role_definitions:
    | {
        code: string;
      }
    | Array<{
        code: string;
      }>
    | null;
};

type PermissionCodeRow = {
  permission_definitions:
    | {
        code: string;
      }
    | Array<{
        code: string;
      }>
    | null;
};

type RoleAssignmentRow = {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  assigned_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  role_definitions:
    | {
        id: string;
        code: string;
        name: string;
        description: string | null;
      }
    | Array<{
        id: string;
        code: string;
        name: string;
        description: string | null;
      }>
    | null;
};

type PermissionAssignmentRow = {
  id: string;
  user_id: string;
  permission_id: string;
  is_active: boolean;
  granted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  permission_definitions:
    | {
        id: string;
        code: string;
        name: string;
        description: string | null;
      }
    | Array<{
        id: string;
        code: string;
        name: string;
        description: string | null;
      }>
    | null;
};

type PendingAccessRow = {
  id: string;
  church_id: string;
  invite_id: string | null;
  user_id: string | null;
  member_id: string | null;
  requested_role_id: string | null;
  requested_role_code: string | null;
  requested_role_name: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  reviewer_note: string | null;
  source: string;
  members?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    member_code: string | null;
  } | null;
  requester_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

const ACCESS_CONTROL_VIEW_ROLE_CODES = new Set([
  "pastor",
  "church_admin",
  "tech_team",
  "clerk",
  "church_secretary",
]);

const ACCESS_CONTROL_MANAGE_ROLE_CODES = new Set([
  "pastor",
  "church_admin",
  "tech_team",
  "clerk",
  "church_secretary",
]);

type AccessControlViewState = {
  ctx: ChurchAccessContext;
  canView: boolean;
  canManage: boolean;
};

const resolveAccessControlViewState = cache(async (churchSlug: string): Promise<AccessControlViewState> => {
  const ctx = await requireChurchWorkspaceAccess(churchSlug);

  if (ctx.isPlatformAdmin) {
    return { ctx, canView: true, canManage: true };
  }

  const supabase = await createClient();

  const [roleResult, permissionResult] = await Promise.all([
    supabase
      .from("church_role_assignments")
      .select("role_definitions(code)")
      .eq("church_id", ctx.churchId)
      .eq("user_id", ctx.profile.id)
      .eq("is_active", true),
    supabase
      .from("church_permission_assignments")
      .select("permission_definitions(code)")
      .eq("church_id", ctx.churchId)
      .eq("user_id", ctx.profile.id)
      .eq("is_active", true),
  ]);

  if (roleResult.error) {
    throw new Error(roleResult.error.message);
  }

  if (permissionResult.error) {
    throw new Error(permissionResult.error.message);
  }

  const roleCodes = ((roleResult.data ?? []) as unknown as RoleCodeRow[])
    .map((row) => {
      const role = Array.isArray(row.role_definitions) ? row.role_definitions[0] : row.role_definitions;
      return role?.code;
    })
    .filter((code): code is string => Boolean(code));

  const permissionCodes = ((permissionResult.data ?? []) as unknown as PermissionCodeRow[])
    .map((row) => {
      const permission = Array.isArray(row.permission_definitions)
        ? row.permission_definitions[0]
        : row.permission_definitions;
      return permission?.code;
    })
    .filter((code): code is string => Boolean(code));

  const hasAccessControlPermission = permissionCodes.includes("access_control");
  const canView = hasAccessControlPermission || roleCodes.some((code) => ACCESS_CONTROL_VIEW_ROLE_CODES.has(code));
  const canManage =
    hasAccessControlPermission || roleCodes.some((code) => ACCESS_CONTROL_MANAGE_ROLE_CODES.has(code));

  return { ctx, canView, canManage };
});

async function requireAccessControlViewContext(churchSlug: string): Promise<ChurchAccessContext> {
  const viewState = await resolveAccessControlViewState(churchSlug);

  if (!viewState.canView) {
    redirect(`/c/${viewState.ctx.churchSlug}/dashboard`);
  }

  return viewState.ctx;
}

function formatPersonName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  displayName?: string | null
) {
  const resolvedDisplayName = displayName?.trim();
  if (resolvedDisplayName) return resolvedDisplayName;

  const joined = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim();
  return joined || null;
}

function getLatestTimestamp(values: Array<string | null | undefined>): string | null {
  let latestMs = Number.NEGATIVE_INFINITY;
  let latestValue: string | null = null;

  for (const value of values) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latestValue = value;
    }
  }

  return latestValue;
}

function resolveUserDisplayName(profile: ProfileLookupRow | undefined, userId: string) {
  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;

  const email = profile?.email?.trim();
  if (email) return email;

  const shortId = userId.length > 8 ? userId.slice(0, 8) : userId;
  return `User ${shortId}`;
}

function resolveMemberFullName(member: MemberIdentityRow | undefined) {
  const memberDisplayName = member?.display_name?.trim();
  if (memberDisplayName) return memberDisplayName;

  const fullName = [member?.first_name?.trim(), member?.last_name?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || null;
}

function resolveUserIdentity(
  profile: ProfileLookupRow | undefined,
  member: MemberIdentityRow | undefined,
  userId: string
) {
  const profileFullName = profile?.full_name?.trim();
  if (profileFullName) {
    return {
      displayName: profileFullName,
      email: profile?.email?.trim() ?? member?.email?.trim() ?? null,
    };
  }

  const memberName = resolveMemberFullName(member);
  if (memberName) {
    return {
      displayName: memberName,
      email: profile?.email?.trim() ?? member?.email?.trim() ?? null,
    };
  }

  const profileEmail = profile?.email?.trim();
  if (profileEmail) {
    return {
      displayName: profileEmail,
      email: profileEmail,
    };
  }

  return {
    displayName: resolveUserDisplayName(undefined, userId),
    email: member?.email?.trim() ?? null,
  };
}

function scoreMemberIdentity(member: MemberIdentityRow) {
  if (member.display_name?.trim()) return 3;
  if (member.first_name?.trim() || member.last_name?.trim()) return 2;
  if (member.email?.trim()) return 1;
  return 0;
}

export async function canCurrentUserViewAccessControl(
  churchSlug: string
): Promise<boolean> {
  const viewState = await resolveAccessControlViewState(churchSlug);
  return viewState.canView;
}

export async function canCurrentUserManageAccessControl(
  churchSlug: string
): Promise<boolean> {
  const viewState = await resolveAccessControlViewState(churchSlug);
  return viewState.canManage;
}

export async function getAccessControlPermissionsData(
  churchSlug: string
): Promise<AccessControlPermissionsData> {
  const viewState = await resolveAccessControlViewState(churchSlug);
  if (!viewState.canView) {
    redirect(`/c/${viewState.ctx.churchSlug}/dashboard`);
  }

  const ctx = viewState.ctx;
  const supabase = await createClient();

  const [
    roleDefinitionsResult,
    permissionDefinitionsResult,
    churchUsersResult,
    roleAssignmentsResult,
    permissionAssignmentsResult,
  ] = await Promise.all([
    supabase
      .from("role_definitions")
      .select("id, code, name, description")
      .order("name", { ascending: true }),
    supabase
      .from("permission_definitions")
      .select("id, code, name, description")
      .order("name", { ascending: true }),
    supabase.from("church_users").select("user_id, status").eq("church_id", ctx.churchId),
    supabase
      .from("church_role_assignments")
      .select(
        "id, user_id, role_id, is_active, assigned_by_user_id, created_at, updated_at, role_definitions(id, code, name, description)"
      )
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_permission_assignments")
      .select(
        "id, user_id, permission_id, is_active, granted_by_user_id, created_at, updated_at, permission_definitions(id, code, name, description)"
      )
      .eq("church_id", ctx.churchId),
  ]);

  if (roleDefinitionsResult.error) {
    throw new Error(roleDefinitionsResult.error.message);
  }

  if (permissionDefinitionsResult.error) {
    throw new Error(permissionDefinitionsResult.error.message);
  }

  if (churchUsersResult.error) {
    throw new Error(churchUsersResult.error.message);
  }

  if (roleAssignmentsResult.error) {
    throw new Error(roleAssignmentsResult.error.message);
  }

  if (permissionAssignmentsResult.error) {
    throw new Error(permissionAssignmentsResult.error.message);
  }

  const roleDefinitions = ((roleDefinitionsResult.data ?? []) as unknown as RoleDefinitionRow[]).map<AccessControlRoleDefinition>(
    (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
    })
  );

  const permissions = ((permissionDefinitionsResult.data ?? []) as unknown as PermissionDefinitionRow[]).map<AccessControlPermissionDefinition>(
    (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
    })
  );

  const churchUsers = (churchUsersResult.data ?? []) as unknown as ChurchUserRow[];
  const roleAssignments = (roleAssignmentsResult.data ?? []) as unknown as RoleAssignmentRow[];
  const permissionAssignments =
    (permissionAssignmentsResult.data ?? []) as unknown as PermissionAssignmentRow[];

  const userIds = Array.from(
    new Set([
      ...churchUsers.map((row) => row.user_id),
      ...roleAssignments.map((row) => row.user_id),
      ...permissionAssignments.map((row) => row.user_id),
    ])
  ).filter(Boolean);

  const userStatusByUserId = new Map(churchUsers.map((row) => [row.user_id, row.status]));
  const profileByUserId = new Map<string, ProfileLookupRow>();
  const memberByUserId = new Map<string, MemberIdentityRow>();

  if (userIds.length > 0) {
    const [profileResult, memberResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").in("id", userIds),
      supabase
        .from("members")
        .select("profile_id, display_name, first_name, last_name, email")
        .eq("church_id", ctx.churchId)
        .in("profile_id", userIds),
    ]);

    if (profileResult.error) {
      throw new Error(profileResult.error.message);
    }

    if (memberResult.error) {
      throw new Error(memberResult.error.message);
    }

    for (const row of (profileResult.data ?? []) as unknown as ProfileLookupRow[]) {
      profileByUserId.set(row.id, row);
    }

    for (const row of (memberResult.data ?? []) as unknown as MemberIdentityRow[]) {
      if (!row.profile_id) continue;
      const existing = memberByUserId.get(row.profile_id);
      if (!existing || scoreMemberIdentity(row) > scoreMemberIdentity(existing)) {
        memberByUserId.set(row.profile_id, row);
      }
    }
  }

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    churchName: ctx.churchName ?? null,
    currentUserId: ctx.profile.id,
    canManage: viewState.canManage,
    summary: {
      totalUsers: userIds.length,
      totalRoleAssignments: roleAssignments.length,
      activeRoleAssignments: roleAssignments.filter((row) => row.is_active).length,
      totalPermissionAssignments: permissionAssignments.length,
      activePermissionAssignments: permissionAssignments.filter((row) => row.is_active).length,
    },
    roleDefinitions,
    permissions,
    users: userIds
      .map<AccessControlWorkspaceUser>((userId) => {
        const resolvedIdentity = resolveUserIdentity(
          profileByUserId.get(userId),
          memberByUserId.get(userId),
          userId
        );
        const roles = roleAssignments
          .filter((row) => row.user_id === userId && row.is_active)
          .map<AccessControlUserRoleAssignment | null>((row) => {
            const role = Array.isArray(row.role_definitions)
              ? row.role_definitions[0]
              : row.role_definitions;
            if (!role) return null;
            return {
              id: row.id,
              roleId: row.role_id,
              roleCode: role.code,
              roleName: role.name,
              assignedByUserId: row.assigned_by_user_id,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              isActive: row.is_active,
            };
          })
          .filter((row): row is AccessControlUserRoleAssignment => Boolean(row))
          .sort((a, b) => a.roleName.localeCompare(b.roleName));

        const grantedPermissions = permissionAssignments
          .filter((row) => row.user_id === userId && row.is_active)
          .map<AccessControlUserPermissionAssignment | null>((row) => {
            const permission = Array.isArray(row.permission_definitions)
              ? row.permission_definitions[0]
              : row.permission_definitions;
            if (!permission) return null;
            return {
              id: row.id,
              permissionId: row.permission_id,
              permissionCode: permission.code,
              permissionName: permission.name,
              grantedByUserId: row.granted_by_user_id,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              isActive: row.is_active,
            };
          })
          .filter((row): row is AccessControlUserPermissionAssignment => Boolean(row))
          .sort((a, b) => a.permissionName.localeCompare(b.permissionName));

        const activeRoleNames = roles.map((row) => row.roleName);
        const activeRoleCodes = roles.map((row) => row.roleCode);
        const activePermissionCodes = grantedPermissions.map((row) => row.permissionCode);

        return {
          userId,
          displayName: resolvedIdentity.displayName,
          email: resolvedIdentity.email,
          status: userStatusByUserId.get(userId) ?? "linked_by_assignment",
          activeRoleCodes,
          activeRoleNames,
          roleSummary: activeRoleNames.length > 0 ? activeRoleNames.join(", ") : "No active role",
          activePermissionCodes,
          roles,
          permissions: grantedPermissions,
          lastUpdatedAt: getLatestTimestamp([
            ...roles.map((row) => row.updatedAt),
            ...grantedPermissions.map((row) => row.updatedAt),
          ]),
        };
      })
      .sort((a, b) => {
        const nameCompare = a.displayName.localeCompare(b.displayName);
        if (nameCompare !== 0) return nameCompare;
        return (a.email ?? "").localeCompare(b.email ?? "");
      }),
  };
}

export async function getPendingAccessRequests(
  churchSlug: string
): Promise<AccessControlPendingAccessData> {
  const ctx = await requireAccessControlViewContext(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_access_requests")
    .select(
      `
      id,
      church_id,
      invite_id,
      user_id,
      member_id,
      requested_role_id,
      requested_role_code,
      requested_role_name,
      status,
      requested_at,
      reviewed_at,
      reviewed_by_user_id,
      reviewer_note,
      source,
      members (
        first_name,
        last_name,
        display_name,
        email,
        member_code
      ),
      requester_profile:profiles!church_access_requests_user_id_fkey (
        full_name,
        email
      )
      `
    )
    .eq("church_id", ctx.churchId)
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const approvalQueue = await getPendingApprovalQueue(churchSlug, "access");

  const requests = ((data ?? []) as unknown as PendingAccessRow[]).map<PendingAccessRequestItem>((row) => {
    const member = Array.isArray(row.members) ? row.members[0] : row.members;
    const profile = Array.isArray(row.requester_profile) ? row.requester_profile[0] : row.requester_profile;
    const approval = approvalQueue.find(
      (entry) => entry.entity_type === "church_access_request" && entry.entity_id === row.id
    );

    return {
      id: row.id,
      churchId: row.church_id,
      inviteId: row.invite_id ?? null,
      userId: row.user_id ?? null,
      memberId: row.member_id ?? null,
      requestedRoleId: row.requested_role_id ?? null,
      requestedRoleCode: row.requested_role_code ?? null,
      requestedRoleName: row.requested_role_name,
      status: row.status,
      requestedAt: row.requested_at,
      reviewedAt: row.reviewed_at ?? null,
      reviewedByUserId: row.reviewed_by_user_id ?? null,
      reviewerNote: row.reviewer_note ?? null,
      source: row.source,
      memberName: formatPersonName(member?.first_name, member?.last_name, member?.display_name),
      memberEmail: member?.email ?? null,
      memberCode: member?.member_code ?? null,
      requesterProfileName: profile?.full_name ?? null,
      requesterProfileEmail: profile?.email ?? null,
      approvalStatus: approval?.status ?? null,
      approvalStage: approval?.current_stage ?? null,
      approvalRequestId: approval?.id ?? null,
    };
  });

  const summary = requests.reduce(
    (acc, request) => {
      acc.total += 1;
      acc[request.status] += 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    }
  );

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    requests,
    summary,
  };
}

export async function getAccessControlTabData(
  churchSlug: string,
  tab: AccessControlTabKey
): Promise<AccessControlTabData> {
  if (tab === "permissions") {
    const data = await getAccessControlPermissionsData(churchSlug);
    return { tab: "permissions", data };
  }

  if (tab === "invites") {
    const data = await getChurchInviteManagementData(churchSlug);
    return { tab: "invites", data };
  }

  const data = await getPendingAccessRequests(churchSlug);
  return { tab: "pending_access", data };
}
