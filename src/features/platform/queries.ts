import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/features/access/queries";

export async function getPlatformChurches() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("id, name, slug, is_active, created_at, default_language, country, city, timezone, email, phone")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPlatformChurchById(churchId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("id, name, slug, is_active, created_at, updated_at, default_language, country, city, timezone, address, email, phone, logo_url")
    .eq("id", churchId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformChurchStats(churchId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { count: memberCount, error: memberError },
    { count: householdCount, error: householdError },
    { count: departmentCount, error: departmentError },
    { count: userCount, error: userError }
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("households").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_departments").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_users").select("*", { count: "exact", head: true }).eq("church_id", churchId),
  ]);

  if (memberError) throw new Error(memberError.message);
  if (householdError) throw new Error(householdError.message);
  if (departmentError) throw new Error(departmentError.message);
  if (userError) throw new Error(userError.message);

  return {
    members: memberCount ?? 0,
    households: householdCount ?? 0,
    departments: departmentCount ?? 0,
    churchUsers: userCount ?? 0,
  };
}
export async function getPlatformSettings() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformSupportTickets() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_support_tickets")
    .select(`
      id,
      church_id,
      requested_by_user_id,
      subject,
      description,
      status,
      priority,
      source,
      assigned_to_user_id,
      created_at,
      updated_at,
      churches:church_id (
        id,
        name,
        slug
      ),
      requester:requested_by_user_id (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPlatformSupportTicketById(ticketId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("platform_support_tickets")
    .select(`
      id,
      church_id,
      requested_by_user_id,
      subject,
      description,
      status,
      priority,
      source,
      assigned_to_user_id,
      created_at,
      updated_at,
      churches:church_id (
        id,
        name,
        slug
      ),
      requester:requested_by_user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) throw new Error(ticketError.message);

  const { data: messages, error: messagesError } = await supabase
    .from("platform_support_ticket_messages")
    .select(`
      id,
      ticket_id,
      author_user_id,
      body,
      is_internal,
      created_at,
      author:author_user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (messagesError) throw new Error(messagesError.message);

  return {
    ticket,
    messages: messages ?? [],
  };
}

export async function getPlatformDashboardMetrics() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: churches, error: churchesError },
    { count: membersCount, error: membersError },
    { count: householdsCount, error: householdsError },
    { count: departmentsCount, error: departmentsError },
    { count: churchUsersCount, error: churchUsersError }
  ] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, slug, is_active, created_at, default_language, city, country", { count: "exact" })
      .order("created_at", { ascending: false }),
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("households").select("*", { count: "exact", head: true }),
    supabase.from("church_departments").select("*", { count: "exact", head: true }),
    supabase.from("church_users").select("*", { count: "exact", head: true }),
  ]);

  if (churchesError) throw new Error(churchesError.message);
  if (membersError) throw new Error(membersError.message);
  if (householdsError) throw new Error(householdsError.message);
  if (departmentsError) throw new Error(departmentsError.message);
  if (churchUsersError) throw new Error(churchUsersError.message);

  const churchRows = churches ?? [];
  const totalChurches = churchRows.length;
  const activeChurches = churchRows.filter((church) => church.is_active).length;
  const inactiveChurches = totalChurches - activeChurches;

  const languageCounts = churchRows.reduce((acc, church) => {
    const key = (church.default_language ?? "unknown").toUpperCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const createdByMonthMap = churchRows.reduce((acc, church) => {
    const date = church.created_at ? new Date(church.created_at) : null;
    if (!date || Number.isNaN(date.getTime())) return acc;

    const key = date.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChurchCreation = Object.entries(createdByMonthMap).map(([month, churches]) => ({
    month,
    churches,
  }));

  const activeInactiveBreakdown = [
    { name: "Active", value: activeChurches, color: "#10b981" },
    { name: "Inactive", value: inactiveChurches, color: "#9ca3af" },
  ];

  const languageDistribution = Object.entries(languageCounts).map(([name, value], index) => {
    const palette = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    return {
      name,
      value,
      color: palette[index % palette.length],
    };
  });

  return {
    totals: {
      churches: totalChurches,
      activeChurches,
      inactiveChurches,
      members: membersCount ?? 0,
      households: householdsCount ?? 0,
      departments: departmentsCount ?? 0,
      churchUsers: churchUsersCount ?? 0,
    },
    churches: churchRows,
    monthlyChurchCreation,
    activeInactiveBreakdown,
    languageDistribution,
  };
}

export async function getPlatformMembersSnapshot(limit: number = 30) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: members, error: membersError },
    { count: totalMembers, error: totalMembersError },
    { count: activeMembers, error: activeMembersError },
    { count: householdsLinked, error: householdsLinkedError },
  ] = await Promise.all([
    supabase
      .from("members")
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        email,
        phone,
        membership_status,
        household_id,
        created_at,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("membership_status", "active"),
    supabase.from("members").select("id", { count: "exact", head: true }).not("household_id", "is", null),
  ]);

  if (membersError) throw new Error(membersError.message);
  if (totalMembersError) throw new Error(totalMembersError.message);
  if (activeMembersError) throw new Error(activeMembersError.message);
  if (householdsLinkedError) throw new Error(householdsLinkedError.message);

  return {
    rows: members ?? [],
    totals: {
      totalMembers: totalMembers ?? 0,
      activeMembers: activeMembers ?? 0,
      householdLinked: householdsLinked ?? 0,
    },
  };
}

export async function getPlatformMemberById(memberId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(`
      id,
      member_code,
      first_name,
      last_name,
      display_name,
      email,
      phone,
      membership_status,
      household_role,
      household_id,
      created_at,
      church_id,
      churches:church_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformEventsSnapshot(limit: number = 24) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [
    { data: events, error: eventsError },
    { count: totalEvents, error: totalEventsError },
    { count: upcomingEvents, error: upcomingEventsError },
    { count: pendingApprovals, error: pendingApprovalsError },
  ] = await Promise.all([
    supabase
      .from("church_events")
      .select(`
        id,
        title,
        location,
        start_datetime,
        end_datetime,
        status,
        workflow_state,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("start_datetime", { ascending: true })
      .limit(limit),
    supabase.from("church_events").select("id", { count: "exact", head: true }),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .gte("start_datetime", nowIso)
      .neq("status", "cancelled"),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .eq("workflow_state", "pending_approval"),
  ]);

  if (eventsError) throw new Error(eventsError.message);
  if (totalEventsError) throw new Error(totalEventsError.message);
  if (upcomingEventsError) throw new Error(upcomingEventsError.message);
  if (pendingApprovalsError) throw new Error(pendingApprovalsError.message);

  return {
    rows: events ?? [],
    totals: {
      totalEvents: totalEvents ?? 0,
      upcomingEvents: upcomingEvents ?? 0,
      pendingApprovals: pendingApprovals ?? 0,
    },
  };
}

export async function getPlatformEventById(eventId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_events")
    .select(`
      id,
      title,
      description,
      event_type,
      location,
      start_datetime,
      end_datetime,
      is_all_day,
      status,
      workflow_state,
      approval_note,
      church_id,
      churches:church_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformTreasurySnapshot(limit: number = 12) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { count: fundCount, error: fundCountError },
    { data: inflows, error: inflowsError },
    { data: outflows, error: outflowsError },
    { data: recentInflows, error: recentInflowsError },
  ] = await Promise.all([
    supabase.from("treasury_funds").select("id", { count: "exact", head: true }),
    supabase.from("treasury_inflows").select("amount"),
    supabase.from("treasury_outflows").select("amount"),
    supabase
      .from("treasury_inflows")
      .select(`
        id,
        amount,
        inflow_type,
        inflow_date,
        is_anonymous,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("inflow_date", { ascending: false })
      .limit(limit),
  ]);

  if (fundCountError) throw new Error(fundCountError.message);
  if (inflowsError) throw new Error(inflowsError.message);
  if (outflowsError) throw new Error(outflowsError.message);
  if (recentInflowsError) throw new Error(recentInflowsError.message);

  const totalIn = (inflows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const totalOut = (outflows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  return {
    recentInflows: recentInflows ?? [],
    totals: {
      fundCount: fundCount ?? 0,
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
    },
  };
}

export async function getPlatformHouseholdsSnapshot(limit: number = 24) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: households, error: householdsError },
    { count: totalHouseholds, error: totalHouseholdsError },
    { count: totalMembers, error: totalMembersError },
  ] = await Promise.all([
    supabase
      .from("households")
      .select(`
        id,
        household_name,
        city,
        country,
        created_at,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("households").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).not("household_id", "is", null),
  ]);

  if (householdsError) throw new Error(householdsError.message);
  if (totalHouseholdsError) throw new Error(totalHouseholdsError.message);
  if (totalMembersError) throw new Error(totalMembersError.message);

  return {
    rows: households ?? [],
    totals: {
      totalHouseholds: totalHouseholds ?? 0,
      membersLinkedToHouseholds: totalMembers ?? 0,
    },
  };
}

export async function getPlatformApprovalsSnapshot(limit: number = 20) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: pendingEvents, error: pendingEventsError },
    { data: openTickets, error: openTicketsError },
  ] = await Promise.all([
    supabase
      .from("church_events")
      .select(`
        id,
        title,
        start_datetime,
        workflow_state,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .eq("workflow_state", "pending_approval")
      .order("start_datetime", { ascending: true })
      .limit(limit),
    supabase
      .from("platform_support_tickets")
      .select(`
        id,
        subject,
        status,
        priority,
        created_at,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (pendingEventsError) throw new Error(pendingEventsError.message);
  if (openTicketsError) throw new Error(openTicketsError.message);

  return {
    pendingEvents: pendingEvents ?? [],
    openTickets: openTickets ?? [],
    totals: {
      pendingEvents: (pendingEvents ?? []).length,
      openTickets: (openTickets ?? []).length,
    },
  };
}

export async function getPlatformCalendarSnapshot(limit: number = 30) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("church_events")
    .select(`
      id,
      title,
      start_datetime,
      end_datetime,
      status,
      location,
      church_id,
      churches:church_id (
        name,
        slug
      )
    `)
    .gte("start_datetime", nowIso)
    .order("start_datetime", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPlatformAccessControlSnapshot() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { count: platformRoleCount, error: platformRoleCountError },
    { count: churchRoleCount, error: churchRoleCountError },
    { count: activeChurchUsers, error: activeChurchUsersError },
    { count: totalChurchUsers, error: totalChurchUsersError },
  ] = await Promise.all([
    supabase.from("platform_role_assignments").select("id", { count: "exact", head: true }),
    supabase.from("church_role_assignments").select("id", { count: "exact", head: true }),
    supabase.from("church_users").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("church_users").select("id", { count: "exact", head: true }),
  ]);

  if (platformRoleCountError) throw new Error(platformRoleCountError.message);
  if (churchRoleCountError) throw new Error(churchRoleCountError.message);
  if (activeChurchUsersError) throw new Error(activeChurchUsersError.message);
  if (totalChurchUsersError) throw new Error(totalChurchUsersError.message);

  return {
    platformRoleCount: platformRoleCount ?? 0,
    churchRoleCount: churchRoleCount ?? 0,
    activeChurchUsers: activeChurchUsers ?? 0,
    pendingOrInactiveChurchUsers: (totalChurchUsers ?? 0) - (activeChurchUsers ?? 0),
  };
}

export async function getPlatformNotifications() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data, error } = await supabase
    .from("platform_notifications")
    .select("id, event_type, entity_type, entity_id, title, message, href, is_read, read_at, created_at")
    .eq("target_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw new Error(error.message);

  return (data ?? []).map((item) => ({
    id: item.id,
    type: item.event_type,
    title: item.title,
    message: item.message,
    created_at: item.created_at,
    href: item.href,
    is_unread: !item.is_read,
  }));
}

type ChurchBaseRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at?: string | null;
  default_language?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string | null;
  email?: string | null;
  phone?: string | null;
};

type MemberSignalRow = {
  church_id: string | null;
  created_at: string | null;
};

type HouseholdSignalRow = {
  church_id: string | null;
};

type UserSignalRow = {
  church_id: string | null;
  status: string | null;
};

type EventSignalRow = {
  church_id: string | null;
  workflow_state: string | null;
  status: string | null;
  start_datetime: string | null;
  created_at: string | null;
};

type InflowSignalRow = {
  church_id: string | null;
  amount: number | string | null;
  inflow_date: string | null;
};

type SupportSignalRow = {
  church_id: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
};

export type PlatformChurchRiskLevel = "healthy" | "warning" | "critical" | "inactive";
export type PlatformReportingState = "complete" | "partial" | "missing";

export type PlatformChurchOversightRow = {
  churchId: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string | null;
  defaultLanguage: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  email: string | null;
  phone: string | null;
  memberCount: number;
  householdCount: number;
  activeUserCount: number;
  totalUserCount: number;
  upcomingEventCount: number;
  pendingApprovalCount: number;
  openSupportTicketCount: number;
  urgentSupportTicketCount: number;
  recentInflowCount: number;
  recentInflowAmount: number;
  complianceRate: number;
  adoptionScore: number;
  healthScore: number;
  riskLevel: PlatformChurchRiskLevel;
  reportingState: PlatformReportingState;
  needsIntervention: boolean;
  interventionReasons: string[];
  regionKey: string;
};

export type PlatformRegionSummary = {
  region: string;
  churches: number;
  activeChurches: number;
  atRiskChurches: number;
  members: number;
  averageHealthScore: number;
  averageComplianceRate: number;
};

export type PlatformChurchOversightData = {
  generatedAt: string;
  summary: {
    totalChurches: number;
    activeChurches: number;
    inactiveChurches: number;
    healthyChurches: number;
    warningChurches: number;
    criticalChurches: number;
    needsInterventionChurches: number;
    totalMembers: number;
    complianceSubmissionRate: number;
    adoptionAverage: number;
    openSupportTickets: number;
    pendingApprovals: number;
    missingReportingChurches: number;
    newChurchesLast90Days: number;
  };
  alerts: {
    title: string;
    summary: string;
  }[];
  churches: PlatformChurchOversightRow[];
  topPerformingChurches: PlatformChurchOversightRow[];
  interventionQueue: PlatformChurchOversightRow[];
  regions: PlatformRegionSummary[];
};

export type PlatformBillingState = "trial" | "active" | "attention" | "overdue";

export type PlatformBillingRow = {
  churchId: string;
  churchName: string;
  region: string;
  isActive: boolean;
  planLabel: "Starter" | "Growth" | "Enterprise";
  billingState: PlatformBillingState;
  daysSinceCreated: number;
  trialDays: number;
  healthScore: number;
  complianceRate: number;
  estimatedRenewalDate: string;
};

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinDays(value: string | null | undefined, days: number, now: Date) {
  const date = safeDate(value);
  if (!date) return false;
  const elapsed = now.getTime() - date.getTime();
  return elapsed <= days * 24 * 60 * 60 * 1000;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function round(value: number) {
  return Math.round(value);
}

function formatIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getPlatformChurchOversightData(): Promise<PlatformChurchOversightData> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const now = new Date();

  const [
    { data: churches, error: churchesError },
    { data: members, error: membersError },
    { data: households, error: householdsError },
    { data: churchUsers, error: churchUsersError },
    { data: churchEvents, error: churchEventsError },
    { data: inflows, error: inflowsError },
    { data: supportTickets, error: supportError },
  ] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, slug, is_active, created_at, default_language, country, city, timezone, email, phone")
      .order("name", { ascending: true }),
    supabase.from("members").select("church_id, created_at"),
    supabase.from("households").select("church_id"),
    supabase.from("church_users").select("church_id, status"),
    supabase.from("church_events").select("church_id, workflow_state, status, start_datetime, created_at"),
    supabase.from("treasury_inflows").select("church_id, amount, inflow_date"),
    supabase.from("platform_support_tickets").select("church_id, status, priority, created_at"),
  ]);

  if (churchesError) throw new Error(churchesError.message);
  if (membersError) throw new Error(membersError.message);
  if (householdsError) throw new Error(householdsError.message);
  if (churchUsersError) throw new Error(churchUsersError.message);
  if (churchEventsError) throw new Error(churchEventsError.message);
  if (inflowsError) throw new Error(inflowsError.message);
  if (supportError) throw new Error(supportError.message);

  const memberRows = (members ?? []) as MemberSignalRow[];
  const householdRows = (households ?? []) as HouseholdSignalRow[];
  const userRows = (churchUsers ?? []) as UserSignalRow[];
  const eventRows = (churchEvents ?? []) as EventSignalRow[];
  const inflowRows = (inflows ?? []) as InflowSignalRow[];
  const supportRows = (supportTickets ?? []) as SupportSignalRow[];
  const churchRows = (churches ?? []) as ChurchBaseRow[];

  const memberCountMap = new Map<string, number>();
  const householdCountMap = new Map<string, number>();
  const userTotalsMap = new Map<string, { total: number; active: number }>();
  const eventMap = new Map<string, { upcoming: number; pending: number; recentSignal: number }>();
  const inflowMap = new Map<string, { recentSignal: number; recentAmount: number }>();
  const supportMap = new Map<string, { open: number; urgentOpen: number }>();

  for (const row of memberRows) {
    if (!row.church_id) continue;
    memberCountMap.set(row.church_id, (memberCountMap.get(row.church_id) ?? 0) + 1);
  }

  for (const row of householdRows) {
    if (!row.church_id) continue;
    householdCountMap.set(row.church_id, (householdCountMap.get(row.church_id) ?? 0) + 1);
  }

  for (const row of userRows) {
    if (!row.church_id) continue;
    const current = userTotalsMap.get(row.church_id) ?? { total: 0, active: 0 };
    current.total += 1;
    if (row.status === "active") current.active += 1;
    userTotalsMap.set(row.church_id, current);
  }

  for (const row of eventRows) {
    if (!row.church_id) continue;
    const current = eventMap.get(row.church_id) ?? { upcoming: 0, pending: 0, recentSignal: 0 };
    const startDate = safeDate(row.start_datetime);
    if (startDate && startDate >= now && row.status !== "cancelled") {
      current.upcoming += 1;
    }
    if (row.workflow_state === "pending_approval") {
      current.pending += 1;
    }
    if (isWithinDays(row.start_datetime ?? row.created_at, 60, now)) {
      current.recentSignal += 1;
    }
    eventMap.set(row.church_id, current);
  }

  for (const row of inflowRows) {
    if (!row.church_id) continue;
    const current = inflowMap.get(row.church_id) ?? { recentSignal: 0, recentAmount: 0 };
    if (isWithinDays(row.inflow_date, 60, now)) {
      current.recentSignal += 1;
      current.recentAmount += Number(row.amount ?? 0);
    }
    inflowMap.set(row.church_id, current);
  }

  for (const row of supportRows) {
    if (!row.church_id) continue;
    const current = supportMap.get(row.church_id) ?? { open: 0, urgentOpen: 0 };
    const isOpen = row.status === "open" || row.status === "in_progress";
    if (isOpen) {
      current.open += 1;
      if (row.priority === "urgent") current.urgentOpen += 1;
    }
    supportMap.set(row.church_id, current);
  }

  const churchesWithScores = churchRows.map((church) => {
    const memberCount = memberCountMap.get(church.id) ?? 0;
    const householdCount = householdCountMap.get(church.id) ?? 0;
    const userStats = userTotalsMap.get(church.id) ?? { total: 0, active: 0 };
    const eventStats = eventMap.get(church.id) ?? { upcoming: 0, pending: 0, recentSignal: 0 };
    const inflowStats = inflowMap.get(church.id) ?? { recentSignal: 0, recentAmount: 0 };
    const supportStats = supportMap.get(church.id) ?? { open: 0, urgentOpen: 0 };

    const complianceSignals = [
      eventStats.recentSignal > 0,
      inflowStats.recentSignal > 0,
      userStats.active > 0,
    ].filter(Boolean).length;
    const complianceRate = round((complianceSignals / 3) * 100);

    let adoptionScore = 0;
    if (church.is_active) adoptionScore += 25;
    adoptionScore += memberCount >= 200 ? 20 : memberCount >= 60 ? 15 : memberCount > 0 ? 8 : 0;
    adoptionScore += userStats.active >= 5 ? 15 : userStats.active >= 2 ? 10 : userStats.active >= 1 ? 5 : 0;
    adoptionScore += eventStats.recentSignal >= 4 ? 15 : eventStats.recentSignal >= 1 ? 8 : 0;
    adoptionScore += inflowStats.recentSignal >= 4 ? 15 : inflowStats.recentSignal >= 1 ? 8 : 0;
    adoptionScore += supportStats.open === 0 ? 10 : supportStats.open === 1 ? 5 : 0;
    adoptionScore += eventStats.pending <= 1 ? 10 : eventStats.pending <= 3 ? 5 : 0;
    adoptionScore = clamp(round(adoptionScore), 0, 100);

    const governanceRiskIndex =
      supportStats.open + eventStats.pending + Math.max(0, userStats.total - userStats.active);
    const riskPenalty = clamp(
      governanceRiskIndex * 5 + supportStats.urgentOpen * 5 + (church.is_active ? 0 : 20),
      0,
      35
    );
    const healthScore = clamp(round(adoptionScore * 0.65 + complianceRate * 0.35 - riskPenalty), 0, 100);

    const reportingState: PlatformReportingState =
      complianceRate >= 67 ? "complete" : complianceRate >= 34 ? "partial" : "missing";

    let riskLevel: PlatformChurchRiskLevel = "healthy";
    if (!church.is_active) {
      riskLevel = "inactive";
    } else if (healthScore < 45 || governanceRiskIndex >= 5 || supportStats.urgentOpen >= 2) {
      riskLevel = "critical";
    } else if (healthScore < 70 || governanceRiskIndex >= 2 || complianceRate < 67) {
      riskLevel = "warning";
    }

    const interventionReasons: string[] = [];
    if (!church.is_active) interventionReasons.push("Workspace is inactive.");
    if (reportingState === "missing") interventionReasons.push("Missing reporting signals.");
    if (eventStats.pending > 0) interventionReasons.push(`${eventStats.pending} pending approval items.`);
    if (supportStats.open > 0) interventionReasons.push(`${supportStats.open} open support issue(s).`);
    if (userStats.active === 0) interventionReasons.push("No active church users.");

    const needsIntervention =
      riskLevel === "inactive" || riskLevel === "critical" || reportingState === "missing";

    return {
      churchId: church.id,
      name: church.name,
      slug: church.slug,
      isActive: church.is_active,
      createdAt: church.created_at ?? null,
      defaultLanguage: church.default_language ?? null,
      country: church.country ?? null,
      city: church.city ?? null,
      timezone: church.timezone ?? null,
      email: church.email ?? null,
      phone: church.phone ?? null,
      memberCount,
      householdCount,
      activeUserCount: userStats.active,
      totalUserCount: userStats.total,
      upcomingEventCount: eventStats.upcoming,
      pendingApprovalCount: eventStats.pending,
      openSupportTicketCount: supportStats.open,
      urgentSupportTicketCount: supportStats.urgentOpen,
      recentInflowCount: inflowStats.recentSignal,
      recentInflowAmount: round(inflowStats.recentAmount),
      complianceRate,
      adoptionScore,
      healthScore,
      riskLevel,
      reportingState,
      needsIntervention,
      interventionReasons,
      regionKey: church.country?.trim() || "Unassigned Region",
    } as PlatformChurchOversightRow;
  });

  const regionsMap = new Map<string, PlatformRegionSummary>();
  for (const row of churchesWithScores) {
    const current = regionsMap.get(row.regionKey) ?? {
      region: row.regionKey,
      churches: 0,
      activeChurches: 0,
      atRiskChurches: 0,
      members: 0,
      averageHealthScore: 0,
      averageComplianceRate: 0,
    };

    current.churches += 1;
    if (row.isActive) current.activeChurches += 1;
    if (row.riskLevel !== "healthy") current.atRiskChurches += 1;
    current.members += row.memberCount;
    current.averageHealthScore += row.healthScore;
    current.averageComplianceRate += row.complianceRate;

    regionsMap.set(row.regionKey, current);
  }

  const regions = Array.from(regionsMap.values())
    .map((region) => ({
      ...region,
      averageHealthScore: round(region.averageHealthScore / region.churches),
      averageComplianceRate: round(region.averageComplianceRate / region.churches),
    }))
    .sort((a, b) => b.churches - a.churches);

  const sortedByHealth = [...churchesWithScores].sort((a, b) => b.healthScore - a.healthScore);
  const interventionQueue = [...churchesWithScores]
    .filter((row) => row.needsIntervention || row.riskLevel === "warning")
    .sort((a, b) => a.healthScore - b.healthScore);

  const totalChurches = churchesWithScores.length;
  const activeChurches = churchesWithScores.filter((row) => row.isActive).length;
  const inactiveChurches = totalChurches - activeChurches;
  const healthyChurches = churchesWithScores.filter((row) => row.riskLevel === "healthy").length;
  const warningChurches = churchesWithScores.filter((row) => row.riskLevel === "warning").length;
  const criticalChurches = churchesWithScores.filter((row) => row.riskLevel === "critical").length;
  const missingReportingChurches = churchesWithScores.filter((row) => row.reportingState === "missing").length;
  const newChurchesLast90Days = churchesWithScores.filter((row) => isWithinDays(row.createdAt, 90, now)).length;

  const summary = {
    totalChurches,
    activeChurches,
    inactiveChurches,
    healthyChurches,
    warningChurches,
    criticalChurches,
    needsInterventionChurches: interventionQueue.length,
    totalMembers: churchesWithScores.reduce((sum, row) => sum + row.memberCount, 0),
    complianceSubmissionRate: round(average(churchesWithScores.map((row) => row.complianceRate))),
    adoptionAverage: round(average(churchesWithScores.map((row) => row.adoptionScore))),
    openSupportTickets: churchesWithScores.reduce((sum, row) => sum + row.openSupportTicketCount, 0),
    pendingApprovals: churchesWithScores.reduce((sum, row) => sum + row.pendingApprovalCount, 0),
    missingReportingChurches,
    newChurchesLast90Days,
  };

  const alerts: { title: string; summary: string }[] = [];
  if (summary.criticalChurches > 0) {
    alerts.push({
      title: `${summary.criticalChurches} churches are in critical risk.`,
      summary: "Immediate executive follow-up is recommended for governance and adoption recovery.",
    });
  }
  if (summary.missingReportingChurches > 0) {
    alerts.push({
      title: `${summary.missingReportingChurches} churches have missing reporting signals.`,
      summary: "These churches show no recent event, finance, or active user signal in the proxy window.",
    });
  }
  if (summary.openSupportTickets > 0) {
    alerts.push({
      title: `${summary.openSupportTickets} support issues are open.`,
      summary: "Track and clear unresolved support blockers to improve network adoption.",
    });
  }

  return {
    generatedAt: formatIsoDate(now),
    summary,
    alerts,
    churches: churchesWithScores,
    topPerformingChurches: sortedByHealth.slice(0, 6),
    interventionQueue: interventionQueue.slice(0, 12),
    regions,
  };
}

export async function getPlatformBillingOverview(): Promise<{
  generatedAt: string;
  trialDays: number;
  rows: PlatformBillingRow[];
  totals: {
    trial: number;
    active: number;
    attention: number;
    overdue: number;
  };
  note: string;
}> {
  await requirePlatformAdmin();

  const [oversight, settings] = await Promise.all([
    getPlatformChurchOversightData(),
    getPlatformSettings(),
  ]);

  const trialDays = Math.max(1, Number(settings?.trial_duration_days ?? 14));
  const now = new Date();

  const rows = oversight.churches
    .map((church) => {
      const createdAt = safeDate(church.createdAt) ?? now;
      const daysSinceCreated = Math.max(
        0,
        round((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
      );

      const billingState: PlatformBillingState = !church.isActive
        ? "overdue"
        : daysSinceCreated <= trialDays
          ? "trial"
          : church.healthScore < 60 || church.openSupportTicketCount > 0
            ? "attention"
            : "active";

      const planLabel: "Starter" | "Growth" | "Enterprise" =
        church.memberCount >= 400 || church.healthScore >= 85
          ? "Enterprise"
          : church.memberCount >= 120 || church.healthScore >= 65
            ? "Growth"
            : "Starter";

      const estimatedRenewalDate = formatIsoDate(
        new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000)
      );

      return {
        churchId: church.churchId,
        churchName: church.name,
        region: church.regionKey,
        isActive: church.isActive,
        planLabel,
        billingState,
        daysSinceCreated,
        trialDays,
        healthScore: church.healthScore,
        complianceRate: church.complianceRate,
        estimatedRenewalDate,
      } satisfies PlatformBillingRow;
    })
    .sort((a, b) => {
      const stateOrder: Record<PlatformBillingState, number> = {
        overdue: 0,
        attention: 1,
        trial: 2,
        active: 3,
      };
      return stateOrder[a.billingState] - stateOrder[b.billingState];
    });

  return {
    generatedAt: oversight.generatedAt,
    trialDays,
    rows,
    totals: {
      trial: rows.filter((row) => row.billingState === "trial").length,
      active: rows.filter((row) => row.billingState === "active").length,
      attention: rows.filter((row) => row.billingState === "attention").length,
      overdue: rows.filter((row) => row.billingState === "overdue").length,
    },
    note:
      "Billing states are derived from current activation, trial window, and oversight signals until dedicated subscription ledgers are introduced.",
  };
}

