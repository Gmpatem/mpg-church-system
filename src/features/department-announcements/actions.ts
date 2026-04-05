"use server";

import { revalidatePath } from "next/cache";
import { requireChurchRole } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";
import { parseCreateDepartmentAnnouncementInput } from "./validators";
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

async function insertDepartmentAnnouncementNotifications(
  supabase: any,
  churchId: string,
  departmentId: string,
  title: string,
  href: string
) {
  const { data: members, error: membersError } = await supabase
    .from("member_departments")
    .select("member_id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("is_active", true);

  if (membersError) throw new Error(membersError.message);

  const memberIds = Array.from(new Set((members ?? []).map((m: any) => m.member_id).filter(Boolean)));
  if (memberIds.length === 0) return;

  const { data: memberProfiles, error: profileLookupError } = await supabase
    .from("members")
    .select("id, profile_id")
    .in("id", memberIds)
    .not("profile_id", "is", null);

  if (profileLookupError) throw new Error(profileLookupError.message);

  const rows = (memberProfiles ?? []).map((row: any) => ({
    church_id: churchId,
    target_user_id: row.profile_id,
    event_type: "department_announcement",
    entity_type: "department_announcement",
    title: "New department announcement",
    message: title,
    href,
    is_read: false,
  }));

  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from("church_notifications").insert(rows);
  if (insertError) throw new Error(insertError.message);
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  const supabase = await createClient();

  try {
    const parsed = parseCreateDepartmentAnnouncementInput({
      churchId: ctx.churchId,
      departmentId: getString(formData, "departmentId"),
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

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  const supabase = await createClient();

  if (!departmentId || !announcementId) {
    return { ok: false, error: "Department and announcement are required." };
  }

  const department = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
  if (!department) {
    return { ok: false, error: "Department not found for this church." };
  }

  const { data: announcement, error: fetchError } = await supabase
    .from("department_announcements")
    .select("id, title")
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

  const existingApproval = await getApprovalRequestByEntity(
    churchSlug,
    "department_announcement",
    announcementId
  );

  if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
    await createApprovalRequest({
      churchSlug,
      moduleKey: "announcements",
      entityType: "department_announcement",
      entityId: announcementId,
      requestType: "announcement_publish",
      payload: {
        departmentId,
        title: announcement.title,
      },
      priority: "normal",
    });
  }

  const { error } = await supabase
    .from("department_announcements")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      approved_by_user_id: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", announcementId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const approval = await getApprovalRequestByEntity(
    churchSlug,
    "department_announcement",
    announcementId
  );

  if (approval && approval.status === "pending") {
    await decideApprovalRequest({
      churchSlug,
      approvalRequestId: approval.id,
      decision: "approved",
      note: `Department announcement "${announcement.title}" published.`,
    });
  }

  await insertDepartmentAnnouncementNotifications(
    supabase,
    ctx.churchId,
    departmentId,
    announcement.title,
    `/c/${churchSlug}/departments/${departmentId}/announcements`
  );

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/announcements`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/my/${churchSlug}`);
  revalidatePath(`/c/${churchSlug}/office`);

  return { ok: true, message: "Department announcement published." };
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

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  const supabase = await createClient();

  if (!departmentId || !announcementId) {
    return { ok: false, error: "Department and announcement are required." };
  }

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

  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/announcements`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
  revalidatePath(`/c/${churchSlug}/departments`);

  return { ok: true, message: "Department announcement archived." };
}


