import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { buildOfficeSignalNotifications } from "./signals";
import { filterOfficeSignalsByRole } from "./filtering";

type OfficeQueueItem = {
  id: string;
  type: "access_request" | "leadership_request" | "announcement_review" | "event_approval" | "today_event";
  title: string;
  description: string;
  href: string;
  createdAt?: string | null;
  startsAt?: string | null;
  status?: string | null;
};

type SecretaryCalendarItem = {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string | null;
  status: string | null;
  workflow_state: string | null;
};

async function safeCountPendingAccessRequests(supabase: any, churchId: string) {
  const { count, error } = await supabase
    .from("church_access_requests")
    .select("*", { count: "exact", head: true })
    .eq("church_id", churchId)
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}

async function safeCountPendingLeadershipRequests(supabase: any, churchId: string) {
  const { count, error } = await supabase
    .from("department_leadership_requests")
    .select("*", { count: "exact", head: true })
    .eq("church_id", churchId)
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}

async function safeCountAnnouncementsNeedingPublish(supabase: any, churchId: string) {
  const attempts = [
    () =>
      supabase
        .from("church_announcements")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .in("status", ["draft", "pending_approval"]),
    () =>
      supabase
        .from("church_announcements")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("status", "draft"),
    () =>
      supabase
        .from("department_announcements")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .in("status", ["draft", "pending_approval"]),
  ];

  for (const attempt of attempts) {
    const { count, error } = await attempt();
    if (!error) return count ?? 0;
  }

  return 0;
}

async function safeCountDepartmentEventsAwaitingApproval(supabase: any, churchId: string) {
  const attempts = [
    () =>
      supabase
        .from("church_events")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .in("workflow_state", ["pending_approval", "draft"]),
    () =>
      supabase
        .from("church_events")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("workflow_state", "pending_approval"),
  ];

  for (const attempt of attempts) {
    const { count, error } = await attempt();
    if (!error) return count ?? 0;
  }

  return 0;
}

async function safeGetPendingAccessQueue(
  supabase: any,
  churchId: string,
  churchSlug: string
): Promise<OfficeQueueItem[]> {
  const { data, error } = await supabase
    .from("church_access_requests")
    .select("id, requested_role_name, requested_at, status")
    .eq("church_id", churchId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(5);

  if (error) return [];

  return (data ?? []).map((row: any) => ({
    id: `access-${row.id}`,
    type: "access_request",
    title: row.requested_role_name ? `Access request: ${row.requested_role_name}` : "Access request pending",
    description: "A member onboarding access request is waiting for review.",
    href: `/c/${churchSlug}/access-control?tab=pending_access`,
    createdAt: row.requested_at ?? null,
    status: row.status ?? null,
  }));
}

async function safeGetPendingLeadershipQueue(
  supabase: any,
  churchId: string,
  churchSlug: string
): Promise<OfficeQueueItem[]> {
  const { data, error } = await supabase
    .from("department_leadership_requests")
    .select("id, requested_role_name, requested_at, status")
    .eq("church_id", churchId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(5);

  if (error) return [];

  return (data ?? []).map((row: any) => ({
    id: `leadership-${row.id}`,
    type: "leadership_request",
    title: row.requested_role_name ? `Leadership request: ${row.requested_role_name}` : "Leadership request pending",
    description: "A department leadership request is waiting for review.",
    href: `/c/${churchSlug}/leadership?tab=requests`,
    createdAt: row.requested_at ?? null,
    status: row.status ?? null,
  }));
}

async function safeGetAnnouncementQueue(
  supabase: any,
  churchId: string,
  churchSlug: string
): Promise<OfficeQueueItem[]> {
  const attempts = [
    async () =>
      supabase
        .from("church_announcements")
        .select("id, title, status, created_at, department_id")
        .eq("church_id", churchId)
        .in("status", ["draft", "pending_approval"])
        .order("created_at", { ascending: false })
        .limit(5),
    async () =>
      supabase
        .from("department_announcements")
        .select("id, title, status, created_at, department_id")
        .eq("church_id", churchId)
        .in("status", ["draft", "pending_approval"])
        .order("created_at", { ascending: false })
        .limit(5),
  ];

  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) {
      return (data ?? []).map((row: any) => ({
        id: `announcement-${row.id}`,
        type: "announcement_review",
        title: row.title ? `Announcement: ${row.title}` : "Announcement needs publish review",
        description: "An announcement draft or pending item is waiting for office coordination.",
        href: row.department_id
          ? `/c/${churchSlug}/departments/${row.department_id}/announcements`
          : `/c/${churchSlug}/announcements`,
        createdAt: row.created_at ?? null,
        status: row.status ?? null,
      }));
    }
  }

  return [];
}

async function safeGetDepartmentEventApprovalQueue(
  supabase: any,
  churchId: string,
  churchSlug: string
): Promise<OfficeQueueItem[]> {
  const attempts = [
    async () =>
      supabase
        .from("church_events")
        .select("id, title, workflow_state, created_at, start_datetime")
        .eq("church_id", churchId)
        .eq("workflow_state", "pending_approval")
        .order("created_at", { ascending: false })
        .limit(5),
    async () =>
      supabase
        .from("church_events")
        .select("id, title, workflow_state, created_at, start_datetime")
        .eq("church_id", churchId)
        .in("workflow_state", ["pending_approval", "draft"])
        .order("created_at", { ascending: false })
        .limit(5),
  ];

  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) {
      return (data ?? []).map((row: any) => ({
        id: `event-approval-${row.id}`,
        type: "event_approval",
        title: row.title ? `Event awaiting approval: ${row.title}` : "Department event awaiting approval",
        description: "A department event is waiting for workflow review before entering the wider coordination layer.",
        href: `/c/${churchSlug}/events?eventId=${row.id}&tab=detail`,
        createdAt: row.created_at ?? null,
        startsAt: row.start_datetime ?? null,
        status: row.workflow_state ?? null,
      }));
    }
  }

  return [];
}

async function safeGetTodayEvents(
  supabase: any,
  churchId: string,
  churchSlug: string
): Promise<OfficeQueueItem[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const attempts = [
    async () =>
      supabase
        .from("church_events")
        .select("id, title, start_datetime, status, workflow_state")
        .eq("church_id", churchId)
        .eq("status", "scheduled")
        .in("workflow_state", ["approved", "published"])
        .gte("start_datetime", start.toISOString())
        .lte("start_datetime", end.toISOString())
        .order("start_datetime", { ascending: true })
        .limit(10),
    async () =>
      supabase
        .from("church_events")
        .select("id, title, start_datetime, status")
        .eq("church_id", churchId)
        .eq("status", "scheduled")
        .gte("start_datetime", start.toISOString())
        .lte("start_datetime", end.toISOString())
        .order("start_datetime", { ascending: true })
        .limit(10),
  ];

  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) {
      return (data ?? []).map((row: any) => ({
        id: `today-${row.id}`,
        type: "today_event",
        title: row.title ? `Today: ${row.title}` : "Scheduled event today",
        description: "A scheduled church event is happening today and may need office coordination.",
        href: `/c/${churchSlug}/events?eventId=${row.id}&tab=detail`,
        startsAt: row.start_datetime ?? null,
        status: row.status ?? null,
      }));
    }
  }

  return [];
}

async function safeGetSecretaryPendingCalendarSubmissions(
  supabase: any,
  churchId: string
): Promise<SecretaryCalendarItem[]> {
  const attempts = [
    async () =>
      supabase
        .from("church_events")
        .select("id, title, event_type, start_datetime, status, workflow_state")
        .eq("church_id", churchId)
        .eq("workflow_state", "pending_approval")
        .order("start_datetime", { ascending: true })
        .limit(12),
    async () =>
      supabase
        .from("church_events")
        .select("id, title, event_type, start_datetime, status, workflow_state")
        .eq("church_id", churchId)
        .in("workflow_state", ["pending_approval", "draft"])
        .order("start_datetime", { ascending: true })
        .limit(12),
  ];

  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) {
      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? "Untitled event",
        event_type: row.event_type ?? "other",
        start_datetime: row.start_datetime ?? null,
        status: row.status ?? null,
        workflow_state: row.workflow_state ?? "pending_approval",
      }));
    }
  }

  return [];
}

async function safeGetSecretarySharedCalendar(
  supabase: any,
  churchId: string
): Promise<SecretaryCalendarItem[]> {
  const attempts = [
    async () =>
      supabase
        .from("church_events")
        .select("id, title, event_type, start_datetime, status, workflow_state")
        .eq("church_id", churchId)
        .in("workflow_state", ["approved", "published"])
        .order("start_datetime", { ascending: true })
        .limit(30),
    async () =>
      supabase
        .from("church_events")
        .select("id, title, event_type, start_datetime, status")
        .eq("church_id", churchId)
        .eq("status", "scheduled")
        .order("start_datetime", { ascending: true })
        .limit(30),
  ];

  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) {
      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? "Untitled event",
        event_type: row.event_type ?? "other",
        start_datetime: row.start_datetime ?? null,
        status: row.status ?? null,
        workflow_state: row.workflow_state ?? null,
      }));
    }
  }

  return [];
}

export async function getOfficeWorkspaceData(churchSlug: string) {
  const ctx = await requireChurchRole(churchSlug, [
    "church_admin",
    "pastor",
    "clerk",
    "church_secretary",
  ]);

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [
    membersResult,
    departmentsResult,
    accessRequestCount,
    leadershipRequestCount,
    announcementsNeedingPublish,
    departmentEventsAwaitingApproval,
    upcomingEventsResult,
    accessQueue,
    leadershipQueue,
    announcementQueue,
    eventApprovalQueue,
    todayEventsQueue,
    secretaryPendingCalendarSubmissions,
    secretarySharedCalendar,
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", ctx.churchId),

    supabase
      .from("church_departments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("is_active", true),

    safeCountPendingAccessRequests(supabase, ctx.churchId),
    safeCountPendingLeadershipRequests(supabase, ctx.churchId),
    safeCountAnnouncementsNeedingPublish(supabase, ctx.churchId),
    safeCountDepartmentEventsAwaitingApproval(supabase, ctx.churchId),

    supabase
      .from("church_events")
      .select("id, title, start_datetime, status")
      .eq("church_id", ctx.churchId)
      .eq("status", "scheduled")
      .gte("start_datetime", now)
      .order("start_datetime", { ascending: true })
      .limit(5),

    safeGetPendingAccessQueue(supabase, ctx.churchId, ctx.churchSlug),
    safeGetPendingLeadershipQueue(supabase, ctx.churchId, ctx.churchSlug),
    safeGetAnnouncementQueue(supabase, ctx.churchId, ctx.churchSlug),
    safeGetDepartmentEventApprovalQueue(supabase, ctx.churchId, ctx.churchSlug),
    safeGetTodayEvents(supabase, ctx.churchId, ctx.churchSlug),
    safeGetSecretaryPendingCalendarSubmissions(supabase, ctx.churchId),
    safeGetSecretarySharedCalendar(supabase, ctx.churchId),
  ]);

  if (membersResult.error) throw new Error(membersResult.error.message);
  if (departmentsResult.error) throw new Error(departmentsResult.error.message);
  if (upcomingEventsResult.error) throw new Error(upcomingEventsResult.error.message);

  const rawQueue = [
    ...accessQueue,
    ...leadershipQueue,
    ...announcementQueue,
    ...eventApprovalQueue,
    ...todayEventsQueue,
  ].sort((a, b) => {
    const aTime = a.startsAt ?? a.createdAt ?? "";
    const bTime = b.startsAt ?? b.createdAt ?? "";
    return bTime.localeCompare(aTime);
  });

  const filteredQueue = filterOfficeSignalsByRole(ctx.roles, rawQueue);

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    roles: ctx.roles,
    stats: {
      totalMembers: membersResult.count ?? 0,
      activeDepartments: departmentsResult.count ?? 0,
      pendingAccessRequests: accessRequestCount,
      pendingLeadershipRequests: leadershipRequestCount,
      announcementsNeedingPublish,
      departmentEventsAwaitingApproval,
      upcomingEvents: (upcomingEventsResult.data ?? []).length,
      todaysEvents: todayEventsQueue.length,
    },
    upcomingEvents: upcomingEventsResult.data ?? [],
    secretaryCalendar: {
      pendingSubmissions: secretaryPendingCalendarSubmissions,
      sharedCalendar: secretarySharedCalendar,
    },
    queue: filteredQueue.slice(0, 12),
    notifications: buildOfficeSignalNotifications(
      ctx.churchSlug,
      filteredQueue.slice(0, 8)
    ),
  };
}


