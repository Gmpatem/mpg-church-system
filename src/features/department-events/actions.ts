"use server";

import { revalidatePath } from "next/cache";
import { requireChurchRole } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";
import { createApprovalRequest, decideApprovalRequest } from "@/features/approvals/actions";
import { getApprovalRequestByEntity } from "@/features/approvals/queries";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function ensureDepartmentBelongsToChurch(supabase: any, churchId: string, departmentId: string) {
  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createDepartmentEventDraftAction(formData: FormData): Promise<void> {
  const result = await createDepartmentEventDraftActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to create department event draft.");
  }
}

async function createDepartmentEventDraftActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  const supabase = await createClient();

  try {
    if (!departmentId) {
      return { ok: false, error: "Department is required." };
    }

    const department = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
    if (!department) {
      return { ok: false, error: "Department not found for this church." };
    }

    const title = getString(formData, "title");
    const description = getString(formData, "description");
    const eventType = getString(formData, "eventType") || "department_activity";
    const location = getString(formData, "location");
    const startDateTime = getString(formData, "startDateTime");
    const endDateTime = getString(formData, "endDateTime");
    const isAllDay = getBoolean(formData, "isAllDay");

    if (!title) return { ok: false, error: "Title is required." };
    if (!startDateTime) return { ok: false, error: "Start date/time is required." };
    if (!endDateTime) return { ok: false, error: "End date/time is required." };

    const { error } = await supabase.from("church_events").insert({
      church_id: ctx.churchId,
      department_id: departmentId,
      title,
      description: description || null,
      event_type: eventType,
      location: location || null,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      is_all_day: isAllDay,
      status: "scheduled",
      workflow_state: "draft",
      created_by_user_id: ctx.userId,
      metadata: {
        source: "department_workspace",
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(`/c/${churchSlug}/departments/${departmentId}/events`);
    revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);

    return { ok: true, message: "Department event draft created." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create department event draft.",
    };
  }
}

export async function submitDepartmentEventForApprovalAction(formData: FormData): Promise<void> {
  const result = await submitDepartmentEventForApprovalActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to submit department event for approval.");
  }
}

async function submitDepartmentEventForApprovalActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const eventId = getString(formData, "eventId");

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  const supabase = await createClient();

  if (!departmentId || !eventId) {
    return { ok: false, error: "Department and event are required." };
  }

  const { data: eventRow, error: fetchError } = await supabase
    .from("church_events")
    .select("id, title, event_type, start_datetime, end_datetime, location, workflow_state")
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!eventRow) {
    return { ok: false, error: "Event not found." };
  }

  const { error } = await supabase
    .from("church_events")
    .update({
      workflow_state: "pending_approval",
      submitted_by_user_id: ctx.userId,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", eventId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const existingApproval = await getApprovalRequestByEntity(
    churchSlug,
    "church_event",
    eventId
  );

  if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
    await createApprovalRequest({
      churchSlug,
      moduleKey: "events",
      entityType: "church_event",
      entityId: eventId,
      requestType: "department_event_submission",
      payload: {
        departmentId,
        title: eventRow.title,
        eventType: eventRow.event_type,
        location: eventRow.location,
        startDateTime: eventRow.start_datetime,
        endDateTime: eventRow.end_datetime,
        workflowState: "pending_approval",
      },
      priority: "normal",
    });
  }

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/events`);
  revalidatePath(`/c/${churchSlug}/calendar`);
  revalidatePath(`/c/${churchSlug}/office`);

  return { ok: true, message: "Event submitted for approval." };
}

export async function approveDepartmentEventAction(formData: FormData): Promise<void> {
  const result = await approveDepartmentEventActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to approve department event.");
  }
}

async function approveDepartmentEventActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const eventId = getString(formData, "eventId");

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor"]);
  const supabase = await createClient();

  if (!departmentId || !eventId) {
    return { ok: false, error: "Department and event are required." };
  }

  const { data: eventRow, error: fetchError } = await supabase
    .from("church_events")
    .select("id, title")
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!eventRow) {
    return { ok: false, error: "Event not found." };
  }

  const { error } = await supabase
    .from("church_events")
    .update({
      workflow_state: "approved",
      approved_by_user_id: ctx.userId,
      approved_at: new Date().toISOString(),
      approval_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", eventId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const approval = await getApprovalRequestByEntity(churchSlug, "church_event", eventId);
  if (approval && approval.status === "pending") {
    await decideApprovalRequest({
      churchSlug,
      approvalRequestId: approval.id,
      decision: "approved",
      note: `Department event "${eventRow.title}" approved.`,
    });
  }

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/events`);
  revalidatePath(`/c/${churchSlug}/calendar`);
  revalidatePath(`/c/${churchSlug}/events`);
  revalidatePath(`/c/${churchSlug}/office`);

  return { ok: true, message: "Department event approved and added to church calendar." };
}

export async function rejectDepartmentEventAction(formData: FormData): Promise<void> {
  const result = await rejectDepartmentEventActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to reject department event.");
  }
}

async function rejectDepartmentEventActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const eventId = getString(formData, "eventId");
  const approvalNote = getString(formData, "approvalNote");

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor"]);
  const supabase = await createClient();

  if (!departmentId || !eventId) {
    return { ok: false, error: "Department and event are required." };
  }

  if (!approvalNote) {
    return { ok: false, error: "Approval note is required when rejecting an event." };
  }

  const { error } = await supabase
    .from("church_events")
    .update({
      workflow_state: "rejected",
      approved_by_user_id: ctx.userId,
      approved_at: new Date().toISOString(),
      approval_note: approvalNote,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", eventId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const approval = await getApprovalRequestByEntity(churchSlug, "church_event", eventId);
  if (approval && approval.status === "pending") {
    await decideApprovalRequest({
      churchSlug,
      approvalRequestId: approval.id,
      decision: "rejected",
      note: approvalNote,
    });
  }

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/events`);
  revalidatePath(`/c/${churchSlug}/calendar`);
  revalidatePath(`/c/${churchSlug}/office`);

  return { ok: true, message: "Department event rejected." };
}


