import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { getPendingApprovalQueue } from "@/features/approvals/queries";
import type {
  ActiveDepartmentLeaderItem,
  ActiveDepartmentLeadersData,
  DepartmentLeadershipRequestItem,
  LeadershipOverviewData,
  LeadershipRequestsData,
  LeadershipTabData,
  LeadershipTabKey,
} from "./types";

type RequestRow = {
  id: string;
  church_id: string;
  invite_id: string | null;
  user_id: string | null;
  member_id: string | null;
  department_id: string;
  requested_role_code: string | null;
  requested_role_name: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  reviewer_note: string | null;
  source: string;
  department?: {
    id: string;
    department_name: string;
  } | null;
  member?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    member_code: string | null;
  } | null;
};

type LeaderRow = {
  id: string;
  church_id: string;
  department_id: string;
  member_id: string;
  leadership_role_code: string | null;
  leadership_role_name: string;
  is_primary: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  department?: {
    id: string;
    department_name: string;
  } | null;
  member?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    member_code: string | null;
  } | null;
};

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

export async function getLeadershipOverview(
  churchSlug: string
): Promise<LeadershipOverviewData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [
    pendingResult,
    activeLeadersResult,
    activeDepartmentsResult,
  ] = await Promise.all([
    supabase
      .from("department_leadership_requests")
      .select("*", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("status", "pending"),
    supabase
      .from("department_leadership_assignments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("is_active", true),
    supabase
      .from("department_leadership_assignments")
      .select("department_id")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true),
  ]);

  if (pendingResult.error) {
    throw new Error(pendingResult.error.message);
  }

  if (activeLeadersResult.error) {
    throw new Error(activeLeadersResult.error.message);
  }

  if (activeDepartmentsResult.error) {
    throw new Error(activeDepartmentsResult.error.message);
  }

  const uniqueDepartments = new Set(
    (activeDepartmentsResult.data ?? [])
      .map((row: any) => row.department_id)
      .filter(Boolean)
  );

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    churchName: ctx.churchName ?? null,
    pendingRequestCount: pendingResult.count ?? 0,
    approvedLeaderCount: activeLeadersResult.count ?? 0,
    departmentsWithLeadersCount: uniqueDepartments.size,
  };
}

export async function getLeadershipRequests(
  churchSlug: string
): Promise<LeadershipRequestsData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("department_leadership_requests")
    .select(`
      id,
      church_id,
      invite_id,
      user_id,
      member_id,
      department_id,
      requested_role_code,
      requested_role_name,
      status,
      requested_at,
      reviewed_at,
      reviewed_by_user_id,
      reviewer_note,
      source,
      department:church_departments!department_leadership_requests_department_id_fkey (
        id,
        department_name
      ),
      member:members!department_leadership_requests_member_id_fkey (
        first_name,
        last_name,
        display_name,
        email,
        member_code
      )
    `)
    .eq("church_id", ctx.churchId)
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const approvalQueue = await getPendingApprovalQueue(churchSlug, "leadership");

  const requests = ((data ?? []) as any[]).map<DepartmentLeadershipRequestItem>((row) => {
    const department = Array.isArray(row.department) ? row.department[0] : row.department;
    const member = Array.isArray(row.member) ? row.member[0] : row.member;
    const approval = approvalQueue.find(
      (entry: any) => entry.entity_type === "department_leadership_request" && entry.entity_id === row.id
    );

    return {
      id: row.id,
      churchId: row.church_id,
      inviteId: row.invite_id ?? null,
      userId: row.user_id ?? null,
      memberId: row.member_id ?? null,
      departmentId: row.department_id,
      departmentName: department?.department_name ?? "Unknown department",
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

export async function getActiveDepartmentLeaders(
  churchSlug: string
): Promise<ActiveDepartmentLeadersData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("department_leadership_assignments")
    .select(`
      id,
      church_id,
      department_id,
      member_id,
      leadership_role_code,
      leadership_role_name,
      is_primary,
      is_active,
      start_date,
      end_date,
      notes,
      department:church_departments!department_leadership_assignments_department_id_fkey (
        id,
        department_name
      ),
      member:members!department_leadership_assignments_member_id_fkey (
        first_name,
        last_name,
        display_name,
        email,
        member_code
      )
    `)
    .eq("church_id", ctx.churchId)
    .eq("is_active", true)
    .order("department_id", { ascending: true })
    .order("leadership_role_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const leaders = ((data ?? []) as any[]).map<ActiveDepartmentLeaderItem>((row) => {
    const department = Array.isArray(row.department) ? row.department[0] : row.department;
    const member = Array.isArray(row.member) ? row.member[0] : row.member;

    return {
      id: row.id,
      churchId: row.church_id,
      departmentId: row.department_id,
      departmentName: department?.department_name ?? "Unknown department",
      memberId: row.member_id,
      memberName: formatPersonName(member?.first_name, member?.last_name, member?.display_name),
      memberEmail: member?.email ?? null,
      memberCode: member?.member_code ?? null,
      leadershipRoleCode: row.leadership_role_code ?? null,
      leadershipRoleName: row.leadership_role_name,
      isPrimary: row.is_primary,
      isActive: row.is_active,
      startDate: row.start_date ?? null,
      endDate: row.end_date ?? null,
      notes: row.notes ?? null,
    };
  });

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    leaders,
  };
}

export async function getLeadershipTabData(
  churchSlug: string,
  tab: LeadershipTabKey
): Promise<LeadershipTabData> {
  if (tab === "overview") {
    const data = await getLeadershipOverview(churchSlug);
    return { tab: "overview", data };
  }

  if (tab === "requests") {
    const data = await getLeadershipRequests(churchSlug);
    return { tab: "requests", data };
  }

  const data = await getActiveDepartmentLeaders(churchSlug);
  return { tab: "active_leaders", data };
}



