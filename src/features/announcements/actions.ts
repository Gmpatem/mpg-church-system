"use server";

import { revalidatePath } from "next/cache";
import { requireChurchRole } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";
import { parseCreateChurchAnnouncementInput } from "./validators";
import { createApprovalRequest } from "@/features/approvals/actions";
import { getApprovalRequestByEntity } from "@/features/approvals/queries";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createChurchAnnouncementAction(formData: FormData): Promise<void> {
  const result = await createChurchAnnouncementActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to create announcement.");
  }
}

async function createChurchAnnouncementActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, [
    "church_admin",
    "pastor",
    "elder",
    "clerk",
    "church_secretary",
  ]);
  const supabase = await createClient();

  try {
    const parsed = parseCreateChurchAnnouncementInput({
      churchId: ctx.churchId,
      departmentId: getString(formData, "departmentId"),
      title: getString(formData, "title"),
      body: getString(formData, "body"),
      audienceScope: getString(formData, "audienceScope") || "church_wide",
      requiresAcknowledgement: getBoolean(formData, "requiresAcknowledgement"),
      expiresAt: getString(formData, "expiresAt"),
    });

    const { error } = await supabase.from("church_announcements").insert({
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

    revalidatePath(`/c/${churchSlug}/announcements`);
    revalidatePath(`/c/${churchSlug}/dashboard`);

    return { ok: true, message: "Announcement saved as draft." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create announcement.",
    };
  }
}

export async function publishChurchAnnouncementAction(formData: FormData): Promise<void> {
  const result = await publishChurchAnnouncementActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to publish announcement.");
  }
}

async function publishChurchAnnouncementActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const announcementId = getString(formData, "announcementId");
  const ctx = await requireChurchRole(churchSlug, [
    "church_admin",
    "pastor",
    "elder",
    "clerk",
    "church_secretary",
  ]);
  const supabase = await createClient();

  if (!announcementId) {
    return { ok: false, error: "Announcement ID is required." };
  }

  const { data: announcement, error: fetchError } = await supabase
    .from("church_announcements")
    .select("id, title, body, status, audience_scope, department_id")
    .eq("church_id", ctx.churchId)
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
    "church_announcement",
    announcementId
  );

  if (
    !existingApproval ||
    ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)
  ) {
    await createApprovalRequest({
      churchSlug,
      moduleKey: "announcements",
      entityType: "church_announcement",
      entityId: announcementId,
      requestType: "announcement_publish",
      payload: {
        title: announcement.title,
        body: announcement.body,
        audienceScope: announcement.audience_scope,
        departmentId: announcement.department_id,
      },
      priority: "normal",
    });
  } else if (existingApproval.status === "pending" && announcement.status === "pending_approval") {
    return { ok: true, message: "Announcement is already in the approval queue." };
  }

  const { error } = await supabase
    .from("church_announcements")
    .update({
      status: "pending_approval",
      approval_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/announcements`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/c/${churchSlug}/office`);
  revalidatePath(`/c/${churchSlug}/approvals`);
  revalidatePath(`/my/${churchSlug}`);

  return { ok: true, message: "Announcement submitted for approval." };
}

export async function archiveChurchAnnouncementAction(formData: FormData): Promise<void> {
  const result = await archiveChurchAnnouncementActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to archive announcement.");
  }
}

async function archiveChurchAnnouncementActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const announcementId = getString(formData, "announcementId");
  const ctx = await requireChurchRole(churchSlug, [
    "church_admin",
    "pastor",
    "elder",
    "clerk",
    "church_secretary",
  ]);
  const supabase = await createClient();

  if (!announcementId) {
    return { ok: false, error: "Announcement ID is required." };
  }

  const { error } = await supabase
    .from("church_announcements")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: notificationError } = await supabase
    .from("church_notifications")
    .update({ expires_at: new Date().toISOString() })
    .eq("church_id", ctx.churchId)
    .eq("entity_type", "church_announcement")
    .eq("entity_id", announcementId);

  if (notificationError) {
    return { ok: false, error: notificationError.message };
  }

  revalidatePath(`/c/${churchSlug}/announcements`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/my/${churchSlug}`);

  return { ok: true, message: "Announcement archived." };
}


