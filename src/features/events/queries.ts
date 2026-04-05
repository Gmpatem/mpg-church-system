import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

interface EventsWorkspaceFilters {
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  eventId?: string;
  tab?: string;
}

function hasValue(value?: string) {
  return !!value && value.trim().length > 0;
}

function normalizeEventsTab(
  value?: string
): "all_events" | "create_event" | "detail" | "edit" | "calendar_notes" {
  const tab = (value ?? "").trim().toLowerCase();

  if (tab === "detail") return "detail";
  if (tab === "edit") return "edit";
  if (tab === "create_event") return "create_event";
  if (tab === "calendar_notes") return "calendar_notes";

  return "all_events";
}

export async function getEventsWorkspaceData(
  churchSlug: string,
  filters: EventsWorkspaceFilters = {}
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  let query = supabase
    .from("church_events")
    .select(`
      id,
      title,
      description,
      event_type,
      department_id,
      location,
      start_datetime,
      end_datetime,
      is_all_day,
      status,
      workflow_state,
      approval_note,
      church_departments:department_id (
        department_name
      )
    `)
    .eq("church_id", ctx.churchId)
    .order("start_datetime", { ascending: false });

  if (hasValue(filters.status)) {
    query = query.eq("status", filters.status!.trim());
  }

  if (hasValue(filters.dateFrom)) {
    query = query.gte("start_datetime", `${filters.dateFrom}T00:00:00`);
  }

  if (hasValue(filters.dateTo)) {
    query = query.lte("start_datetime", `${filters.dateTo}T23:59:59`);
  }

  const [
    { data: events, error: eventsError },
    { data: departments, error: departmentsError }
  ] = await Promise.all([
    query,
    supabase
      .from("church_departments")
      .select("id, department_name, code, is_active")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true)
      .order("department_name", { ascending: true }),
  ]);

  if (eventsError) throw new Error(eventsError.message);
  if (departmentsError) throw new Error(departmentsError.message);

  let rows =
    (events ?? []).map((event: any) => ({
      ...event,
      department_name: event.church_departments?.department_name ?? null,
    })) ?? [];

  if (hasValue(filters.q)) {
    const needle = filters.q!.trim().toLowerCase();

    rows = rows.filter((event) => {
      const haystack = [
        event.title,
        event.description,
        event.event_type,
        event.location,
        event.department_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }

  const now = Date.now();

  const stats = {
    totalEvents: rows.length,
    scheduledCount: rows.filter((row) => row.status === "scheduled").length,
    completedCount: rows.filter((row) => row.status === "completed").length,
    cancelledCount: rows.filter((row) => row.status === "cancelled").length,
    departmentLinkedCount: rows.filter((row) => !!row.department_id).length,
    upcomingCount: rows.filter(
      (row) => row.status === "scheduled" && new Date(row.start_datetime).getTime() >= now
    ).length,
  };

  const selectedEvent =
    hasValue(filters.eventId)
      ? rows.find((row) => row.id === filters.eventId) ?? null
      : null;

  let activeTab = normalizeEventsTab(filters.tab);

  if (selectedEvent && activeTab === "all_events") {
    activeTab = "detail";
  }

  if (!selectedEvent && (activeTab === "detail" || activeTab === "edit")) {
    activeTab = "all_events";
  }

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    filters,
    activeTab,
    selectedEvent,
    stats,
    events: rows,
    formOptions: {
      departments: (departments ?? []).map((department: any) => ({
        id: department.id,
        department_name: department.department_name,
        code: department.code ?? null,
        is_active: department.is_active ?? true,
      })),
    },
  };
}

export async function requireEventManager(churchSlug: string) {
  return requireChurchAccess(churchSlug);
}

