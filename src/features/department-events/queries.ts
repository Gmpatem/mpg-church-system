import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { getPendingApprovalQueue } from "@/features/approvals/queries";

export async function getDepartmentEventsWorkflowData(
  churchSlug: string,
  departmentId: string
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [{ data: department, error: departmentError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("church_departments")
        .select("id, department_name, description, is_active")
        .eq("church_id", ctx.churchId)
        .eq("id", departmentId)
        .maybeSingle(),
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
          workflow_state,
          approval_note,
          submitted_at,
          approved_at,
          created_at,
          updated_at
        `)
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .order("start_datetime", { ascending: false }),
    ]);

  if (departmentError) {
    throw new Error(departmentError.message);
  }

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const approvalQueue = await getPendingApprovalQueue(churchSlug, "events");

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    department,
    events: (events ?? []).map((event) => {
      const approval = approvalQueue.find(
        (item) => item.entity_type === "church_event" && item.entity_id === event.id
      );

      return {
        ...event,
        approval_status: approval?.status ?? null,
        approval_stage: approval?.current_stage ?? null,
        approval_request_id: approval?.id ?? null,
      };
    }),
  };
}


