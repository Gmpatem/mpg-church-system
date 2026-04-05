import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

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


