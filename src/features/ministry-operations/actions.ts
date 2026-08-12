"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireChurchAccess, requireMemberPortalAccess } from "@/features/access/queries";
import type { MinistryActionState, MinistryScopeType } from "./types";

const initialSuccess = (message: string): MinistryActionState => ({ ok: true, message });
const failure = (error: unknown): MinistryActionState => ({ ok: false, error: error instanceof Error ? error.message : "Something went wrong." });

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

function roleCanManage(roleTitle: string | null | undefined) {
  const value = String(roleTitle ?? "").toLowerCase();
  return ["leader", "head", "assistant", "coordinator", "deacon", "usher", "secretary", "clerk"].some((word) => value.includes(word));
}

async function linkedMember(admin: any, churchId: string, userId: string) {
  const { data, error } = await admin
    .from("members")
    .select("id, first_name, last_name, display_name, member_code, profile_id")
    .eq("church_id", churchId)
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function requireScopeManager(churchSlug: string, scopeType: MinistryScopeType, scopeId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const admin = createAdminClient();

  if (ctx.isPlatformAdmin || ctx.hasOperationalAccess) {
    return { ctx, admin };
  }

  if (scopeType !== "department") {
    redirect(`/my/${churchSlug}?tab=ministries`);
  }

  const member = await linkedMember(admin, ctx.churchId, ctx.userId);
  if (!member?.id) redirect(`/my/${churchSlug}?tab=ministries`);

  const { data: assignment, error } = await admin
    .from("member_departments")
    .select("id, role_title, is_active")
    .eq("church_id", ctx.churchId)
    .eq("department_id", scopeId)
    .eq("member_id", member.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!assignment?.is_active || !roleCanManage(assignment.role_title)) {
    redirect(`/my/${churchSlug}?tab=ministries`);
  }

  return { ctx, admin };
}

function revalidateScope(churchSlug: string, scopeType: MinistryScopeType, scopeId: string) {
  if (scopeType === "department") {
    revalidatePath(`/c/${churchSlug}/departments/${scopeId}/operations`);
  }
  revalidatePath(`/my/${churchSlug}`);
}

export async function createDutyTypeAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const scopeType = readString(formData, "scopeType") as MinistryScopeType;
    const scopeId = readString(formData, "scopeId");
    const name = readString(formData, "name");
    const description = optionalString(formData, "description");
    const requiresAttendanceSupport = formData.get("requiresAttendanceSupport") === "true";

    if (!name) throw new Error("Duty name is required.");

    const { ctx, admin } = await requireScopeManager(churchSlug, scopeType, scopeId);
    const { error } = await admin.from("ministry_duty_types").insert({
      church_id: ctx.churchId,
      scope_type: scopeType,
      scope_id: scopeId,
      name,
      description,
      system_key: requiresAttendanceSupport ? "attendance_support" : null,
      icon_key: requiresAttendanceSupport ? "users" : null,
      requires_attendance_support: requiresAttendanceSupport,
      created_by_user_id: ctx.userId,
    });

    if (error) throw new Error(error.message);
    revalidateScope(churchSlug, scopeType, scopeId);
    return initialSuccess("Duty type created.");
  } catch (error) {
    return failure(error);
  }
}

export async function createDutyAssignmentAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const scopeType = readString(formData, "scopeType") as MinistryScopeType;
    const scopeId = readString(formData, "scopeId");
    const dutyTypeId = readString(formData, "dutyTypeId");
    const memberId = readString(formData, "memberId");
    const serviceDate = readString(formData, "serviceDate");
    const startsAtRaw = optionalString(formData, "startsAt");
    const leaderNote = optionalString(formData, "leaderNote");

    if (!dutyTypeId || !memberId || !serviceDate) throw new Error("Duty, member, and date are required.");

    const { ctx, admin } = await requireScopeManager(churchSlug, scopeType, scopeId);
    const startsAt = startsAtRaw ? new Date(`${serviceDate}T${startsAtRaw}`).toISOString() : null;

    const { error } = await admin.from("ministry_duty_assignments").insert({
      church_id: ctx.churchId,
      scope_type: scopeType,
      scope_id: scopeId,
      duty_type_id: dutyTypeId,
      member_id: memberId,
      service_date: serviceDate,
      starts_at: startsAt,
      leader_note: leaderNote,
      created_by_user_id: ctx.userId,
    });

    if (error) throw new Error(error.message);
    revalidateScope(churchSlug, scopeType, scopeId);
    return initialSuccess("Duty assigned.");
  } catch (error) {
    return failure(error);
  }
}

export async function updateDutyStatusAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const scopeType = readString(formData, "scopeType") as MinistryScopeType;
    const scopeId = readString(formData, "scopeId");
    const assignmentId = readString(formData, "assignmentId");
    const status = readString(formData, "status");

    const { admin } = await requireScopeManager(churchSlug, scopeType, scopeId);
    const patch: Record<string, string> = { status, updated_at: new Date().toISOString() };
    if (status === "served") patch.served_at = new Date().toISOString();

    const { error } = await admin
      .from("ministry_duty_assignments")
      .update(patch)
      .eq("id", assignmentId)
      .eq("scope_type", scopeType)
      .eq("scope_id", scopeId);

    if (error) throw new Error(error.message);
    revalidateScope(churchSlug, scopeType, scopeId);
    return initialSuccess("Duty updated.");
  } catch (error) {
    return failure(error);
  }
}

export async function createMinistryTaskAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const scopeType = readString(formData, "scopeType") as MinistryScopeType;
    const scopeId = readString(formData, "scopeId");
    const title = readString(formData, "title");
    const assignedToMemberId = optionalString(formData, "assignedToMemberId");
    const dueDate = optionalString(formData, "dueDate");
    const description = optionalString(formData, "description");

    if (!title) throw new Error("Task title is required.");
    const { ctx, admin } = await requireScopeManager(churchSlug, scopeType, scopeId);

    const { error } = await admin.from("ministry_tasks").insert({
      church_id: ctx.churchId,
      scope_type: scopeType,
      scope_id: scopeId,
      title,
      description,
      assigned_to_member_id: assignedToMemberId,
      due_date: dueDate,
      created_by_user_id: ctx.userId,
    });

    if (error) throw new Error(error.message);
    revalidateScope(churchSlug, scopeType, scopeId);
    return initialSuccess("Task created.");
  } catch (error) {
    return failure(error);
  }
}

export async function submitMinistryReportAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const scopeType = readString(formData, "scopeType") as MinistryScopeType;
    const scopeId = readString(formData, "scopeId");
    const title = readString(formData, "title");
    const summary = optionalString(formData, "summary");

    if (!title) throw new Error("Report title is required.");
    const { ctx, admin } = await requireScopeManager(churchSlug, scopeType, scopeId);

    const { error } = await admin.from("ministry_reports").insert({
      church_id: ctx.churchId,
      scope_type: scopeType,
      scope_id: scopeId,
      title,
      summary,
      status: "submitted",
      submitted_by_user_id: ctx.userId,
      submitted_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
    revalidateScope(churchSlug, scopeType, scopeId);
    return initialSuccess("Report submitted.");
  } catch (error) {
    return failure(error);
  }
}

async function requireOwnDuty(churchSlug: string, assignmentId: string) {
  const ctx = await requireMemberPortalAccess(churchSlug);
  const admin = createAdminClient();
  const member = await linkedMember(admin, ctx.churchId, ctx.userId);
  if (!member?.id) redirect(`/my/${churchSlug}?tab=overview`);

  const { data: duty, error } = await admin
    .from("ministry_duty_assignments")
    .select("id, church_id, member_id, scope_type, scope_id, duty_type:ministry_duty_types(id, requires_attendance_support)")
    .eq("church_id", ctx.churchId)
    .eq("id", assignmentId)
    .eq("member_id", member.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!duty) redirect(`/my/${churchSlug}?tab=ministries`);
  return { ctx, admin, member, duty };
}

export async function confirmDutyAssignmentAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const assignmentId = readString(formData, "assignmentId");
    const { admin } = await requireOwnDuty(churchSlug, assignmentId);

    const { error } = await admin
      .from("ministry_duty_assignments")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (error) throw new Error(error.message);
    revalidatePath(`/my/${churchSlug}`);
    revalidatePath(`/my/${churchSlug}/duties/${assignmentId}`);
    return initialSuccess("Thank you. Your duty is confirmed.");
  } catch (error) {
    return failure(error);
  }
}

export async function requestDutyReplacementAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const assignmentId = readString(formData, "assignmentId");
    const reason = optionalString(formData, "reason");
    const { admin } = await requireOwnDuty(churchSlug, assignmentId);

    const { error } = await admin
      .from("ministry_duty_assignments")
      .update({ status: "replacement_requested", replacement_reason: reason, requested_replacement_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (error) throw new Error(error.message);
    revalidatePath(`/my/${churchSlug}`);
    revalidatePath(`/my/${churchSlug}/duties/${assignmentId}`);
    return initialSuccess("Replacement request sent to your leader.");
  } catch (error) {
    return failure(error);
  }
}

export async function addDutyNoteAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const assignmentId = readString(formData, "assignmentId");
    const note = optionalString(formData, "note");
    const { admin } = await requireOwnDuty(churchSlug, assignmentId);

    const { error } = await admin
      .from("ministry_duty_assignments")
      .update({ member_note: note, updated_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (error) throw new Error(error.message);
    revalidatePath(`/my/${churchSlug}/duties/${assignmentId}`);
    return initialSuccess("Note saved.");
  } catch (error) {
    return failure(error);
  }
}

export async function markAttendanceSupportPresentAction(_prev: MinistryActionState, formData: FormData): Promise<MinistryActionState> {
  try {
    const churchSlug = readString(formData, "churchSlug");
    const assignmentId = readString(formData, "assignmentId");
    const occurrenceId = readString(formData, "occurrenceId");
    const memberId = readString(formData, "memberId");

    if (!occurrenceId || !memberId) throw new Error("Attendance occurrence and member are required.");

    const { ctx, admin, member, duty } = await requireOwnDuty(churchSlug, assignmentId);
    const dutyType = Array.isArray(duty.duty_type) ? duty.duty_type[0] : duty.duty_type;
    if (!dutyType?.requires_attendance_support) {
      throw new Error("This duty does not allow attendance support.");
    }

    const { data: existing, error: existingError } = await admin
      .from("attendance_records")
      .select("id")
      .eq("church_id", ctx.churchId)
      .eq("occurrence_id", occurrenceId)
      .eq("member_id", memberId)
      .neq("status", "removed")
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (!existing) {
      const { error } = await admin.from("attendance_records").insert({
        church_id: ctx.churchId,
        occurrence_id: occurrenceId,
        member_id: memberId,
        status: "present",
        check_in_method: "kiosk",
        checked_in_by_user_id: ctx.userId,
        checked_in_by_member_id: member.id,
        notes: "Marked present by Attendance Support.",
      });
      if (error) throw new Error(error.message);
    }

    await admin.from("attendance_audit_logs").insert({
      church_id: ctx.churchId,
      actor_user_id: ctx.userId,
      actor_member_id: member.id,
      action: "attendance_support_mark_present",
      entity_type: "attendance_record",
      entity_id: existing?.id ?? null,
      metadata: { occurrenceId, memberId, assignmentId },
    });

    revalidatePath(`/my/${churchSlug}/duties/${assignmentId}/attendance-support`);
    revalidatePath(`/c/${churchSlug}/attendance`);
    return initialSuccess("Member marked present by Attendance Support.");
  } catch (error) {
    return failure(error);
  }
}