import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { getDepartmentFinanceWorkspaceData } from "@/features/department-finance/queries";
import { getDepartmentMembers, getDepartmentOptions } from "@/features/departments/queries";
import { isMissingColumnError, isMissingRelationError } from "@/lib/supabase/errors";
import {
  type ActionPlanData,
  type ActionPlanItemViewModel,
  type ActivityViewModel,
  type DepartmentViewModel,
  type DepartmentWorkspaceBundle,
  type DepartmentsWorkspaceData,
  type LeadershipAssignmentViewModel,
  type LeadershipRequestViewModel,
  type PersonViewModel,
} from "./types";

type ChurchAccess = Awaited<ReturnType<typeof requireChurchAccess>>;

const documentCategories = [
  { key: "plans", label: "Plans", count: 0 },
  { key: "reports", label: "Reports", count: 0 },
  { key: "minutes", label: "Minutes", count: 0 },
  { key: "budget", label: "Budget Files", count: 0 },
  { key: "forms", label: "Forms", count: 0 },
  { key: "media", label: "Media", count: 0 },
];

function isManageRole(ctx: ChurchAccess) {
  return (
    ctx.isPlatformAdmin ||
    ctx.roles.some((role) => role === "church_admin" || role === "clerk")
  );
}

function isActivityRole(ctx: ChurchAccess) {
  return (
    ctx.isPlatformAdmin ||
    ctx.roles.some((role) =>
      ["church_admin", "pastor", "elder", "clerk", "church_secretary"].includes(role)
    )
  );
}

function normalizeName(row: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  member_code?: string | null;
  email?: string | null;
  id?: string | null;
}) {
  return (
    row.display_name ||
    [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
    row.member_code ||
    row.email ||
    row.id ||
    "Member"
  );
}

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "DP"
  );
}

function toMoney(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function isTransientFetchError(error: any) {
  return String(error?.message || "").toLowerCase().includes("fetch failed");
}

function departmentFromRow(row: any, stats?: Partial<DepartmentViewModel>): DepartmentViewModel {
  return {
    id: row.id,
    churchId: row.church_id,
    name: row.department_name,
    code: row.code ?? null,
    description: row.description ?? null,
    isActive: row.is_active !== false,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    memberCount: stats?.memberCount ?? 0,
    activeMemberCount: stats?.activeMemberCount ?? 0,
    inactiveMemberCount: stats?.inactiveMemberCount ?? 0,
    leaderCount: stats?.leaderCount ?? 0,
    eventCount: stats?.eventCount ?? 0,
    announcementCount: stats?.announcementCount ?? 0,
    pendingRequestCount: stats?.pendingRequestCount ?? 0,
    balance: stats?.balance ?? null,
  };
}

async function maybeRows<T>(promise: Promise<{ data: T[] | null; error: any }>, relationName: string) {
  const result = await promise;
  if (!result.error) return result.data ?? [];
  if (isMissingRelationError(result.error, relationName) || isTransientFetchError(result.error)) return [];
  throw new Error(result.error.message);
}

async function fetchRegistryRows(ctx: ChurchAccess, supabase: any) {
  const [
    departmentsResult,
    assignmentsResult,
    eventsResult,
    eventLinksResult,
    announcementsResult,
    leadershipResult,
    fundRequestsResult,
    fundsResult,
    inflowsResult,
    outflowsResult,
  ] = await Promise.all([
    supabase
      .from("church_departments")
      .select("id, church_id, department_name, description, code, is_active, created_at, updated_at")
      .eq("church_id", ctx.churchId)
      .order("department_name", { ascending: true }),
    supabase
      .from("member_departments")
      .select("id, department_id, department_name, is_active")
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_events")
      .select("id, department_id")
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_event_departments")
      .select("department_id")
      .eq("church_id", ctx.churchId),
    supabase
      .from("department_announcements")
      .select("id, department_id, status")
      .eq("church_id", ctx.churchId),
    supabase
      .from("department_leadership_assignments")
      .select("id, department_id, is_active")
      .eq("church_id", ctx.churchId),
    supabase
      .from("department_fund_requests")
      .select("id, department_id, status")
      .eq("church_id", ctx.churchId),
    supabase
      .from("treasury_funds")
      .select("id, department_id")
      .eq("church_id", ctx.churchId),
    supabase
      .from("treasury_inflows")
      .select("id, department_id, fund_id, amount")
      .eq("church_id", ctx.churchId),
    supabase
      .from("treasury_outflows")
      .select("id, department_id, fund_id, amount")
      .eq("church_id", ctx.churchId),
  ]);

  if (departmentsResult.error) throw new Error(departmentsResult.error.message);
  if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);

  const departments = departmentsResult.data ?? [];
  const departmentIds = new Set(departments.map((department: any) => department.id));
  const assignments = assignmentsResult.data ?? [];
  const events = eventsResult.data ?? [];
  const eventLinks = eventLinksResult.error
    ? isMissingRelationError(eventLinksResult.error, "church_event_departments") ||
      isTransientFetchError(eventLinksResult.error)
      ? []
      : (() => {
          throw new Error(eventLinksResult.error.message);
        })()
    : eventLinksResult.data ?? [];
  const announcements = announcementsResult.error
    ? isMissingRelationError(announcementsResult.error, "department_announcements") ||
      isTransientFetchError(announcementsResult.error)
      ? []
      : (() => {
          throw new Error(announcementsResult.error.message);
        })()
    : announcementsResult.data ?? [];
  const leadershipAssignments = leadershipResult.error
    ? isMissingRelationError(leadershipResult.error, "department_leadership_assignments") ||
      isTransientFetchError(leadershipResult.error)
      ? []
      : (() => {
          throw new Error(leadershipResult.error.message);
        })()
    : leadershipResult.data ?? [];
  const fundRequests = fundRequestsResult.error
    ? isMissingRelationError(fundRequestsResult.error, "department_fund_requests") ||
      isTransientFetchError(fundRequestsResult.error)
      ? []
      : (() => {
          throw new Error(fundRequestsResult.error.message);
        })()
    : fundRequestsResult.data ?? [];
  const funds = fundsResult.error
    ? isMissingColumnError(fundsResult.error, "department_id") ||
      isTransientFetchError(fundsResult.error)
      ? []
      : (() => {
          throw new Error(fundsResult.error.message);
        })()
    : fundsResult.data ?? [];
  const inflows = inflowsResult.error
    ? isMissingColumnError(inflowsResult.error, "department_id") ||
      isTransientFetchError(inflowsResult.error)
      ? []
      : (() => {
          throw new Error(inflowsResult.error.message);
        })()
    : inflowsResult.data ?? [];
  const outflows = outflowsResult.error
    ? isMissingColumnError(outflowsResult.error, "department_id") ||
      isTransientFetchError(outflowsResult.error)
      ? []
      : (() => {
          throw new Error(outflowsResult.error.message);
        })()
    : outflowsResult.data ?? [];

  const statsByDepartment = new Map<string, Partial<DepartmentViewModel>>();

  function patch(departmentId: string | null | undefined, next: Partial<DepartmentViewModel>) {
    if (!departmentId || !departmentIds.has(departmentId)) return;
    const current = statsByDepartment.get(departmentId) ?? {};
    statsByDepartment.set(departmentId, { ...current, ...next });
  }

  for (const assignment of assignments) {
    const departmentId = assignment.department_id;
    const current = statsByDepartment.get(departmentId) ?? {};
    patch(departmentId, {
      memberCount: (current.memberCount ?? 0) + 1,
      activeMemberCount:
        assignment.is_active === false
          ? current.activeMemberCount ?? 0
          : (current.activeMemberCount ?? 0) + 1,
      inactiveMemberCount:
        assignment.is_active === false
          ? (current.inactiveMemberCount ?? 0) + 1
          : current.inactiveMemberCount ?? 0,
    });
  }

  for (const event of events) {
    const current = statsByDepartment.get(event.department_id) ?? {};
    patch(event.department_id, { eventCount: (current.eventCount ?? 0) + 1 });
  }

  for (const link of eventLinks) {
    const current = statsByDepartment.get(link.department_id) ?? {};
    patch(link.department_id, { eventCount: (current.eventCount ?? 0) + 1 });
  }

  for (const announcement of announcements) {
    const current = statsByDepartment.get(announcement.department_id) ?? {};
    patch(announcement.department_id, {
      announcementCount: (current.announcementCount ?? 0) + 1,
    });
  }

  for (const leader of leadershipAssignments) {
    if (leader.is_active === false) continue;
    const current = statsByDepartment.get(leader.department_id) ?? {};
    patch(leader.department_id, { leaderCount: (current.leaderCount ?? 0) + 1 });
  }

  for (const request of fundRequests) {
    if (request.status !== "pending") continue;
    const current = statsByDepartment.get(request.department_id) ?? {};
    patch(request.department_id, {
      pendingRequestCount: (current.pendingRequestCount ?? 0) + 1,
    });
  }

  const fundDepartmentById = new Map<string, string>();
  for (const fund of funds) {
    if (fund.department_id) fundDepartmentById.set(fund.id, fund.department_id);
  }

  for (const inflow of inflows) {
    const departmentId = inflow.department_id ?? fundDepartmentById.get(inflow.fund_id);
    const current = statsByDepartment.get(departmentId) ?? {};
    patch(departmentId, { balance: (current.balance ?? 0) + toMoney(inflow.amount) });
  }

  for (const outflow of outflows) {
    const departmentId = outflow.department_id ?? fundDepartmentById.get(outflow.fund_id);
    const current = statsByDepartment.get(departmentId) ?? {};
    patch(departmentId, { balance: (current.balance ?? 0) - toMoney(outflow.amount) });
  }

  return departments.map((department: any) =>
    departmentFromRow(department, statsByDepartment.get(department.id))
  );
}

function toPerson(item: any): PersonViewModel {
  const member = Array.isArray(item.member) ? item.member[0] ?? null : item.member;
  const name = normalizeName({
    first_name: member?.first_name,
    last_name: member?.last_name,
    display_name: member?.display_name,
    member_code: member?.member_code,
    email: member?.email,
    id: item.member_id,
  });

  return {
    id: item.member_id,
    assignmentId: item.id,
    departmentId: item.department_id,
    name,
    initials: initialsFromName(name),
    memberCode: member?.member_code ?? null,
    email: member?.email ?? null,
    phone: member?.phone ?? null,
    membershipStatus: member?.membership_status ?? null,
    roleTitle: item.role_title ?? item.role_in_department ?? null,
    startDate: item.start_date ?? item.joined_date ?? null,
    isActive: item.is_active !== false,
  };
}

async function fetchLeadershipBundle(ctx: ChurchAccess, supabase: any, departmentId: string) {
  const [assignments, requests] = await Promise.all([
    maybeRows<any>(
      supabase
        .from("department_leadership_assignments")
        .select(
          `
            id,
            department_id,
            member_id,
            leadership_role_code,
            leadership_role_name,
            is_primary,
            is_active,
            start_date,
            end_date,
            notes,
            member:members!department_leadership_assignments_member_id_fkey (
              first_name,
              last_name,
              display_name,
              email,
              member_code
            )
          `
        )
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .eq("is_active", true),
      "department_leadership_assignments"
    ),
    maybeRows<any>(
      supabase
        .from("department_leadership_requests")
        .select(
          `
            id,
            department_id,
            member_id,
            requested_role_code,
            requested_role_name,
            status,
            requested_at,
            reviewed_at,
            reviewer_note,
            member:members!department_leadership_requests_member_id_fkey (
              first_name,
              last_name,
              display_name,
              email,
              member_code
            )
          `
        )
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .order("requested_at", { ascending: false }),
      "department_leadership_requests"
    ),
  ]);

  const leadershipAssignments: LeadershipAssignmentViewModel[] = assignments.map((row) => {
    const member = Array.isArray(row.member) ? row.member[0] ?? null : row.member;
    return {
      id: row.id,
      departmentId: row.department_id,
      memberId: row.member_id,
      memberName: member ? normalizeName(member) : null,
      memberEmail: member?.email ?? null,
      memberCode: member?.member_code ?? null,
      roleCode: row.leadership_role_code ?? null,
      roleName: row.leadership_role_name ?? "Leader",
      isPrimary: row.is_primary === true,
      startDate: row.start_date ?? null,
      endDate: row.end_date ?? null,
      notes: row.notes ?? null,
    };
  });

  const leadershipRequests: LeadershipRequestViewModel[] = requests.map((row) => {
    const member = Array.isArray(row.member) ? row.member[0] ?? null : row.member;
    return {
      id: row.id,
      departmentId: row.department_id,
      memberId: row.member_id ?? null,
      memberName: member ? normalizeName(member) : null,
      memberEmail: member?.email ?? null,
      requestedRoleCode: row.requested_role_code ?? null,
      requestedRoleName: row.requested_role_name ?? "Department leader",
      status: row.status ?? "pending",
      requestedAt: row.requested_at ?? null,
      reviewedAt: row.reviewed_at ?? null,
      reviewerNote: row.reviewer_note ?? null,
    };
  });

  return { leadershipAssignments, leadershipRequests };
}

async function fetchActivitiesBundle(ctx: ChurchAccess, supabase: any, departmentId: string) {
  const directEventsResult = await supabase
    .from("church_events")
    .select(
      "id, title, description, event_type, department_id, location, start_datetime, end_datetime, status, workflow_state, approval_note, created_by_user_id, created_at"
    )
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .order("start_datetime", { ascending: false })
    .limit(80);

  if (directEventsResult.error) throw new Error(directEventsResult.error.message);

  const linkedEventIds = await maybeRows<any>(
    supabase
      .from("church_event_departments")
      .select("event_id")
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId),
    "church_event_departments"
  );

  const linkedEventsResult =
    linkedEventIds.length > 0
      ? await supabase
          .from("church_events")
          .select(
            "id, title, description, event_type, department_id, location, start_datetime, end_datetime, status, workflow_state, approval_note, created_by_user_id, created_at"
          )
          .eq("church_id", ctx.churchId)
          .in(
            "id",
            linkedEventIds
              .map((row) => row.event_id)
              .filter(Boolean)
          )
      : { data: [], error: null };

  if (linkedEventsResult.error) throw new Error(linkedEventsResult.error.message);

  const announcements = await maybeRows<any>(
    supabase
      .from("department_announcements")
      .select(
        "id, title, body, audience_scope, status, published_at, expires_at, created_by_user_id, created_at, updated_at"
      )
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId)
      .order("created_at", { ascending: false })
      .limit(80),
    "department_announcements"
  );

  const eventRows = Array.from(
    new Map(
      [...(directEventsResult.data ?? []), ...(linkedEventsResult.data ?? [])].map((event: any) => [event.id, event])
    ).values()
  );

  const creatorIds = Array.from(
    new Set(
      [...eventRows, ...announcements]
        .map((item: any) => item.created_by_user_id)
        .filter(Boolean)
    )
  );

  const profileResult =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, email").in("id", creatorIds)
      : { data: [], error: null };

  if (profileResult.error) throw new Error(profileResult.error.message);

  const profileById = new Map<string, string>(
    (profileResult.data ?? []).map((profile: any): [string, string] => [
      profile.id,
      profile.full_name || profile.email || "Unknown user",
    ])
  );

  const activities: ActivityViewModel[] = [
    ...eventRows.map((event: any) => ({
      id: event.id,
      source: "event" as const,
      title: event.title,
      description: event.description ?? null,
      category: event.event_type ?? "department_activity",
      status: event.status ?? "scheduled",
      workflowState: event.workflow_state ?? null,
      date: event.start_datetime ?? event.created_at ?? null,
      endDate: event.end_datetime ?? null,
      location: event.location ?? null,
      createdByName: event.created_by_user_id ? profileById.get(event.created_by_user_id) ?? null : null,
      approvalStatus: null,
      approvalStage: null,
    })),
    ...announcements.map((announcement: any) => ({
      id: announcement.id,
      source: "announcement" as const,
      title: announcement.title,
      description: announcement.body ?? null,
      category: announcement.audience_scope ?? "department_members",
      status: announcement.status ?? "draft",
      workflowState: announcement.status ?? null,
      date: announcement.published_at ?? announcement.created_at ?? null,
      endDate: announcement.expires_at ?? null,
      location: null,
      createdByName: announcement.created_by_user_id
        ? profileById.get(announcement.created_by_user_id) ?? null
        : null,
      approvalStatus: null,
      approvalStage: null,
    })),
  ].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  return {
    activities,
    eventOptions: eventRows.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: event.start_datetime,
    })),
  };
}

function actionItemBelongsToDepartment(row: any, departmentId: string) {
  const candidates = [
    row.department_id,
    row.related_department_id,
    row.target_department_id,
    row.owner_department_id,
  ].filter(Boolean);

  if (candidates.includes(departmentId)) return true;
  if (Array.isArray(row.department_ids) && row.department_ids.includes(departmentId)) return true;
  if (row.metadata && typeof row.metadata === "object") {
    const metadata = row.metadata as Record<string, unknown>;
    return [
      metadata.departmentId,
      metadata.department_id,
      metadata.relatedDepartmentId,
    ].includes(departmentId);
  }

  return false;
}

async function fetchActionPlanBundle(ctx: ChurchAccess, supabase: any, departmentId: string): Promise<ActionPlanData> {
  const result = await supabase
    .from("church_assignments")
    .select("*")
    .eq("church_id", ctx.churchId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (result.error) {
    if (isMissingRelationError(result.error, "church_assignments") || isTransientFetchError(result.error)) {
      return {
        isConfigured: false,
        items: [],
        unavailableReason: "Action plan storage is not configured for departments yet.",
      };
    }
    throw new Error(result.error.message);
  }

  const rows = (result.data ?? []).filter((row: any) => actionItemBelongsToDepartment(row, departmentId));
  const items: ActionPlanItemViewModel[] = rows.map((row: any) => ({
    id: row.id,
    title: row.title ?? row.assignment_title ?? row.task_title ?? row.name ?? "Untitled action item",
    description: row.description ?? row.details ?? row.note ?? null,
    area: row.area ?? row.strategic_area ?? row.category ?? null,
    status: row.status ?? row.workflow_state ?? "open",
    priority: row.priority ?? null,
    dueDate: row.due_date ?? row.deadline ?? row.target_date ?? null,
    progress:
      row.progress_percent === null || row.progress_percent === undefined
        ? row.progress === null || row.progress === undefined
          ? null
          : Number(row.progress)
        : Number(row.progress_percent),
    assignedToName: row.assigned_to_name ?? row.owner_name ?? null,
    relatedEventId: row.related_event_id ?? null,
  }));

  return {
    isConfigured: true,
    items,
    unavailableReason: null,
  };
}

async function fetchBudgetBundle(churchSlug: string, departmentId: string) {
  try {
    return await getDepartmentFinanceWorkspaceData(churchSlug, departmentId);
  } catch (error) {
    if (isTransientFetchError(error)) return null;
    throw error;
  }
}

export async function getDepartmentWorkspaceBundle(
  churchSlug: string,
  departmentId: string
): Promise<DepartmentWorkspaceBundle | null> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: department, error: departmentError } = await supabase
    .from("church_departments")
    .select("id, church_id, department_name, description, code, is_active, created_at, updated_at")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (departmentError) throw new Error(departmentError.message);
  if (!department) return null;

  const [peopleRows, leadership, activityData, actionPlan, budget] = await Promise.all([
    getDepartmentMembers(churchSlug, departmentId),
    fetchLeadershipBundle(ctx, supabase, departmentId),
    fetchActivitiesBundle(ctx, supabase, departmentId),
    fetchActionPlanBundle(ctx, supabase, departmentId),
    fetchBudgetBundle(churchSlug, departmentId),
  ]);

  const people = peopleRows.map(toPerson);
  const activePeople = people.filter((person) => person.isActive);
  const departmentView = departmentFromRow(department, {
    memberCount: people.length,
    activeMemberCount: activePeople.length,
    inactiveMemberCount: people.length - activePeople.length,
    leaderCount: leadership.leadershipAssignments.length,
    eventCount: activityData.activities.filter((activity) => activity.source === "event").length,
    announcementCount: activityData.activities.filter((activity) => activity.source === "announcement").length,
    pendingRequestCount: budget?.requestSummary.pending ?? 0,
    balance: budget?.totals.balance ?? null,
  });

  return {
    department: departmentView,
    people,
    leadershipAssignments: leadership.leadershipAssignments,
    leadershipRequests: leadership.leadershipRequests,
    activities: activityData.activities,
    actionPlan,
    budget,
    documents: {
      isConfigured: false,
      categories: documentCategories,
      unavailableReason: "Department document storage has not been configured.",
    },
    eventOptions: activityData.eventOptions,
  };
}

export async function getDepartmentsUnifiedWorkspaceData({
  churchSlug,
  departmentId,
}: {
  churchSlug: string;
  departmentId?: string;
}): Promise<DepartmentsWorkspaceData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [departments, options] = await Promise.all([
    fetchRegistryRows(ctx, supabase),
    getDepartmentOptions(churchSlug),
  ]) as [DepartmentViewModel[], Awaited<ReturnType<typeof getDepartmentOptions>>];

  const selectedDepartmentId =
    departmentId && departments.some((department) => department.id === departmentId)
      ? departmentId
      : departments[0]?.id ?? null;

  const selectedBundle = selectedDepartmentId
    ? await getDepartmentWorkspaceBundle(churchSlug, selectedDepartmentId)
    : null;

  const stats = {
    totalDepartments: departments.length,
    activeDepartments: departments.filter((department: DepartmentViewModel) => department.isActive).length,
    inactiveDepartments: departments.filter((department: DepartmentViewModel) => !department.isActive).length,
    assignedMembers: departments.reduce(
      (sum: number, department: DepartmentViewModel) => sum + department.activeMemberCount,
      0
    ),
    unassignedDepartments: departments.filter((department: DepartmentViewModel) => department.memberCount === 0).length,
    eventLinkedDepartments: departments.filter((department: DepartmentViewModel) => department.eventCount > 0).length,
    pendingFundRequests: departments.reduce(
      (sum: number, department: DepartmentViewModel) => sum + department.pendingRequestCount,
      0
    ),
  };

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    stats,
    departments,
    selectedDepartmentId,
    selectedBundle,
    options,
    capabilities: {
      canManageDepartments: isManageRole(ctx),
      canManageAssignments: isManageRole(ctx),
      canManageActivities: isActivityRole(ctx),
      canManageAnnouncements: isActivityRole(ctx),
      canMutateActionPlan: false,
      canUseDocuments: false,
    },
  };
}
