"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDepartmentAccess } from "./access";
import type { ActionState } from "./types";

const actionPlanSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(180),
  description: z.string().trim().max(2000).optional().default(""),
  area: z.string().trim().max(120).optional().default(""),
  assignedToMemberId: z.string().uuid("Responsible person is required."),
  dueDate: z.string().trim().optional().default(""),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["pending", "accepted", "in_progress", "completed", "cancelled"]),
  progress: z.coerce.number().int().min(0).max(100),
  relatedEventId: z.string().trim().optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function validateActionPlanReferences(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  memberId: string;
  eventId: string | null;
}) {
  const { supabase, churchId, departmentId, memberId, eventId } = params;
  const { data: memberAssignment, error: memberError } = await supabase
    .from("member_departments")
    .select("id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("member_id", memberId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (memberError) throw new Error(memberError.message);
  if (!memberAssignment) return "Responsible person must be an active member of this department.";

  if (eventId) {
    const { data: event, error: eventError } = await supabase
      .from("church_events")
      .select("id")
      .eq("church_id", churchId)
      .eq("department_id", departmentId)
      .eq("id", eventId)
      .maybeSingle();
    if (eventError) throw new Error(eventError.message);
    if (!event) return "Related event must belong to this department.";
  }

  return null;
}

export async function createDepartmentActionPlanItemAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const departmentId = getString(formData, "departmentId");
    if (!churchSlug || !departmentId) {
      return { ok: false, error: "Church and department are required." };
    }

    const parsed = actionPlanSchema.safeParse({
      title: getString(formData, "title"),
      description: getString(formData, "description"),
      area: getString(formData, "area"),
      assignedToMemberId: getString(formData, "assignedToMemberId"),
      dueDate: getString(formData, "dueDate"),
      priority: getString(formData, "priority") || "normal",
      status: getString(formData, "status") || "pending",
      progress: getString(formData, "progress") || "0",
      relatedEventId: getString(formData, "relatedEventId"),
      notes: getString(formData, "notes"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid action-plan item." };
    }

    const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_action_plan");
    const { ctx, supabase } = access;
    const values = parsed.data;
    const referenceError = await validateActionPlanReferences({
      supabase,
      churchId: ctx.churchId,
      departmentId,
      memberId: values.assignedToMemberId,
      eventId: values.relatedEventId || null,
    });
    if (referenceError) return { ok: false, error: referenceError };

    const { error } = await supabase.from("church_assignments").insert({
      church_id: ctx.churchId,
      assigned_to_member_id: values.assignedToMemberId,
      assigned_by_user_id: ctx.userId,
      assignment_type: "department_action_plan",
      title: values.title,
      description: values.description || null,
      related_department_id: departmentId,
      related_event_id: values.relatedEventId || null,
      scheduled_date: values.dueDate || null,
      status: values.status,
      priority: values.priority,
      notes: values.notes || null,
      metadata: {
        source: "department_workspace",
        area: values.area || null,
        progress: values.progress,
      },
    });

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/c/${churchSlug}/departments`);
    return { ok: true, message: "Action-plan item created." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create action-plan item.",
    };
  }
}

export async function updateDepartmentActionPlanItemAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const departmentId = getString(formData, "departmentId");
    const itemId = getString(formData, "itemId");
    if (!churchSlug || !departmentId || !itemId) {
      return { ok: false, error: "Church, department, and action item are required." };
    }

    const parsed = actionPlanSchema.safeParse({
      title: getString(formData, "title"),
      description: getString(formData, "description"),
      area: getString(formData, "area"),
      assignedToMemberId: getString(formData, "assignedToMemberId"),
      dueDate: getString(formData, "dueDate"),
      priority: getString(formData, "priority") || "normal",
      status: getString(formData, "status") || "pending",
      progress: getString(formData, "progress") || "0",
      relatedEventId: getString(formData, "relatedEventId"),
      notes: getString(formData, "notes"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid action-plan item." };
    }

    const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_action_plan");
    const { ctx, supabase } = access;
    const values = parsed.data;
    const referenceError = await validateActionPlanReferences({
      supabase,
      churchId: ctx.churchId,
      departmentId,
      memberId: values.assignedToMemberId,
      eventId: values.relatedEventId || null,
    });
    if (referenceError) return { ok: false, error: referenceError };

    const { data: existing, error: existingError } = await supabase
      .from("church_assignments")
      .select("id, metadata")
      .eq("church_id", ctx.churchId)
      .eq("related_department_id", departmentId)
      .eq("id", itemId)
      .maybeSingle();
    if (existingError) return { ok: false, error: existingError.message };
    if (!existing) return { ok: false, error: "Action-plan item was not found in this department." };

    const existingMetadata =
      existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {};
    const { error } = await supabase
      .from("church_assignments")
      .update({
        assigned_to_member_id: values.assignedToMemberId,
        title: values.title,
        description: values.description || null,
        related_event_id: values.relatedEventId || null,
        scheduled_date: values.dueDate || null,
        status: values.status,
        priority: values.priority,
        notes: values.notes || null,
        metadata: {
          ...existingMetadata,
          source: "department_workspace",
          area: values.area || null,
          progress: values.progress,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("related_department_id", departmentId)
      .eq("id", itemId);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/c/${churchSlug}/departments`);
    return { ok: true, message: "Action-plan item updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update action-plan item.",
    };
  }
}
