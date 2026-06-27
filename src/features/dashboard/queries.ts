import "server-only";

import { cache } from "react";
import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardActionItem,
  DashboardCapabilities,
  DashboardData,
  DashboardEvent,
  DashboardIndicator,
  DashboardMember,
  DashboardMinistryBreakdown,
  DashboardUpdate,
} from "./types";

const MANAGEMENT_ROLES = new Set(["church_admin", "pastor", "elder", "clerk"]);
const EVENT_MANAGE_ROLES = new Set(["church_admin", "pastor", "clerk", "church_secretary"]);
const TREASURY_ROLES = new Set(["church_admin", "treasurer", "pastor"]);
const ANNOUNCEMENT_ROLES = new Set(["church_admin", "pastor", "elder", "clerk", "church_secretary"]);
const ACCESS_CONTROL_ROLES = new Set([
  "pastor",
  "church_admin",
  "tech_team",
  "clerk",
  "church_secretary",
  "platform_owner",
  "platform_admin",
  "platform_support",
]);
const OFFICE_ROLES = new Set(["church_admin", "pastor", "clerk", "church_secretary"]);
const APPROVAL_ROLES = new Set(["church_admin", "pastor", "clerk", "church_secretary", "treasurer"]);
const CHART_COLORS = ["#1F8A5F", "#4C8FE8", "#E5A81E", "#A98EED", "#A7B1A8"];

type ChurchRow = {
  id: string;
  name: string | null;
  slug: string;
  timezone: string | null;
};

type MemberRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  membership_status: string | null;
  household_id: string | null;
  created_at: string;
};

type DepartmentRow = {
  id: string;
  department_name: string;
  is_active: boolean | null;
  created_at: string;
};

type MemberDepartmentRow = {
  member_id: string | null;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean | null;
};

type EventRow = {
  id: string;
  title: string;
  event_type: string | null;
  department_id: string | null;
  location: string | null;
  start_datetime: string;
  status: string | null;
  workflow_state: string | null;
  created_at: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  status: string | null;
  created_at: string;
  published_at: string | null;
};

type TreasuryInflowRow = {
  id: string;
  amount: number | null;
  inflow_type: string | null;
  entry_subtype_code: string | null;
  created_at: string;
};

function hasAnyRole(roles: string[], allowed: Set<string>) {
  return roles.some((role) => allowed.has(role));
}

function buildCapabilities(roles: string[], isPlatformAdmin: boolean): DashboardCapabilities {
  return {
    canManageMembers: isPlatformAdmin || hasAnyRole(roles, MANAGEMENT_ROLES),
    canCreateEvents: isPlatformAdmin || hasAnyRole(roles, EVENT_MANAGE_ROLES),
    canManageTreasury: isPlatformAdmin || hasAnyRole(roles, TREASURY_ROLES),
    canCreateAnnouncements: isPlatformAdmin || hasAnyRole(roles, ANNOUNCEMENT_ROLES),
    canViewAccessControl: isPlatformAdmin || hasAnyRole(roles, ACCESS_CONTROL_ROLES),
    canViewApprovals: isPlatformAdmin || hasAnyRole(roles, APPROVAL_ROLES),
    canViewOffice: isPlatformAdmin || hasAnyRole(roles, OFFICE_ROLES),
    canViewReports: true,
    canViewSettings: true,
    canViewLeadership: true,
    canViewAudit: isPlatformAdmin || hasAnyRole(roles, TREASURY_ROLES),
  };
}

function normalizeTimeZone(timezone?: string | null) {
  if (!timezone) return "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "UTC";
  }
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
    minute: Number(map.get("minute")),
    second: Number(map.get("second")),
  };
}

function dateKeyFromParts(parts: { year: number; month: number; day: number }) {
  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return [
    String(next.getUTCFullYear()).padStart(4, "0"),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function localMidnightToUtcIso(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  let utc = wallClockUtc;

  for (let index = 0; index < 3; index += 1) {
    const zoned = getZonedParts(new Date(utc), timeZone);
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
      0
    );
    utc = wallClockUtc - (zonedAsUtc - utc);
  }

  return new Date(utc).toISOString();
}

function getDateContext(timeZone: string) {
  const now = new Date();
  const todayKey = dateKeyFromParts(getZonedParts(now, timeZone));
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const nextWeekKey = addDaysToDateKey(todayKey, 7);
  const monthStartKey = `${todayKey.slice(0, 8)}01`;

  return {
    now,
    todayKey,
    tomorrowKey,
    laterCutoffKey: addDaysToDateKey(todayKey, 6),
    startOfTodayIso: localMidnightToUtcIso(todayKey, timeZone),
    startOfNextWeekIso: localMidnightToUtcIso(nextWeekKey, timeZone),
    startOfMonthIso: localMidnightToUtcIso(monthStartKey, timeZone),
  };
}

async function safeCount(query: any) {
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function safeRows<T>(query: any): Promise<T[]> {
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as T[];
}

function formatMemberName(row: Pick<MemberRow, "first_name" | "last_name" | "display_name">) {
  const displayName = row.display_name?.trim();
  if (displayName) return displayName;

  const joined = [row.first_name?.trim(), row.last_name?.trim()].filter(Boolean).join(" ").trim();
  return joined || "Unknown member";
}

function departmentLabel(row: EventRow, departmentMap: Map<string, DepartmentRow>) {
  if (row.department_id && departmentMap.has(row.department_id)) {
    return departmentMap.get(row.department_id)?.department_name ?? null;
  }

  return null;
}

function buildEventViewModel(
  row: EventRow,
  churchSlug: string,
  timeZone: string,
  todayKey: string,
  tomorrowKey: string,
  laterCutoffKey: string,
  departmentMap: Map<string, DepartmentRow>
): DashboardEvent | null {
  const start = new Date(row.start_datetime);
  if (Number.isNaN(start.getTime())) return null;

  const dateKey = dateKeyFromParts(getZonedParts(start, timeZone));
  const group =
    dateKey === todayKey
      ? "today"
      : dateKey === tomorrowKey
        ? "tomorrow"
        : dateKey <= laterCutoffKey
          ? "later"
          : "later";

  return {
    id: row.id,
    title: row.title,
    eventType: row.event_type ?? "event",
    departmentName: departmentLabel(row, departmentMap),
    location: row.location ?? null,
    startDatetime: row.start_datetime,
    status: row.status ?? "scheduled",
    workflowState: row.workflow_state ?? null,
    dateKey,
    group,
    href: `/c/${churchSlug}/events?eventId=${row.id}`,
  };
}

function buildRecentMembers(rows: MemberRow[], churchSlug: string): DashboardMember[] {
  return rows.map((row) => ({
    id: row.id,
    name: formatMemberName(row),
    email: row.email ?? null,
    membershipStatus: row.membership_status ?? null,
    createdAt: row.created_at,
    href: `/c/${churchSlug}/members?memberId=${row.id}`,
  }));
}

function buildMinistries(activeDepartments: DepartmentRow[]): DashboardMinistryBreakdown[] {
  const rows = activeDepartments
    .map((department) => ({
      id: department.id,
      name: department.department_name,
      count: 1,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));

  const visible = rows.slice(0, 4).map((row, index) => ({
    ...row,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const otherCount = rows.slice(4).reduce((sum, row) => sum + row.count, 0);

  if (otherCount > 0) {
    visible.push({
      id: "other",
      name: "Other",
      count: otherCount,
      color: CHART_COLORS[4],
    });
  }

  return visible;
}

function sortUpdates(updates: DashboardUpdate[]) {
  return updates
    .filter((update) => update.createdAt)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 5);
}

export const getDashboardData = cache(async (churchSlug: string): Promise<DashboardData> => {
  const ctx = await requireChurchWorkspaceAccess(churchSlug);
  const supabase = await createClient();
  const capabilities = buildCapabilities(ctx.roles, ctx.isPlatformAdmin);
  const base = `/c/${ctx.churchSlug}`;

  const { data: churchResult, error: churchError } = await supabase
    .from("churches")
    .select("id, name, slug, timezone")
    .eq("id", ctx.churchId)
    .maybeSingle<ChurchRow>();

  if (churchError) {
    throw new Error(churchError.message);
  }

  const church = churchResult ?? {
    id: ctx.churchId,
    name: ctx.churchName,
    slug: ctx.churchSlug,
    timezone: "UTC",
  };
  const timezone = normalizeTimeZone(church.timezone);
  const dates = getDateContext(timezone);

  const [
    memberCount,
    membersAddedThisMonth,
    householdCount,
    householdsWithoutHead,
    departments,
    memberDepartments,
    recentMemberRows,
    profileIncompleteCount,
    membersWithoutHouseholds,
    upcomingEventCount,
    upcomingEventRows,
    monthEventsHeld,
    newMinistries,
    accessRequests,
    leadershipRequests,
    announcementsAwaitingPublication,
    eventApprovalRows,
    activeLeaderRows,
    announcementRows,
    departmentUpdateRows,
    eventUpdateRows,
    memberUpdateRows,
  ] = await Promise.all([
    safeCount(
      supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", church.id)
    ),
    safeCount(
      supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .gte("created_at", dates.startOfMonthIso)
    ),
    safeCount(
      supabase.from("households").select("id", { count: "exact", head: true }).eq("church_id", church.id)
    ),
    safeCount(
      supabase
        .from("households")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .is("head_of_household_id", null)
    ),
    safeRows<DepartmentRow>(
      supabase
        .from("church_departments")
        .select("id, department_name, is_active, created_at")
        .eq("church_id", church.id)
        .order("department_name", { ascending: true })
    ),
    safeRows<MemberDepartmentRow>(
      supabase
        .from("member_departments")
        .select("member_id, department_id, department_name, is_active")
        .eq("church_id", church.id)
    ),
    safeRows<MemberRow>(
      supabase
        .from("members")
        .select("id, first_name, last_name, display_name, email, membership_status, household_id, created_at")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false })
        .limit(4)
    ),
    safeCount(
      supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .or("email.is.null,phone.is.null,display_name.is.null")
    ),
    safeCount(
      supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .is("household_id", null)
    ),
    safeCount(
      supabase
        .from("church_events")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .gte("start_datetime", dates.startOfTodayIso)
        .lt("start_datetime", dates.startOfNextWeekIso)
        .neq("status", "cancelled")
    ),
    safeRows<EventRow>(
      supabase
        .from("church_events")
        .select("id, title, event_type, department_id, location, start_datetime, status, workflow_state, created_at")
        .eq("church_id", church.id)
        .gte("start_datetime", dates.startOfTodayIso)
        .lt("start_datetime", dates.startOfNextWeekIso)
        .neq("status", "cancelled")
        .order("start_datetime", { ascending: true })
        .limit(8)
    ),
    safeCount(
      supabase
        .from("church_events")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .eq("status", "completed")
        .gte("start_datetime", dates.startOfMonthIso)
        .lte("start_datetime", dates.now.toISOString())
    ),
    safeCount(
      supabase
        .from("church_departments")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .gte("created_at", dates.startOfMonthIso)
    ),
    safeCount(
      supabase
        .from("church_access_requests")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .eq("status", "pending")
    ),
    safeCount(
      supabase
        .from("department_leadership_requests")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .eq("status", "pending")
    ),
    safeCount(
      supabase
        .from("church_announcements")
        .select("id", { count: "exact", head: true })
        .eq("church_id", church.id)
        .in("status", ["draft", "pending_approval"])
    ),
    safeRows<{ id: string; module_key: string | null }>(
      supabase
        .from("approval_requests")
        .select("id, module_key")
        .eq("church_id", church.id)
        .eq("status", "pending")
    ),
    safeRows<{ department_id: string | null }>(
      supabase
        .from("department_leadership_assignments")
        .select("department_id")
        .eq("church_id", church.id)
        .eq("is_active", true)
    ),
    safeRows<AnnouncementRow>(
      supabase
        .from("church_announcements")
        .select("id, title, status, published_at, created_at")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false })
        .limit(3)
    ),
    safeRows<DepartmentRow>(
      supabase
        .from("church_departments")
        .select("id, department_name, is_active, created_at")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false })
        .limit(3)
    ),
    safeRows<EventRow>(
      supabase
        .from("church_events")
        .select("id, title, event_type, department_id, location, start_datetime, status, workflow_state, created_at")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false })
        .limit(3)
    ),
    safeRows<MemberRow>(
      supabase
        .from("members")
        .select("id, first_name, last_name, display_name, email, membership_status, household_id, created_at")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false })
        .limit(3)
    ),
  ]);

  const treasuryRows = capabilities.canManageTreasury
    ? await safeRows<TreasuryInflowRow>(
        supabase
          .from("treasury_inflows")
          .select("id, amount, inflow_type, entry_subtype_code, created_at")
          .eq("church_id", church.id)
          .order("created_at", { ascending: false })
          .limit(3)
      )
    : [];

  const activeDepartments = departments.filter((department) => department.is_active !== false);
  const departmentMap = new Map(activeDepartments.map((department) => [department.id, department]));
  const leaderDepartmentIds = new Set(activeLeaderRows.map((row) => row.department_id).filter(Boolean));
  const departmentsWithoutLeaders = activeDepartments.filter(
    (department) => !leaderDepartmentIds.has(department.id)
  ).length;
  const assignedMemberIds = new Set(
    memberDepartments
      .filter((assignment) => assignment.is_active !== false)
      .map((assignment) => assignment.member_id)
      .filter(Boolean)
  );
  const unassignedMembers = Math.max(0, memberCount - assignedMemberIds.size);
  const eventApprovals = eventApprovalRows.filter((row) => row.module_key === "events").length;
  const otherApprovals = eventApprovalRows.filter(
    (row) => row.module_key !== "events" && row.module_key !== "leadership" && row.module_key !== "announcements"
  ).length;

  const followUpIndicators: DashboardIndicator[] = [
    capabilities.canManageMembers
      ? {
          key: "profiles_needing_completion",
          count: profileIncompleteCount,
          href: `${base}/members?view=onboarding`,
        }
      : null,
    capabilities.canManageMembers
      ? {
          key: "members_without_households",
          count: membersWithoutHouseholds,
          href: `${base}/members`,
        }
      : null,
    {
      key: "households_without_heads",
      count: householdsWithoutHead,
      href: `${base}/households`,
    },
    capabilities.canViewLeadership
      ? {
          key: "departments_without_leaders",
          count: departmentsWithoutLeaders,
          href: `${base}/leadership`,
        }
      : null,
    capabilities.canManageMembers
      ? {
          key: "unassigned_members",
          count: unassignedMembers,
          href: `${base}/members`,
        }
      : null,
  ].filter(Boolean) as DashboardIndicator[];

  const actionItems: DashboardActionItem[] = [
    capabilities.canViewAccessControl
      ? {
          key: "access_requests",
          count: accessRequests,
          href: `${base}/access-control?tab=pending_access`,
        }
      : null,
    capabilities.canViewLeadership
      ? {
          key: "leadership_requests",
          count: leadershipRequests,
          href: `${base}/leadership?tab=requests`,
        }
      : null,
    capabilities.canCreateAnnouncements
      ? {
          key: "announcements_awaiting_publication",
          count: announcementsAwaitingPublication,
          href: `${base}/announcements?tab=announcements&status=pending_approval`,
        }
      : null,
    capabilities.canViewApprovals || capabilities.canCreateEvents
      ? {
          key: "event_approvals",
          count: eventApprovals,
          href: `${base}/approvals?module=events&status=pending`,
        }
      : null,
    capabilities.canManageMembers
      ? {
          key: "profiles_needing_completion",
          count: profileIncompleteCount,
          href: `${base}/members?view=onboarding`,
        }
      : null,
    capabilities.canViewApprovals
      ? {
          key: "other_approvals",
          count: otherApprovals,
          href: `${base}/approvals?status=pending`,
        }
      : null,
  ].filter(Boolean) as DashboardActionItem[];

  const attentionCount = actionItems.reduce((sum, item) => sum + item.count, 0);
  const upcomingEvents = upcomingEventRows
    .map((row) =>
      buildEventViewModel(
        row,
        church.slug,
        timezone,
        dates.todayKey,
        dates.tomorrowKey,
        dates.laterCutoffKey,
        departmentMap
      )
    )
    .filter(Boolean) as DashboardEvent[];

  const updates = sortUpdates([
    ...memberUpdateRows.map<DashboardUpdate>((row) => ({
      id: `member-${row.id}`,
      type: "member_added",
      entityName: formatMemberName(row),
      detail: row.email ?? null,
      createdAt: row.created_at,
      href: `${base}/members?memberId=${row.id}`,
    })),
    ...treasuryRows.map<DashboardUpdate>((row) => ({
      id: `treasury-${row.id}`,
      type: "treasury_entry",
      entityName: row.entry_subtype_code || row.inflow_type || "Inflow",
      detail: row.inflow_type ?? null,
      createdAt: row.created_at,
      href: `${base}/treasury/in/${row.id}/edit`,
      amount: Number(row.amount ?? 0),
    })),
    ...departmentUpdateRows.map<DashboardUpdate>((row) => ({
      id: `department-${row.id}`,
      type: "department_created",
      entityName: row.department_name,
      detail: null,
      createdAt: row.created_at,
      href: `${base}/departments/${row.id}`,
    })),
    ...announcementRows.map<DashboardUpdate>((row) => ({
      id: `announcement-${row.id}`,
      type: "announcement_published",
      entityName: row.title,
      detail: row.status ?? null,
      createdAt: row.published_at ?? row.created_at,
      href: `${base}/announcements?tab=announcements&announcementId=${row.id}`,
    })),
    ...eventUpdateRows.map<DashboardUpdate>((row) => ({
      id: `event-${row.id}`,
      type: "event_created",
      entityName: row.title,
      detail: row.event_type ?? null,
      createdAt: row.created_at ?? row.start_datetime,
      href: `${base}/events?eventId=${row.id}`,
    })),
  ]);

  const reviewAll = capabilities.canViewApprovals
    ? `${base}/approvals?status=pending`
    : capabilities.canViewAccessControl
      ? `${base}/access-control?tab=pending_access`
      : capabilities.canViewOffice
        ? `${base}/office`
        : null;

  return {
    church: {
      id: church.id,
      name: church.name ?? church.slug,
      slug: church.slug,
      timezone,
    },
    generatedAt: dates.now.toISOString(),
    todayKey: dates.todayKey,
    pulse: {
      memberCount,
      membersAddedThisMonth,
      householdCount,
      householdsWithoutHead,
      activeMinistryCount: activeDepartments.length,
      upcomingEventCount,
      attentionCount,
    },
    upcomingEvents,
    recentMembers: buildRecentMembers(recentMemberRows, church.slug),
    followUpIndicators,
    actionItems,
    updates,
    ministries: buildMinistries(activeDepartments),
    monthly: {
      eventsHeld: monthEventsHeld,
      newMinistries,
    },
    capabilities,
    routes: {
      members: `${base}/members`,
      households: `${base}/households`,
      ministries: `${base}/departments`,
      events: `${base}/events`,
      calendar: `${base}/calendar`,
      attention: reviewAll ?? `${base}/members`,
      reviewAll,
      latestUpdates: capabilities.canViewOffice ? `${base}/office` : null,
      auditTrail: capabilities.canViewAudit ? `${base}/treasury/audit` : null,
    },
  };
});
