"use server";

import { revalidatePath } from "next/cache";
import { requireDepartmentAccess } from "@/features/departments/access";
import type { ActionState } from "@/features/access/types";
import { parseCreateDepartmentAnnouncementInput } from "./validators";
import { createApprovalRequest } from "@/features/approvals/actions";
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

export async function createDepartmentAnnouncementAction(formData: FormData): Promise<void> {
  const result = await createDepartmentAnnouncementActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to create department announcement.");
  }
}

async function createDepartmentAnnouncementActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");

  try {
    if (!departmentId) return { ok: false, error: "Department is required." };
    const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_announcements");
    const { ctx, supabase } = access;
    const parsed = parseCreateDepartmentAnnouncementInput({
      churchId: ctx.churchId,
      departmentId,
      title: getString(formData, "title"),
      body: getString(formData, "body"),
      audienceScope: getString(formData, "audienceScope") || "department_members",
      requiresAcknowledgement: getBoolean(formData, "requiresAcknowledgement"),
      expiresAt: getString(formData, "expiresAt"),
    });

    const department = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, parsed.departmentId);
    if (!department) {
      return { ok: false, error: "Department not found for this church." };
    }

    const { error } = await supabase.from("department_announcements").insert({
      church_id: ctx.churchId,
      department_id: parsed.departmentId,
      title: parsed.title,
      body: parsed.body,
      audience_scope: parsed.audienceScope,
      status: "draft",
      requires_acknowledgement: parsed.requiresAcknowledgement,
      expires_at: parsed.expiresAt,
      created_by_user_id: ctx.userId,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(`/c/${churchSlug}/departments/${parsed.departmentId}/announcements`);
    revalidatePath(`/c/${churchSlug}/departments/${parsed.departmentId}`);
    revalidatePath(`/c/${churchSlug}/departments`);

    return { ok: true, message: "Department announcement saved as draft." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create department announcement.",
    };
  }
}

export async function publishDepartmentAnnouncementAction(formData: FormData): Promise<void> {
  const result = await publishDepartmentAnnouncementActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to publish department announcement.");
  }
}

async function publishDepartmentAnnouncementActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const announcementId = getString(formData, "announcementId");

  if (!departmentId || !announcementId) {
    return { ok: false, error: "Department and announcement are required." };
  }

  const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_announcements");
  const { ctx, supabase } = access;

  const department = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
  if (!department) {
    return { ok: false, error: "Department not found for this church." };
  }

  const { data: announcement, error: fetchError } = await supabase
    .from("department_announcements")
    .select("id, title, status, audience_scope")
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", announcementId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!announcement) {
    return { ok: false, error: "Announcement not found." };
  }

  if (announcement.status === "archived") {
    return { ok: false, error: "Archived announcements cannot be submitted for approval." };
  }

  if (announcement.status === "published") {
    return { ok: true, message: "Announcement is already published." };
  }

  const existingApproval = await getApprovalRequestByEntity(
    churchSlug,
    "department_announcement",
    announcementId
  );

  if (
    !existingApproval ||
    ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)
  ) {
    await createApprovalRequest({
      churchSlug,
      moduleKey: "announcements",
      entityType: "department_announcement",
      entityId: announcementId,
      requestType: "announcement_publish",
      payload: {
        departmentId,
        title: announcement.title,
        audienceScope: announcement.audience_scope,
      },
      priority: "normal",
    });
  } else if (existingApproval.status === "pending" && announcement.status === "pending_approval") {
    return { ok: true, message: "Announcement is already in the approval queue." };
  }

  const { error } = await supabase
    .from("department_announcements")
    .update({
      status: "pending_approval",
      approval_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/announcements`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/c/${churchSlug}/office`);
  revalidatePath(`/c/${churchSlug}/approvals`);
  revalidatePath(`/my/${churchSlug}`);

  return { ok: true, message: "Department announcement submitted for approval." };
}

export async function archiveDepartmentAnnouncementAction(formData: FormData): Promise<void> {
  const result = await archiveDepartmentAnnouncementActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to archive department announcement.");
  }
}

async function archiveDepartmentAnnouncementActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const announcementId = getString(formData, "announcementId");

  if (!departmentId || !announcementId) {
    return { ok: false, error: "Department and announcement are required." };
  }


  const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_announcements");
  const { ctx, supabase } = access;

  const { error } = await supabase
    .from("department_announcements")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: notificationError } = await supabase
    .from("church_notifications")
    .update({ expires_at: new Date().toISOString() })
    .eq("church_id", ctx.churchId)
    .eq("entity_type", "department_announcement")
    .eq("entity_id", announcementId);

  if (notificationError) {
    return { ok: false, error: notificationError.message };
  }

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/announcements`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/my/${churchSlug}`);

  return { ok: true, message: "Department announcement archived." };
}


