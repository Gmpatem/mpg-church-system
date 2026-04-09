import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import type { CalendarEvent } from "./types";

const DEPARTMENT_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#4f46e5",
  "#65a30d",
];

export async function getChurchCalendarData(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [{ data: events, error: eventsError }, { data: departments, error: departmentsError }] =
    await Promise.all([
      supabase
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
          workflow_state
        `)
        .eq("church_id", ctx.churchId)
        .in("workflow_state", ["approved", "published"])
        .order("start_datetime", { ascending: true }),
      supabase
        .from("church_departments")
        .select("id, department_name")
        .eq("church_id", ctx.churchId)
        .eq("is_active", true)
        .order("department_name", { ascending: true }),
    ]);

  if (eventsError) throw new Error(eventsError.message);
  if (departmentsError) throw new Error(departmentsError.message);

  const departmentOptions = (departments ?? []).map((department, index) => ({
    ...department,
    color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
  }));

  const departmentMap = new Map(
    departmentOptions.map((department) => [department.id, department])
  );

  const calendarEvents = (events ?? []).map((event) => {
    const department = event.department_id ? departmentMap.get(event.department_id) : null;

    return {
      id: event.id,
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime,
      allDay: event.is_all_day,
      status: event.status,
      eventType: event.event_type,
      location: event.location,
      departmentId: event.department_id,
      departmentName: department?.department_name ?? null,
      description: event.description,
      churchSlug,
    };
  });

  return {
    churchSlug,
    churchName: ctx.churchName ?? ctx.churchSlug,
    timezone: "UTC",
    events: calendarEvents,
    departments: departmentOptions,
  };
}

export async function getPublishedEvents(
  churchId: string,
  departmentId?: string
): Promise<CalendarEvent[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("church_events")
      .select("id, title, start_datetime, end_datetime, event_type, department_id, location, is_all_day")
      .eq("church_id", churchId)
      .eq("workflow_state", "published")
      .neq("status", "cancelled")
      .order("start_datetime", { ascending: true });

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    const { data, error } = await query;

    if (error) return [];

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      start: row.start_datetime,
      end: row.end_datetime,
      event_type: row.event_type,
      department_id: row.department_id ?? null,
      location: row.location ?? null,
      is_all_day: row.is_all_day,
    }));
  } catch {
    return [];
  }
}


