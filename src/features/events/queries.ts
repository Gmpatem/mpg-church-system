import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import { getEventStatusLabel, getEventWorkflowLabel, EVENT_TYPE_OPTIONS } from "./presentation";
import { normalizeEventsCalendarView, normalizeEventsNavigation } from "./navigation";
import type {
  EventApprovalSummary,
  EventCalendarItem,
  EventDepartmentSummary,
  EventDetailsViewModel,
  EventOperationalStatus,
  EventPermissions,
  EventRegistryRow,
  EventsCalendarView,
  EventsFormOptions,
  EventsOverviewData,
  EventsRegistryData,
  EventsSummaryMetrics,
  EventsWorkspaceData,
  EventsWorkspaceFilters,
  EventWorkflowState,
} from "./types";

const MANAGE_ROLES = ["church_admin", "pastor", "clerk", "church_secretary"] as const;
const STATUS_VALUES: EventOperationalStatus[] = ["scheduled", "completed", "cancelled"];
const WORKFLOW_VALUES: EventWorkflowState[] = ["draft", "pending_approval", "approved", "published", "rejected"];
const PAGE_SIZES = [25, 50, 100] as const;

type RawEventsWorkspaceFilters = Partial<{
  q: string;
  status: string;
  workflow: string;
  eventType: string;
  departmentId: string;
  dateFrom: string;
  dateTo: string;
  eventId: string;
  tab: string;
  dialog: string;
  page: string | number;
  pageSize: string | number;
  calendarView: string;
  calendarDate: string;
  view: string;
  date: string;
}>;

type RawEventRow = {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  department_id: string | null;
  location: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean | null;
  status: string | null;
  workflow_state: string | null;
  approval_note: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RawDepartmentRow = {
  id: string;
  department_name: string;
  code?: string | null;
  is_active?: boolean | null;
};

type RawEventLinkRow = {
  event_id: string;
  department_id: string;
};

function hasValue(value?: string) {
  return !!value && value.trim().length > 0;
}

function normalizeStatus(value?: string): EventOperationalStatus | "all" {
  return STATUS_VALUES.includes(value as EventOperationalStatus) ? (value as EventOperationalStatus) : "all";
}

function normalizeWorkflow(value?: string): EventWorkflowState | "all" {
  return WORKFLOW_VALUES.includes(value as EventWorkflowState) ? (value as EventWorkflowState) : "all";
}

function toStatus(value: string | null | undefined): EventOperationalStatus {
  return STATUS_VALUES.includes(value as EventOperationalStatus) ? (value as EventOperationalStatus) : "scheduled";
}

function toWorkflow(value: string | null | undefined): EventWorkflowState {
  return WORKFLOW_VALUES.includes(value as EventWorkflowState) ? (value as EventWorkflowState) : "draft";
}

function normalizePage(value: string | number | undefined) {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function normalizePageSize(value: string | number | undefined): EventsWorkspaceFilters["pageSize"] {
  const parsed = Number(value ?? 25);
  return PAGE_SIZES.includes(parsed as EventsWorkspaceFilters["pageSize"])
    ? (parsed as EventsWorkspaceFilters["pageSize"])
    : 25;
}

function normalizeDate(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function normalizeOptionalFilter(value?: string) {
  const trimmed = (value ?? "").trim();
  return !trimmed || trimmed === "all" ? "" : trimmed;
}

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeFilters(input: RawEventsWorkspaceFilters = {}): EventsWorkspaceFilters {
  return {
    q: (input.q ?? "").trim(),
    status: normalizeStatus(input.status),
    workflow: normalizeWorkflow(input.workflow),
    eventType: normalizeOptionalFilter(input.eventType),
    departmentId: normalizeOptionalFilter(input.departmentId),
    dateFrom: normalizeDate(input.dateFrom),
    dateTo: normalizeDate(input.dateTo),
    eventId: (input.eventId ?? "").trim(),
    page: normalizePage(input.page),
    pageSize: normalizePageSize(input.pageSize),
    calendarView: normalizeEventsCalendarView(input.calendarView ?? input.view),
    calendarDate: normalizeDate(input.calendarDate ?? input.date) || todayDateKey(),
  };
}

function buildPermissions(ctx: { roles?: string[] | null; isPlatformAdmin?: boolean | null }): EventPermissions {
  const roleSet = new Set(ctx.roles ?? []);
  const canManageEvents = !!ctx.isPlatformAdmin || MANAGE_ROLES.some((role) => roleSet.has(role));

  return {
    canViewEvents: true,
    canManageEvents,
    canCreateEvents: canManageEvents,
    canEditEvents: canManageEvents,
    canDeleteEvents: canManageEvents,
    canChangeStatus: canManageEvents,
    canOpenApprovalQueue: canManageEvents,
  };
}

function cleanSearchTerm(value: string) {
  return value.replace(/[%,]/g, " ").replace(/\s+/g, " ").trim();
}

function buildSearchClause(value: string) {
  const term = cleanSearchTerm(value);
  if (!term) return "";
  const pattern = `%${term}%`;
  return [
    `title.ilike.${pattern}`,
    `description.ilike.${pattern}`,
    `event_type.ilike.${pattern}`,
    `location.ilike.${pattern}`,
  ].join(",");
}

function getCalendarRange(view: EventsCalendarView, dateKey: string) {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  const start = new Date(Date.UTC(safeBase.getUTCFullYear(), safeBase.getUTCMonth(), safeBase.getUTCDate()));
  const end = new Date(start);

  if (view === "week") {
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - day);
    end.setTime(start.getTime());
    end.setUTCDate(start.getUTCDate() + 7);
  } else if (view === "day") {
    end.setUTCDate(start.getUTCDate() + 1);
  } else {
    start.setUTCDate(1);
    end.setTime(start.getTime());
    end.setUTCMonth(start.getUTCMonth() + 1);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function loadChurchTimezone(supabase: any, churchId: string) {
  const { data, error } = await supabase
    .from("churches")
    .select("timezone")
    .eq("id", churchId)
    .maybeSingle();

  if (error) return "UTC";
  return data?.timezone || "UTC";
}

async function loadDepartmentRows(supabase: any, churchId: string, departmentIds: string[]) {
  const uniqueDepartmentIds = Array.from(new Set(departmentIds.filter(Boolean)));
  const departments = new Map<string, RawDepartmentRow>();
  if (uniqueDepartmentIds.length === 0) return departments;

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", churchId)
    .in("id", uniqueDepartmentIds);

  if (error) throw new Error(error.message);

  for (const department of (data ?? []) as RawDepartmentRow[]) {
    departments.set(department.id, department);
  }

  return departments;
}

async function loadEventDepartmentLinks(
  supabase: any,
  churchId: string,
  eventIds: string[],
  primaryByEventId: Map<string, string | null>
) {
  const uniqueEventIds = Array.from(new Set(eventIds.filter(Boolean)));
  const linksByEvent = new Map<string, string[]>();

  for (const eventId of uniqueEventIds) {
    const primaryDepartmentId = primaryByEventId.get(eventId);
    linksByEvent.set(eventId, primaryDepartmentId ? [primaryDepartmentId] : []);
  }

  if (uniqueEventIds.length === 0) {
    return new Map<string, EventDepartmentSummary[]>();
  }

  const { data: links, error } = await supabase
    .from("church_event_departments")
    .select("event_id, department_id")
    .eq("church_id", churchId)
    .in("event_id", uniqueEventIds);

  if (error) throw new Error(error.message);

  for (const link of (links ?? []) as RawEventLinkRow[]) {
    const existing = linksByEvent.get(link.event_id) ?? [];
    existing.push(link.department_id);
    linksByEvent.set(link.event_id, existing);
  }

  const departmentIds = Array.from(new Set(Array.from(linksByEvent.values()).flat().filter(Boolean)));
  const departments = await loadDepartmentRows(supabase, churchId, departmentIds);
  const summariesByEvent = new Map<string, EventDepartmentSummary[]>();

  for (const eventId of uniqueEventIds) {
    const primaryDepartmentId = primaryByEventId.get(eventId);
    const seen = new Map<string, EventDepartmentSummary>();

    for (const departmentId of linksByEvent.get(eventId) ?? []) {
      const department = departments.get(departmentId);
      if (!department) continue;

      const existing = seen.get(departmentId);
      seen.set(departmentId, {
        id: department.id,
        name: department.department_name,
        code: department.code ?? null,
        isActive: department.is_active ?? true,
        isPrimary: existing?.isPrimary || department.id === primaryDepartmentId,
      });
    }

    summariesByEvent.set(eventId, sortDepartments(Array.from(seen.values())));
  }

  return summariesByEvent;
}

function sortDepartments(departments: EventDepartmentSummary[]) {
  return [...departments].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function mapEventRow(row: RawEventRow, departments: EventDepartmentSummary[]): EventRegistryRow {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventType: row.event_type ?? "other",
    primaryDepartmentId: row.department_id,
    departments,
    location: row.location,
    startDateTime: row.start_datetime,
    endDateTime: row.end_datetime,
    isAllDay: row.is_all_day ?? false,
    status: toStatus(row.status),
    workflowState: toWorkflow(row.workflow_state),
    approvalNote: row.approval_note,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    createdAt: row.created_at ?? row.start_datetime,
    updatedAt: row.updated_at ?? row.created_at ?? row.start_datetime,
  };
}

async function hydrateRows(supabase: any, churchId: string, rows: RawEventRow[]) {
  const primaryByEventId = new Map(rows.map((row) => [row.id, row.department_id] as const));
  const departmentLinks = await loadEventDepartmentLinks(
    supabase,
    churchId,
    rows.map((row) => row.id),
    primaryByEventId
  );

  return rows.map((row) => mapEventRow(row, departmentLinks.get(row.id) ?? []));
}

async function getEventIdsForDepartment(supabase: any, churchId: string, departmentId: string) {
  if (!departmentId) return null;

  const [directResult, linkResult] = await Promise.all([
    supabase
      .from("church_events")
      .select("id")
      .eq("church_id", churchId)
      .eq("department_id", departmentId),
    supabase
      .from("church_event_departments")
      .select("event_id")
      .eq("church_id", churchId)
      .eq("department_id", departmentId),
  ]);

  if (directResult.error) throw new Error(directResult.error.message);
  if (linkResult.error) throw new Error(linkResult.error.message);

  return Array.from(
    new Set([
      ...((directResult.data ?? []) as Array<{ id: string }>).map((row) => row.id),
      ...((linkResult.data ?? []) as Array<{ event_id: string }>).map((row) => row.event_id),
    ])
  );
}

function applyFilters(query: any, filters: EventsWorkspaceFilters, eventIdsForDepartment: string[] | null) {
  let next = query;

  if (filters.status !== "all") {
    next = next.eq("status", filters.status);
  }

  if (filters.workflow !== "all") {
    next = next.eq("workflow_state", filters.workflow);
  }

  if (hasValue(filters.eventType)) {
    next = next.eq("event_type", filters.eventType);
  }

  if (hasValue(filters.dateFrom)) {
    next = next.gte("start_datetime", `${filters.dateFrom}T00:00:00.000Z`);
  }

  if (hasValue(filters.dateTo)) {
    next = next.lte("start_datetime", `${filters.dateTo}T23:59:59.999Z`);
  }

  const searchClause = buildSearchClause(filters.q);
  if (searchClause) {
    next = next.or(searchClause);
  }

  if (eventIdsForDepartment) {
    next = next.in("id", eventIdsForDepartment);
  }

  return next;
}

async function loadRegistry(
  supabase: any,
  churchId: string,
  filters: EventsWorkspaceFilters,
  eventIdsForDepartment: string[] | null
): Promise<EventsRegistryData> {
  if (eventIdsForDepartment && eventIdsForDepartment.length === 0) {
    return { rows: [], total: 0, page: filters.page, pageSize: filters.pageSize, pageCount: 0 };
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  const query = applyFilters(
    supabase
      .from("church_events")
      .select(
        "id, title, description, event_type, department_id, location, start_datetime, end_datetime, is_all_day, status, workflow_state, approval_note, submitted_at, approved_at, created_at, updated_at",
        { count: "exact" }
      )
      .eq("church_id", churchId),
    filters,
    eventIdsForDepartment
  )
    .order("start_datetime", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = await hydrateRows(supabase, churchId, (data ?? []) as RawEventRow[]);
  const total = count ?? rows.length;

  return {
    rows,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: total === 0 ? 0 : Math.ceil(total / filters.pageSize),
  };
}

async function loadGlobalSignals(supabase: any, churchId: string, filteredEvents: number) {
  const [{ data: eventRows, error: eventsError }, { data: linkRows, error: linksError }] = await Promise.all([
    supabase
      .from("church_events")
      .select("id, status, workflow_state, start_datetime, department_id")
      .eq("church_id", churchId),
    supabase
      .from("church_event_departments")
      .select("event_id, department_id")
      .eq("church_id", churchId),
  ]);

  if (eventsError) throw new Error(eventsError.message);
  if (linksError) throw new Error(linksError.message);

  const rows = (eventRows ?? []) as Array<{
    id: string;
    status: string | null;
    workflow_state: string | null;
    start_datetime: string;
    department_id: string | null;
  }>;
  const links = (linkRows ?? []) as RawEventLinkRow[];
  const now = Date.now();
  const linkedEventIds = new Set<string>();
  const participation = new Map<string, Set<string>>();

  for (const row of rows) {
    if (row.department_id) {
      linkedEventIds.add(row.id);
      const eventsForDepartment = participation.get(row.department_id) ?? new Set<string>();
      eventsForDepartment.add(row.id);
      participation.set(row.department_id, eventsForDepartment);
    }
  }

  for (const link of links) {
    linkedEventIds.add(link.event_id);
    const eventsForDepartment = participation.get(link.department_id) ?? new Set<string>();
    eventsForDepartment.add(link.event_id);
    participation.set(link.department_id, eventsForDepartment);
  }

  const summary: EventsSummaryMetrics = {
    totalEvents: rows.length,
    filteredEvents,
    scheduledCount: rows.filter((row) => toStatus(row.status) === "scheduled").length,
    completedCount: rows.filter((row) => toStatus(row.status) === "completed").length,
    cancelledCount: rows.filter((row) => toStatus(row.status) === "cancelled").length,
    upcomingCount: rows.filter(
      (row) => toStatus(row.status) === "scheduled" && new Date(row.start_datetime).getTime() >= now
    ).length,
    pendingApprovalCount: rows.filter((row) => toWorkflow(row.workflow_state) === "pending_approval").length,
    departmentLinkedCount: linkedEventIds.size,
  };

  return {
    rows,
    links,
    participation,
    summary,
  };
}

async function loadSelectedEvent(
  supabase: any,
  churchId: string,
  eventId: string
): Promise<EventDetailsViewModel | null> {
  if (!eventId) return null;

  const { data, error } = await supabase
    .from("church_events")
    .select(
      "id, title, description, event_type, department_id, location, start_datetime, end_datetime, is_all_day, status, workflow_state, approval_note, submitted_at, approved_at, created_at, updated_at"
    )
    .eq("church_id", churchId)
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [event] = await hydrateRows(supabase, churchId, [data as RawEventRow]);
  let approval: EventApprovalSummary | null = null;
  let approvalLoadError: string | null = null;

  const approvalResult = await supabase
    .from("approval_requests")
    .select(
      "id, status, current_stage, current_assignee_role_code, priority, submitted_at, decided_at, decision_note"
    )
    .eq("church_id", churchId)
    .eq("entity_type", "church_event")
    .eq("entity_id", eventId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (approvalResult.error) {
    approvalLoadError = "Approval details are temporarily unavailable.";
  } else if (approvalResult.data) {
    const row = approvalResult.data as {
      id: string;
      status: string;
      current_stage: string;
      current_assignee_role_code: string | null;
      priority: string;
      submitted_at: string;
      decided_at: string | null;
      decision_note: string | null;
    };
    approval = {
      id: row.id,
      status: row.status,
      currentStage: row.current_stage,
      currentAssigneeRoleCode: row.current_assignee_role_code,
      priority: row.priority,
      submittedAt: row.submitted_at,
      decidedAt: row.decided_at,
      decisionNote: row.decision_note,
    };
  }

  return {
    ...event,
    approval,
    approvalLoadError,
  };
}

async function loadOverview(
  supabase: any,
  churchId: string,
  globalSignals: Awaited<ReturnType<typeof loadGlobalSignals>>
): Promise<EventsOverviewData> {
  const now = new Date().toISOString();
  const [upcomingResult, attentionResult, recentResult] = await Promise.all([
    supabase
      .from("church_events")
      .select(
        "id, title, description, event_type, department_id, location, start_datetime, end_datetime, is_all_day, status, workflow_state, approval_note, submitted_at, approved_at, created_at, updated_at"
      )
      .eq("church_id", churchId)
      .eq("status", "scheduled")
      .gte("start_datetime", now)
      .order("start_datetime", { ascending: true })
      .limit(8),
    supabase
      .from("church_events")
      .select(
        "id, title, description, event_type, department_id, location, start_datetime, end_datetime, is_all_day, status, workflow_state, approval_note, submitted_at, approved_at, created_at, updated_at"
      )
      .eq("church_id", churchId)
      .in("workflow_state", ["draft", "pending_approval", "rejected"])
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("church_events")
      .select(
        "id, title, description, event_type, department_id, location, start_datetime, end_datetime, is_all_day, status, workflow_state, approval_note, submitted_at, approved_at, created_at, updated_at"
      )
      .eq("church_id", churchId)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  if (upcomingResult.error) throw new Error(upcomingResult.error.message);
  if (attentionResult.error) throw new Error(attentionResult.error.message);
  if (recentResult.error) throw new Error(recentResult.error.message);

  const departmentIds = Array.from(globalSignals.participation.keys());
  const departments = await loadDepartmentRows(supabase, churchId, departmentIds);
  const departmentParticipation = Array.from(globalSignals.participation.entries())
    .map(([departmentId, eventIds]) => ({
      departmentId,
      departmentName: departments.get(departmentId)?.department_name ?? "Unknown department",
      eventCount: eventIds.size,
    }))
    .sort((left, right) => right.eventCount - left.eventCount || left.departmentName.localeCompare(right.departmentName))
    .slice(0, 8);

  const statusBreakdown = STATUS_VALUES.map((status) => ({
    key: status,
    label: getEventStatusLabel(status),
    count: globalSignals.rows.filter((row) => toStatus(row.status) === status).length,
  }));

  const workflowBreakdown = WORKFLOW_VALUES.map((workflowState) => ({
    key: workflowState,
    label: getEventWorkflowLabel(workflowState),
    count: globalSignals.rows.filter((row) => toWorkflow(row.workflow_state) === workflowState).length,
  }));

  return {
    upcoming: await hydrateRows(supabase, churchId, (upcomingResult.data ?? []) as RawEventRow[]),
    needsAttention: await hydrateRows(supabase, churchId, (attentionResult.data ?? []) as RawEventRow[]),
    recentlyUpdated: await hydrateRows(supabase, churchId, (recentResult.data ?? []) as RawEventRow[]),
    departmentParticipation,
    statusBreakdown,
    workflowBreakdown,
  };
}

async function loadCalendar(
  supabase: any,
  churchId: string,
  filters: EventsWorkspaceFilters,
  eventIdsForDepartment: string[] | null
) {
  if (eventIdsForDepartment && eventIdsForDepartment.length === 0) {
    const range = getCalendarRange(filters.calendarView, filters.calendarDate);
    return { items: [], rangeStart: range.start, rangeEnd: range.end };
  }

  const range = getCalendarRange(filters.calendarView, filters.calendarDate);
  let query = supabase
    .from("church_events")
    .select(
      "id, title, description, event_type, department_id, location, start_datetime, end_datetime, is_all_day, status, workflow_state, approval_note, submitted_at, approved_at, created_at, updated_at"
    )
    .eq("church_id", churchId)
    .lt("start_datetime", range.end)
    .gt("end_datetime", range.start);

  query = applyFilters(query, { ...filters, dateFrom: "", dateTo: "" }, eventIdsForDepartment)
    .order("start_datetime", { ascending: true })
    .limit(500);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = await hydrateRows(supabase, churchId, (data ?? []) as RawEventRow[]);
  const items: EventCalendarItem[] = rows.map((row) => ({
    ...row,
    calendarDateKey: row.startDateTime.slice(0, 10),
  }));

  return {
    items,
    rangeStart: range.start,
    rangeEnd: range.end,
  };
}

async function loadFormOptions(
  supabase: any,
  churchId: string,
  selectedEvent: EventDetailsViewModel | null
): Promise<EventsFormOptions> {
  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("department_name", { ascending: true });

  if (error) throw new Error(error.message);

  const selectedDepartmentIds = new Set(selectedEvent?.departments.map((department) => department.id) ?? []);
  const optionMap = new Map<string, EventDepartmentSummary>();

  for (const department of (data ?? []) as RawDepartmentRow[]) {
    optionMap.set(department.id, {
      id: department.id,
      name: department.department_name,
      code: department.code ?? null,
      isActive: department.is_active ?? true,
      isPrimary: selectedEvent?.primaryDepartmentId === department.id,
    });
  }

  for (const department of selectedEvent?.departments ?? []) {
    optionMap.set(department.id, department);
  }

  const departments = Array.from(optionMap.values()).sort((left, right) => {
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    const leftSelected = selectedDepartmentIds.has(left.id);
    const rightSelected = selectedDepartmentIds.has(right.id);
    if (leftSelected !== rightSelected) return leftSelected ? -1 : 1;
    return left.name.localeCompare(right.name);
  });

  const eventTypes = [...EVENT_TYPE_OPTIONS];
  if (selectedEvent && !eventTypes.some((option) => option.value === selectedEvent.eventType)) {
    eventTypes.push({ value: selectedEvent.eventType, label: selectedEvent.eventType });
  }

  return {
    departments,
    eventTypes,
  };
}

export async function getEventsWorkspaceData(
  churchSlug: string,
  rawFilters: RawEventsWorkspaceFilters = {}
): Promise<EventsWorkspaceData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();
  const filters = normalizeFilters(rawFilters);
  const navigation = normalizeEventsNavigation({
    tab: rawFilters.tab,
    eventId: filters.eventId,
    dialog: rawFilters.dialog,
    calendarView: rawFilters.calendarView,
    view: rawFilters.view,
  });
  const selectedEventId = navigation.selectedEventId || filters.eventId;
  const timezone = await loadChurchTimezone(supabase, ctx.churchId);
  const eventIdsForDepartment = await getEventIdsForDepartment(supabase, ctx.churchId, filters.departmentId);
  const registry = await loadRegistry(supabase, ctx.churchId, filters, eventIdsForDepartment);
  const globalSignals = await loadGlobalSignals(supabase, ctx.churchId, registry.total);
  const selectedEvent = await loadSelectedEvent(supabase, ctx.churchId, selectedEventId);
  const [overview, calendar, formOptions] = await Promise.all([
    loadOverview(supabase, ctx.churchId, globalSignals),
    loadCalendar(supabase, ctx.churchId, filters, eventIdsForDepartment),
    loadFormOptions(supabase, ctx.churchId, selectedEvent),
  ]);

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
      timezone,
    },
    locale: "en",
    navigation: {
      ...navigation,
      selectedEventId,
      dialog:
        navigation.dialog?.type === "edit" && !selectedEvent
          ? null
          : navigation.dialog,
    },
    filters,
    permissions: buildPermissions(ctx),
    summary: globalSignals.summary,
    registry,
    overview,
    calendar,
    selectedEvent,
    formOptions,
  };
}

export async function requireEventManager(churchSlug: string) {
  return requireChurchRole(churchSlug, [...MANAGE_ROLES]);
}
