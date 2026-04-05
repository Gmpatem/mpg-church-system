"use server";

import { revalidatePath } from "next/cache";
import { requireChurchRole } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";
import { parseCreateChurchAnnouncementInput } from "./validators";
import { createApprovalRequest, decideApprovalRequest } from "@/features/approvals/actions";
import { getApprovalRequestByEntity } from "@/features/approvals/queries";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function insertAnnouncementNotifications(
  supabase: any,
  churchId: string,
  title: string,
  message: string,
  href: string
) {
  const { data: churchUsers, error: usersError } = await supabase
    .from("church_users")
    .select("user_id")
    .eq("church_id", churchId)
    .eq("status", "active");

  if (usersError) throw new Error(usersError.message);

  const rows = (churchUsers ?? []).map((row: any) => ({
    church_id: churchId,
    target_user_id: row.user_id,
    event_type: "announcement",
    entity_type: "church_announcement",
    title,
    message,
    href,
    is_read: false,
  }));

  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from("church_notifications").insert(rows);
  if (insertError) throw new Error(insertError.message);
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  const supabase = await createClient();

  if (!announcementId) {
    return { ok: false, error: "Announcement ID is required." };
  }

  const { data: announcement, error: fetchError } = await supabase
    .from("church_announcements")
    .select("id, title, body")
    .eq("church_id", ctx.churchId)
    .eq("id", announcementId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!announcement) {
    return { ok: false, error: "Announcement not found." };
  }

  const existingApproval = await getApprovalRequestByEntity(
    churchSlug,
    "church_announcement",
    announcementId
  );

  if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
    await createApprovalRequest({
      churchSlug,
      moduleKey: "announcements",
      entityType: "church_announcement",
      entityId: announcementId,
      requestType: "announcement_publish",
      payload: {
        title: announcement.title,
        body: announcement.body,
      },
      priority: "normal",
    });
  }

  const { error } = await supabase
    .from("church_announcements")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      approved_by_user_id: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const approval = await getApprovalRequestByEntity(
    churchSlug,
    "church_announcement",
    announcementId
  );

  if (approval && approval.status === "pending") {
    await decideApprovalRequest({
      churchSlug,
      approvalRequestId: approval.id,
      decision: "approved",
      note: `Church announcement "${announcement.title}" published.`,
    });
  }

  await insertAnnouncementNotifications(
    supabase,
    ctx.churchId,
    "New church announcement",
    announcement.title,
    `/c/${churchSlug}/announcements`
  );

  revalidatePath(`/c/${churchSlug}/announcements`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/my/${churchSlug}`);
  revalidatePath(`/c/${churchSlug}/office`);

  return { ok: true, message: "Announcement published." };
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
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

  revalidatePath(`/c/${churchSlug}/announcements`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return { ok: true, message: "Announcement archived." };
}


