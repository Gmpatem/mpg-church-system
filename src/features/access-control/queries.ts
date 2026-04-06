import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { getChurchInviteManagementData } from "@/features/member-invite/queries";
import { getPendingApprovalQueue } from "@/features/approvals/queries";
import type {
  AccessControlOverviewData,
  AccessControlPermissionDefinition,
  AccessControlPendingAccessData,
  AccessControlTabData,
  AccessControlTabKey,
  PendingAccessRequestItem,
} from "./types";

type PermissionRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type RoleRow = {
  role_definitions:
    | {
        code: string;
      }
    | Array<{
        code: string;
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

function countRole(rows: RoleRow[], code: string) {
  return rows.filter((row) => {
    const role = Array.isArray(row.role_definitions) ? row.role_definitions[0] : row.role_definitions;
    return role?.code === code;
  }).length;
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

export async function canCurrentUserViewAccessControl(
  churchSlug: string
): Promise<boolean> {
  const ctx = await requireChurchAccess(churchSlug);
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

  const roleCodes = (roleResult.data ?? [])
    .map((row: any) => row.role_definitions?.code)
    .filter(Boolean);

  const permissionCodes = (permissionResult.data ?? [])
    .map((row: any) => row.permission_definitions?.code)
    .filter(Boolean);

  if (permissionCodes.includes("access_control")) {
    return true;
  }

  return roleCodes.some((code: string) =>
    ["pastor", "church_admin", "tech_team", "clerk", "church_secretary"].includes(code)
  );
}

export async function getAccessControlOverview(
  churchSlug: string
): Promise<AccessControlOverviewData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [
    permissionsResult,
    assignmentCountResult,
    activeAssignmentCountResult,
    roleAssignmentsResult,
  ] = await Promise.all([
    supabase
      .from("permission_definitions")
      .select("id, code, name, description")
      .order("name", { ascending: true }),
    supabase
      .from("church_permission_assignments")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_permission_assignments")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("is_active", true),
    supabase
      .from("church_role_assignments")
      .select("role_definitions(code)")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true),
  ]);

  if (permissionsResult.error) {
    throw new Error(permissionsResult.error.message);
  }

  if (assignmentCountResult.error) {
    throw new Error(assignmentCountResult.error.message);
  }

  if (activeAssignmentCountResult.error) {
    throw new Error(activeAssignmentCountResult.error.message);
  }

  if (roleAssignmentsResult.error) {
    throw new Error(roleAssignmentsResult.error.message);
  }

  const permissions = ((permissionsResult.data ?? []) as PermissionRow[]).map<AccessControlPermissionDefinition>((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
  }));

  const roleRows = ((roleAssignmentsResult.data ?? []) as unknown) as RoleRow[];

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    churchName: ctx.churchName ?? null,
    totalPermissionAssignments: assignmentCountResult.count ?? 0,
    activePermissionAssignments: activeAssignmentCountResult.count ?? 0,
    totalPermissionDefinitions: permissions.length,
    roleCounts: {
      pastors: countRole(roleRows, "pastor"),
      churchAdmins: countRole(roleRows, "church_admin"),
      techTeam: countRole(roleRows, "tech_team"),
      clerks: countRole(roleRows, "clerk"),
      churchSecretaries: countRole(roleRows, "church_secretary"),
    },
    permissions,
  };
}

export async function getPendingAccessRequests(
  churchSlug: string
): Promise<AccessControlPendingAccessData> {
  const ctx = await requireChurchAccess(churchSlug);
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

  const requests = ((data ?? []) as any[]).map<PendingAccessRequestItem>((row) => {
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
  if (tab === "overview") {
    const data = await getAccessControlOverview(churchSlug);
    return { tab: "overview", data };
  }

  if (tab === "invites") {
    const data = await getChurchInviteManagementData(churchSlug);
    return { tab: "invites", data };
  }

  if (tab === "pending_access") {
    const data = await getPendingAccessRequests(churchSlug);
    return { tab: "pending_access", data };
  }

  return {
    tab,
    data: null,
  };
}




