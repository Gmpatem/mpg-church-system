import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import {
  DepartmentAccessDeniedError,
  requireDepartmentAccess,
} from "@/features/departments/access";
import { getDepartmentFinanceWorkspaceData } from "@/features/department-finance/queries";
import { getDepartmentMembers, getDepartmentOptions } from "@/features/departments/queries";
import { isMissingColumnError, isMissingRelationError } from "@/lib/supabase/errors";
import {
  type ActionPlanData,
  type ActionPlanItemViewModel,
  type ActivityViewModel,
  type DepartmentViewModel,
  type DepartmentWorkspaceBundle,
  type DepartmentsOverviewData,
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

type DepartmentRow = {
  id: string;
  church_id: string;
  department_name: string;
  description: string | null;
  code?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AssignmentRow = {
  id: string;
  member_id: string | null;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean | null;
};

type MemberStatusRow = {
  id: string;
  membership_status: string | null;
};

type EventRow = {
  id: string;
  title: string;
  event_type: string | null;
  department_id: string | null;
  start_datetime: string | null;
  status: string | null;
  created_at: string | null;
};

type EventDepartmentLinkRow = {
  event_id: string;
  department_id: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string | null;
  department_id: string | null;
  status: string | null;
  published_at: string | null;
  created_by_user_id: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

type DepartmentFinanceRow = {
  id: string;
  department_id: string | null;
  fund_id?: string | null;
  amount: number | string | null;
  inflow_date?: string | null;
  outflow_date?: string | null;
};

type DepartmentFundRow = {
  id: string;
  department_id: string | null;
};

type FundTransferRow = {
  id: string;
  source_fund_id: string | null;
  destination_fund_id: string | null;
  amount: number | string | null;
  transfer_date: string | null;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildReportingPeriod(referenceDate = new Date()): DepartmentsOverviewData["reportingPeriod"] {
  const year = referenceDate.getFullYear();
  return {
    label: `Jan 1 - Dec 31, ${year}`,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    value: String(year),
  };
}

function normalizeLookupName(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isDateWithinPeriod(value: string | null | undefined, period: DepartmentsOverviewData["reportingPeriod"]) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;

  const start = new Date(`${period.startDate}T00:00:00`).getTime();
  const end = new Date(`${period.endDate}T23:59:59`).getTime();
  return time >= start && time <= end;
}

function isActiveMembershipStatus(status?: string | null) {
  const normalized = normalizeLookupName(status);
  return !["inactive", "transferred", "deceased", "removed", "archived"].includes(normalized);
}

function profileLabel(profile: ProfileRow | null | undefined) {
  if (!profile) return null;
  return profile.full_name || profile.email || null;
}

function resolveDepartmentId(
  row: { department_id?: string | null; department_name?: string | null },
  departmentIds: Set<string>,
  departmentIdByName: Map<string, string>
) {
  if (row.department_id && departmentIds.has(row.department_id)) return row.department_id;
  if (row.department_name) return departmentIdByName.get(normalizeLookupName(row.department_name)) ?? null;
  return null;
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
  const reportingPeriod = buildReportingPeriod();
  const [
    departmentsResult,
    assignmentsResult,
    membersResult,
    eventsResult,
    eventLinksResult,
    announcementsResult,
    leadershipResult,
    fundRequestsResult,
    fundsResult,
    inflowsResult,
    outflowsResult,
    transfersResult,
  ] = await Promise.all([
    supabase
      .from("church_departments")
      .select("id, church_id, department_name, description, code, is_active, created_at, updated_at")
      .eq("church_id", ctx.churchId)
      .order("department_name", { ascending: true }),
    supabase
      .from("member_departments")
      .select("id, member_id, department_id, department_name, is_active")
      .eq("church_id", ctx.churchId),
    supabase
      .from("members")
      .select("id, membership_status")
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_events")
      .select("id, title, event_type, department_id, start_datetime, status, created_at")
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_event_departments")
      .select("event_id, department_id")
      .eq("church_id", ctx.churchId),
    supabase
      .from("department_announcements")
      .select("id, title, body, department_id, status, published_at, created_by_user_id, created_at")
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
      .select("id, department_id, fund_id, amount, inflow_date")
      .eq("church_id", ctx.churchId),
    supabase
      .from("treasury_outflows")
      .select("id, department_id, fund_id, amount, outflow_date")
      .eq("church_id", ctx.churchId),
    supabase
      .from("treasury_fund_transfers")
      .select("id, source_fund_id, destination_fund_id, amount, transfer_date")
      .eq("church_id", ctx.churchId),
  ]);

  if (departmentsResult.error) throw new Error(departmentsResult.error.message);
  if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);

  const departments = (departmentsResult.data ?? []) as DepartmentRow[];
  const departmentIds = new Set(departments.map((department) => department.id));
  const departmentIdByName = new Map(
    departments.map((department): [string, string] => [
      normalizeLookupName(department.department_name),
      department.id,
    ])
  );
  const departmentNameById = new Map(
    departments.map((department): [string, string] => [department.id, department.department_name])
  );
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const memberStatusById = new Map(
    ((membersResult.data ?? []) as MemberStatusRow[]).map((member): [string, string | null] => [
      member.id,
      member.membership_status,
    ])
  );
  const events = (eventsResult.data ?? []) as EventRow[];
  const eventLinks = eventLinksResult.error
    ? isMissingRelationError(eventLinksResult.error, "church_event_departments") ||
      isTransientFetchError(eventLinksResult.error)
      ? []
      : (() => {
          throw new Error(eventLinksResult.error.message);
        })()
    : ((eventLinksResult.data ?? []) as EventDepartmentLinkRow[]);
  const announcements = announcementsResult.error
    ? isMissingRelationError(announcementsResult.error, "department_announcements") ||
      isTransientFetchError(announcementsResult.error)
      ? []
      : (() => {
          throw new Error(announcementsResult.error.message);
        })()
    : ((announcementsResult.data ?? []) as AnnouncementRow[]);
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
    : ((fundsResult.data ?? []) as DepartmentFundRow[]);
  const inflows = inflowsResult.error
    ? isMissingColumnError(inflowsResult.error, "department_id") ||
      isTransientFetchError(inflowsResult.error)
      ? []
      : (() => {
          throw new Error(inflowsResult.error.message);
        })()
    : ((inflowsResult.data ?? []) as DepartmentFinanceRow[]);
  const outflows = outflowsResult.error
    ? isMissingColumnError(outflowsResult.error, "department_id") ||
      isTransientFetchError(outflowsResult.error)
      ? []
      : (() => {
          throw new Error(outflowsResult.error.message);
        })()
    : ((outflowsResult.data ?? []) as DepartmentFinanceRow[]);
  const transfers = transfersResult.error
    ? isMissingRelationError(transfersResult.error, "treasury_fund_transfers") ||
      isTransientFetchError(transfersResult.error)
      ? []
      : (() => {
          throw new Error(transfersResult.error.message);
        })()
    : ((transfersResult.data ?? []) as FundTransferRow[]);

  const creatorIds = Array.from(
    new Set(announcements.map((announcement) => announcement.created_by_user_id).filter(Boolean))
  ) as string[];
  const profileResult =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, email").in("id", creatorIds)
      : { data: [], error: null };

  if (profileResult.error) throw new Error(profileResult.error.message);

  const profileById = new Map(
    ((profileResult.data ?? []) as ProfileRow[]).map((profile): [string, ProfileRow] => [
      profile.id,
      profile,
    ])
  );

  const statsByDepartment = new Map<string, Partial<DepartmentViewModel>>();
  const memberIdsByDepartment = new Map<string, Set<string>>();
  const activeMemberIdsByDepartment = new Map<string, Set<string>>();
  const inactiveMemberIdsByDepartment = new Map<string, Set<string>>();
  const uniqueActiveMemberIds = new Set<string>();
  const eventIdsByDepartment = new Map<string, Set<string>>();
  const financeByDepartment = new Map<
    string,
    {
      balance: number;
      totalIncome: number;
      totalExpenses: number;
      periodIncome: number;
      periodExpenses: number;
      periodActivity: number;
      touched: boolean;
    }
  >();

  function patch(departmentId: string | null | undefined, next: Partial<DepartmentViewModel>) {
    if (!departmentId || !departmentIds.has(departmentId)) return;
    const current = statsByDepartment.get(departmentId) ?? {};
    statsByDepartment.set(departmentId, { ...current, ...next });
  }

  function departmentMembers(map: Map<string, Set<string>>, departmentId: string) {
    const current = map.get(departmentId) ?? new Set<string>();
    map.set(departmentId, current);
    return current;
  }

  function departmentFinance(departmentId: string) {
    const current =
      financeByDepartment.get(departmentId) ?? {
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        periodIncome: 0,
        periodExpenses: 0,
        periodActivity: 0,
        touched: false,
      };
    financeByDepartment.set(departmentId, current);
    return current;
  }

  function addEventToDepartment(eventId: string, departmentId: string | null | undefined) {
    if (!departmentId || !departmentIds.has(departmentId)) return;
    const current = eventIdsByDepartment.get(departmentId) ?? new Set<string>();
    current.add(eventId);
    eventIdsByDepartment.set(departmentId, current);
  }

  for (const assignment of assignments) {
    const departmentId = resolveDepartmentId(assignment, departmentIds, departmentIdByName);
    if (!departmentId || !assignment.member_id) continue;

    departmentMembers(memberIdsByDepartment, departmentId).add(assignment.member_id);
    const isActiveAssignment = assignment.is_active !== false;
    const isActiveMember = isActiveMembershipStatus(memberStatusById.get(assignment.member_id));

    if (isActiveAssignment && isActiveMember) {
      departmentMembers(activeMemberIdsByDepartment, departmentId).add(assignment.member_id);
      uniqueActiveMemberIds.add(assignment.member_id);
    } else {
      departmentMembers(inactiveMemberIdsByDepartment, departmentId).add(assignment.member_id);
    }
  }

  for (const [departmentId, memberIds] of memberIdsByDepartment.entries()) {
    patch(departmentId, {
      memberCount: memberIds.size,
      activeMemberCount: activeMemberIdsByDepartment.get(departmentId)?.size ?? 0,
      inactiveMemberCount: inactiveMemberIdsByDepartment.get(departmentId)?.size ?? 0,
    });
  }

  const eventById = new Map(events.map((event): [string, EventRow] => [event.id, event]));
  for (const event of events) addEventToDepartment(event.id, event.department_id);
  for (const link of eventLinks) addEventToDepartment(link.event_id, link.department_id);
  for (const [departmentId, eventIds] of eventIdsByDepartment.entries()) {
    patch(departmentId, { eventCount: eventIds.size });
  }

  for (const announcement of announcements) {
    const departmentId = resolveDepartmentId(announcement, departmentIds, departmentIdByName);
    const current = departmentId ? statsByDepartment.get(departmentId) ?? {} : {};
    patch(departmentId, {
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
    const departmentId =
      inflow.department_id ??
      (inflow.fund_id ? fundDepartmentById.get(inflow.fund_id) : undefined);
    if (!departmentId || !departmentIds.has(departmentId)) continue;

    const amount = toMoney(inflow.amount);
    const current = departmentFinance(departmentId);
    current.balance += amount;
    current.totalIncome += amount;
    current.touched = true;
    if (isDateWithinPeriod(inflow.inflow_date, reportingPeriod)) {
      current.periodIncome += amount;
      current.periodActivity += amount;
    }
  }

  for (const outflow of outflows) {
    const departmentId =
      outflow.department_id ??
      (outflow.fund_id ? fundDepartmentById.get(outflow.fund_id) : undefined);
    if (!departmentId || !departmentIds.has(departmentId)) continue;

    const amount = toMoney(outflow.amount);
    const current = departmentFinance(departmentId);
    current.balance -= amount;
    current.totalExpenses += amount;
    current.touched = true;
    if (isDateWithinPeriod(outflow.outflow_date, reportingPeriod)) {
      current.periodExpenses += amount;
      current.periodActivity += amount;
    }
  }

  for (const transfer of transfers) {
    const amount = toMoney(transfer.amount);
    const sourceDepartmentId = transfer.source_fund_id
      ? fundDepartmentById.get(transfer.source_fund_id)
      : null;
    const destinationDepartmentId = transfer.destination_fund_id
      ? fundDepartmentById.get(transfer.destination_fund_id)
      : null;
    const inPeriod = isDateWithinPeriod(transfer.transfer_date, reportingPeriod);

    if (sourceDepartmentId && departmentIds.has(sourceDepartmentId)) {
      const current = departmentFinance(sourceDepartmentId);
      current.balance -= amount;
      current.touched = true;
      if (inPeriod) current.periodActivity += amount;
    }

    if (destinationDepartmentId && departmentIds.has(destinationDepartmentId)) {
      const current = departmentFinance(destinationDepartmentId);
      current.balance += amount;
      current.touched = true;
      if (inPeriod) current.periodActivity += amount;
    }
  }

  for (const [departmentId, finance] of financeByDepartment.entries()) {
    patch(departmentId, { balance: finance.touched ? finance.balance : null });
  }

  const departmentViews = departments.map((department) =>
    departmentFromRow(department, statsByDepartment.get(department.id))
  );

  const financeRows = departmentViews
    .map((department) => {
      const finance = financeByDepartment.get(department.id);
      if (!finance?.touched) return null;

      return {
        departmentId: department.id,
        departmentName: department.name,
        primaryAmount: finance.balance,
        spentAmount: finance.periodExpenses,
        activityAmount: finance.periodActivity,
        utilizationPercent: null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => {
      const aValue = Math.abs(a.primaryAmount ?? 0) + (a.spentAmount ?? 0);
      const bValue = Math.abs(b.primaryAmount ?? 0) + (b.spentAmount ?? 0);
      return bValue - aValue;
    })
    .slice(0, 6);

  const hasFinanceData = financeRows.length > 0;
  const totalAmount = hasFinanceData
    ? Array.from(financeByDepartment.values()).reduce(
        (sum, finance) => sum + (finance.touched ? finance.balance : 0),
        0
      )
    : null;
  const totalSpent = hasFinanceData
    ? Array.from(financeByDepartment.values()).reduce(
        (sum, finance) => sum + (finance.touched ? finance.periodExpenses : 0),
        0
      )
    : null;

  const eventDepartmentPairs = new Map<string, string>();
  for (const event of events) {
    if (event.department_id && departmentIds.has(event.department_id)) {
      eventDepartmentPairs.set(`${event.id}:${event.department_id}`, event.department_id);
    }
  }
  for (const link of eventLinks) {
    const event = eventById.get(link.event_id);
    if (!event || !link.department_id || !departmentIds.has(link.department_id)) continue;
    eventDepartmentPairs.set(`${event.id}:${link.department_id}`, link.department_id);
  }

  const nowTime = Date.now();
  const upcomingActivities = Array.from(eventDepartmentPairs.entries())
    .map(([key, departmentId]) => {
      const eventId = key.split(":")[0];
      const event = eventById.get(eventId);
      if (!event?.start_datetime) return null;
      const startTime = new Date(event.start_datetime).getTime();
      if (!Number.isFinite(startTime) || startTime < nowTime) return null;
      if (normalizeLookupName(event.status) === "cancelled") return null;

      return {
        id: key,
        title: event.title,
        departmentId,
        departmentName: departmentNameById.get(departmentId) ?? "Department",
        eventType: event.event_type ?? "department_activity",
        startDatetime: event.start_datetime,
      };
    })
    .filter((activity): activity is NonNullable<typeof activity> => activity !== null)
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
    .slice(0, 5);

  const recentUpdates = [...announcements]
    .filter((announcement) => {
      const departmentId = resolveDepartmentId(announcement, departmentIds, departmentIdByName);
      return Boolean(departmentId && announcement.created_at);
    })
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5)
    .map((announcement) => {
      const departmentId = resolveDepartmentId(announcement, departmentIds, departmentIdByName);
      const profile = announcement.created_by_user_id
        ? profileById.get(announcement.created_by_user_id)
        : null;

      return {
        id: announcement.id,
        title: announcement.title,
        description: announcement.status
          ? `Announcement ${announcement.status.replace(/_/g, " ")}`
          : "Department announcement",
        departmentId,
        departmentName: departmentId ? departmentNameById.get(departmentId) ?? null : null,
        actorName: profileLabel(profile),
        actorAvatarUrl: null,
        createdAt: announcement.created_at ?? new Date().toISOString(),
        source: "announcement" as const,
      };
    });

  const overview: DepartmentsOverviewData = {
    reportingPeriod,
    totalDepartments: departmentViews.length,
    activeDepartments: departmentViews.filter((department) => department.isActive).length,
    inactiveDepartments: departmentViews.filter((department) => !department.isActive).length,
    uniqueDepartmentMembers: uniqueActiveMemberIds.size,
    finance: {
      currencyCode: "XAF",
      locale: "fr-CM",
      totalAmount,
      totalSpent,
      utilizationPercent: null,
      departmentBreakdown: financeRows,
    },
    topDepartments: departmentViews
      .filter((department) => department.activeMemberCount > 0)
      .sort((a, b) => b.activeMemberCount - a.activeMemberCount)
      .slice(0, 5)
      .map((department) => ({
        departmentId: department.id,
        departmentName: department.name,
        activeMemberCount: department.activeMemberCount,
      })),
    upcomingActivities,
    recentUpdates,
  };

  return { departments: departmentViews, overview };
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
    .select(
      "*, assigned_member:members!church_assignments_assigned_to_member_id_fkey(first_name, last_name, display_name, member_code, email)"
    )
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
  const items: ActionPlanItemViewModel[] = rows.map((row: any) => {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const assignedMember = Array.isArray(row.assigned_member)
      ? row.assigned_member[0] ?? null
      : row.assigned_member;
    const progressValue = row.progress_percent ?? row.progress ?? metadata.progress ?? null;

    return {
      id: row.id,
      title: row.title ?? row.assignment_title ?? row.task_title ?? row.name ?? "Untitled action item",
      description: row.description ?? row.details ?? row.note ?? null,
      area: row.area ?? row.strategic_area ?? row.category ?? metadata.area ?? null,
      status: row.status ?? row.workflow_state ?? "open",
      priority: row.priority ?? null,
      dueDate: row.due_date ?? row.deadline ?? row.target_date ?? row.scheduled_date ?? null,
      progress: progressValue === null || progressValue === undefined ? null : Number(progressValue),
      assignedToName:
        row.assigned_to_name ??
        row.owner_name ??
        (assignedMember ? normalizeName(assignedMember) : null),
      assignedToMemberId: row.assigned_to_member_id ?? null,
      relatedEventId: row.related_event_id ?? null,
      notes: row.notes ?? null,
    };
  });

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
  const access = await requireDepartmentAccess(churchSlug, departmentId, "view");
  const { ctx, supabase } = access;

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

  if (!ctx.isPlatformAdmin && !ctx.hasOperationalAccess) {
    if (!departmentId) {
      throw new DepartmentAccessDeniedError(
        "Open a department workspace from your Member Portal ministry assignment."
      );
    }

    const access = await requireDepartmentAccess(churchSlug, departmentId, "view");
    const [selectedBundle, allOptions] = await Promise.all([
      getDepartmentWorkspaceBundle(churchSlug, departmentId),
      getDepartmentOptions(churchSlug),
    ]);

    if (!selectedBundle) throw new DepartmentAccessDeniedError();

    const selectedDepartment = selectedBundle.department;
    const reportingPeriod = buildReportingPeriod();
    const now = Date.now();
    const upcomingActivities = selectedBundle.activities
      .filter((activity) => {
        if (activity.source !== "event" || !activity.date) return false;
        const eventTime = new Date(activity.date).getTime();
        return Number.isFinite(eventTime) && eventTime >= now && normalizeLookupName(activity.status) !== "cancelled";
      })
      .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())
      .slice(0, 5)
      .map((activity) => ({
        id: activity.id,
        title: activity.title,
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        eventType: activity.category,
        startDatetime: activity.date as string,
      }));
    const recentUpdates = selectedBundle.activities
      .filter((activity) => activity.source === "announcement" && activity.date)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 5)
      .map((activity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description || "Department announcement",
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        actorName: activity.createdByName,
        actorAvatarUrl: null,
        createdAt: activity.date as string,
        source: "announcement" as const,
      }));
    const budget = selectedBundle.budget;
    const overview: DepartmentsOverviewData = {
      reportingPeriod,
      totalDepartments: 1,
      activeDepartments: selectedDepartment.isActive ? 1 : 0,
      inactiveDepartments: selectedDepartment.isActive ? 0 : 1,
      uniqueDepartmentMembers: selectedDepartment.activeMemberCount,
      finance: {
        currencyCode: "XAF",
        locale: "fr-CM",
        totalAmount: budget?.totals.balance ?? null,
        totalSpent: budget?.totals.totalExpenses ?? null,
        utilizationPercent: null,
        departmentBreakdown: [
          {
            departmentId: selectedDepartment.id,
            departmentName: selectedDepartment.name,
            primaryAmount: budget?.totals.balance ?? null,
            spentAmount: budget?.totals.totalExpenses ?? null,
            activityAmount: budget
              ? budget.totals.totalIncome + budget.totals.totalExpenses
              : null,
            utilizationPercent: null,
          },
        ],
      },
      topDepartments:
        selectedDepartment.activeMemberCount > 0
          ? [
              {
                departmentId: selectedDepartment.id,
                departmentName: selectedDepartment.name,
                activeMemberCount: selectedDepartment.activeMemberCount,
              },
            ]
          : [],
      upcomingActivities,
      recentUpdates,
    };

    return {
      church: {
        id: ctx.churchId,
        slug: ctx.churchSlug,
        name: ctx.churchName ?? ctx.churchSlug,
      },
      stats: {
        totalDepartments: 1,
        activeDepartments: selectedDepartment.isActive ? 1 : 0,
        inactiveDepartments: selectedDepartment.isActive ? 0 : 1,
        assignedMembers: selectedDepartment.activeMemberCount,
        unassignedDepartments: selectedDepartment.memberCount === 0 ? 1 : 0,
        eventLinkedDepartments: selectedDepartment.eventCount > 0 ? 1 : 0,
        pendingFundRequests: selectedDepartment.pendingRequestCount,
      },
      overview,
      departments: [selectedDepartment],
      selectedDepartmentId: selectedDepartment.id,
      selectedBundle,
      options: {
        ...allOptions,
        departments: allOptions.departments.filter((option) => option.id === selectedDepartment.id),
      },
      capabilities: {
        canManageDepartments: false,
        canManageAssignments: access.can("manage_members"),
        canManageActivities: access.can("manage_activities"),
        canManageAnnouncements: access.can("manage_announcements"),
        canMutateActionPlan: access.can("manage_action_plan"),
        canUseDocuments: false,
      },
    };
  }

  const [registry, options] = await Promise.all([
    fetchRegistryRows(ctx, supabase),
    getDepartmentOptions(churchSlug),
  ]) as [
    { departments: DepartmentViewModel[]; overview: DepartmentsOverviewData },
    Awaited<ReturnType<typeof getDepartmentOptions>>,
  ];
  const { departments, overview } = registry;

  const selectedDepartmentId =
    departmentId && departments.some((department) => department.id === departmentId)
      ? departmentId
      : departments[0]?.id ?? null;

  const [selectedBundle, selectedAccess] = selectedDepartmentId
    ? await Promise.all([
        getDepartmentWorkspaceBundle(churchSlug, selectedDepartmentId),
        requireDepartmentAccess(churchSlug, selectedDepartmentId, "view"),
      ])
    : [null, null];

  const stats = {
    totalDepartments: departments.length,
    activeDepartments: departments.filter((department: DepartmentViewModel) => department.isActive).length,
    inactiveDepartments: departments.filter((department: DepartmentViewModel) => !department.isActive).length,
    assignedMembers: overview.uniqueDepartmentMembers,
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
    overview,
    departments,
    selectedDepartmentId,
    selectedBundle,
    options,
    capabilities: {
      canManageDepartments: isManageRole(ctx),
      canManageAssignments: isManageRole(ctx),
      canManageActivities: isActivityRole(ctx),
      canManageAnnouncements: isActivityRole(ctx),
      canMutateActionPlan: selectedAccess?.can("manage_action_plan") ?? false,
      canUseDocuments: false,
    },
  };
}
