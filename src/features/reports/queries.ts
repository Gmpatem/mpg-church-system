import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

export type ReportsTabKey = "overview" | "treasury" | "members" | "events" | "unified";

interface ReportsFilters {
  dateFrom?: string;
  dateTo?: string;
}

type AnyRow = any;

export interface ReportsWorkspaceData {
  churchId: string;
  churchSlug: string;
  churchName: string;
  church: {
    id: string;
    slug: string;
    name: string;
  };
  filters: {
    dateFrom: string;
    dateTo: string;
    label: string;
  };
  overview: {
    stats: AnyRow[];
    membershipStatus: AnyRow[];
    eventStatus: AnyRow[];
    treasuryTrend: AnyRow[];
    topDepartments: AnyRow[];
    highlights: AnyRow[];
  };
  members: {
    stats: AnyRow[];
    statusBreakdown: AnyRow[];
    byDepartment: AnyRow[];
    recentTrend: AnyRow[];
    recentMembers: AnyRow[];
    health: AnyRow[];
  };
  departments: {
    stats: AnyRow[];
    membersByDepartment: AnyRow[];
    eventsByDepartment: AnyRow[];
    outflowByDepartment: AnyRow[];
    rankings: AnyRow[];
    watchlist: AnyRow[];
  };
  treasury: {
    stats: AnyRow[];
    trend: AnyRow[];
    inflowByType: AnyRow[];
    outflowByType: AnyRow[];
    inflowByFund: AnyRow[];
    outflowByFund: AnyRow[];
    outflowByDepartment: AnyRow[];
  };
  events: {
    stats: AnyRow[];
    byStatus: AnyRow[];
    byType: AnyRow[];
    byDepartment: AnyRow[];
    trend: AnyRow[];
    upcoming: AnyRow[];
  };
  unified: {
    stats: AnyRow[];
    insights: AnyRow[];
    departmentHealth: AnyRow[];
  };
}

interface OverviewTabData {
  church: ReportsWorkspaceData["church"];
  filters: ReportsWorkspaceData["filters"];
  overview: ReportsWorkspaceData["overview"];
}

interface TreasuryTabData {
  church: ReportsWorkspaceData["church"];
  filters: ReportsWorkspaceData["filters"];
  treasury: ReportsWorkspaceData["treasury"];
}

interface MembersTabData {
  church: ReportsWorkspaceData["church"];
  filters: ReportsWorkspaceData["filters"];
  members: ReportsWorkspaceData["members"];
}

interface EventsTabData {
  church: ReportsWorkspaceData["church"];
  filters: ReportsWorkspaceData["filters"];
  events: ReportsWorkspaceData["events"];
}

interface UnifiedTabData {
  church: ReportsWorkspaceData["church"];
  filters: ReportsWorkspaceData["filters"];
  unified: ReportsWorkspaceData["unified"];
}

function normalizeDate(value?: string) {
  if (!value || !value.trim()) return null;
  return value.trim();
}

function buildFilterLabel(dateFrom: string | null, dateTo: string | null) {
  if (dateFrom && dateTo) return `${dateFrom} to ${dateTo}`;
  if (dateFrom) return `From ${dateFrom}`;
  if (dateTo) return `Until ${dateTo}`;
  return "All time";
}

async function runRpc<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fn: string,
  args: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    throw new Error(`${fn}: ${error.message}`);
  }

  return (data ?? {}) as T;
}

async function getReportsContext(churchSlug: string, filters: ReportsFilters = {}) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const dateFrom = normalizeDate(filters.dateFrom);
  const dateTo = normalizeDate(filters.dateTo);

  const rpcArgs = {
    p_church_id: ctx.churchId,
    p_date_from: dateFrom,
    p_date_to: dateTo,
  };

  return {
    ctx,
    supabase,
    dateFrom,
    dateTo,
    rpcArgs,
  };
}

export async function getReportsOverviewStrip(
  churchSlug: string,
  filters: ReportsFilters = {}
) {
  const data = await getReportsWorkspaceData(churchSlug, filters);

  return {
    church: data.church,
    filters: data.filters,
    overview: { stats: data.overview.stats },
    treasury: { stats: data.treasury.stats },
    members: { stats: data.members.stats },
    events: { stats: data.events.stats },
  };
}

export async function getReportsWorkspaceData(
  churchSlug: string,
  filters: ReportsFilters = {}
): Promise<ReportsWorkspaceData> {
  const { ctx, supabase, dateFrom, dateTo, rpcArgs } = await getReportsContext(churchSlug, filters);

  const [overview, treasury, members, events, unified] = await Promise.all([
    runRpc<any>(supabase, "report_overview_summary", rpcArgs),
    runRpc<any>(supabase, "report_treasury_summary", rpcArgs),
    runRpc<any>(supabase, "report_members_summary", { p_church_id: ctx.churchId }),
    runRpc<any>(supabase, "report_events_summary", rpcArgs),
    runRpc<any>(supabase, "report_unified_summary", rpcArgs),
  ]);

  const church = {
    id: ctx.churchId,
    slug: ctx.churchSlug,
    name: ctx.churchName ?? ctx.churchSlug,
  };

  const normalizedFilters = {
    dateFrom: dateFrom ?? "",
    dateTo: dateTo ?? "",
    label: buildFilterLabel(dateFrom, dateTo),
  };

  const membersByDepartment = members?.byDepartment ?? [];
  const eventsByDepartment = events?.byDepartment ?? [];
  const outflowByDepartment = treasury?.outflowByDepartment ?? [];
  const departmentHealth = unified?.departmentHealth ?? [];

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    churchName: ctx.churchName ?? ctx.churchSlug,
    church,
    filters: normalizedFilters,
    overview: {
      stats: overview?.stats ?? [],
      membershipStatus: overview?.membershipStatus ?? [],
      eventStatus: overview?.eventStatus ?? [],
      treasuryTrend: overview?.treasuryTrend ?? [],
      topDepartments: overview?.topDepartments ?? [],
      highlights: overview?.highlights ?? [],
    },
    members: {
      stats: members?.stats ?? [],
      statusBreakdown: members?.statusBreakdown ?? [],
      byDepartment: membersByDepartment,
      recentTrend: members?.recentTrend ?? [],
      recentMembers: members?.recentMembers ?? [],
      health: members?.health ?? [],
    },
    departments: {
      stats: departmentHealth.map((row: any) => ({
        label: row?.name ?? "Department",
        value: Number(row?.memberCount ?? 0),
        hint: "Member footprint",
      })),
      membersByDepartment,
      eventsByDepartment,
      outflowByDepartment,
      rankings: departmentHealth.map((row: any) => ({
        label: row?.name ?? "Department",
        sublabel: `Members: ${Number(row?.memberCount ?? 0)} • Events: ${Number(row?.eventCount ?? 0)}`,
        value: Number(row?.outflowTotal ?? 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      })),
      watchlist: unified?.insights ?? [],
    },
    treasury: {
      stats: treasury?.stats ?? [],
      trend: treasury?.trend ?? [],
      inflowByType: treasury?.inflowByType ?? [],
      outflowByType: treasury?.outflowByType ?? [],
      inflowByFund: treasury?.inflowByFund ?? [],
      outflowByFund: treasury?.outflowByFund ?? [],
      outflowByDepartment,
    },
    events: {
      stats: events?.stats ?? [],
      byStatus: events?.byStatus ?? [],
      byType: events?.byType ?? [],
      byDepartment: eventsByDepartment,
      trend: events?.trend ?? [],
      upcoming: events?.upcoming ?? [],
    },
    unified: {
      stats: unified?.stats ?? [],
      insights: unified?.insights ?? [],
      departmentHealth,
    },
  };
}

export async function getReportsTabData(
  churchSlug: string,
  tab: "overview",
  filters?: ReportsFilters
): Promise<OverviewTabData>;
export async function getReportsTabData(
  churchSlug: string,
  tab: "treasury",
  filters?: ReportsFilters
): Promise<TreasuryTabData>;
export async function getReportsTabData(
  churchSlug: string,
  tab: "members",
  filters?: ReportsFilters
): Promise<MembersTabData>;
export async function getReportsTabData(
  churchSlug: string,
  tab: "events",
  filters?: ReportsFilters
): Promise<EventsTabData>;
export async function getReportsTabData(
  churchSlug: string,
  tab: "unified",
  filters?: ReportsFilters
): Promise<UnifiedTabData>;
export async function getReportsTabData(
  churchSlug: string,
  tab: ReportsTabKey,
  filters: ReportsFilters = {}
): Promise<OverviewTabData | TreasuryTabData | MembersTabData | EventsTabData | UnifiedTabData> {
  const data = await getReportsWorkspaceData(churchSlug, filters);

  if (tab === "overview") {
    return { church: data.church, filters: data.filters, overview: data.overview };
  }

  if (tab === "treasury") {
    return { church: data.church, filters: data.filters, treasury: data.treasury };
  }

  if (tab === "members") {
    return { church: data.church, filters: data.filters, members: data.members };
  }

  if (tab === "events") {
    return { church: data.church, filters: data.filters, events: data.events };
  }

  return { church: data.church, filters: data.filters, unified: data.unified };
}

