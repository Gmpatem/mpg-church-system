"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { normalizeDateOnly } from "@/lib/domain/date-only";
import { getString } from "@/lib/domain/validation";
import { parseUpdateMemberInput } from "./validators";
import { createMemberRecord } from "./services/create-member-record";

function buildMemberCode(churchSlug: string) {
  const prefix = churchSlug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "CHURCH";
  const suffix = Date.now().toString().slice(-6);
  return prefix + "-" + suffix;
}

type CreateMemberState =
  | { ok: true; message?: string; memberId: string; error?: undefined }
  | { ok: false; error: string; message?: undefined; memberId?: undefined };

async function ensureUniqueMemberCode(supabase: any, memberCode: string, excludeMemberId?: string) {
  let query = supabase.from("members").select("id").eq("member_code", memberCode).limit(1);

  if (excludeMemberId) {
    query = query.neq("id", excludeMemberId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return !(data && data.length > 0);
}

async function ensureHouseholdBelongsToChurch(supabase: any, churchId: string, householdId: string | null) {
  if (!householdId) return true;

  const { data, error } = await supabase
    .from("households")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", householdId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function ensureDepartmentBelongsToChurch(supabase: any, churchId: string, departmentId: string | null) {
  if (!departmentId) return null;

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createMemberAction(
  _prevState: CreateMemberState | null,
  formData: FormData
): Promise<CreateMemberState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);

  const supabase = await createClient();

  try {
    const result = await createMemberRecord(supabase, {
      churchId: ctx.churchId,
      churchSlug: ctx.churchSlug,
      actorUserId: ctx.userId,
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      displayName: getString(formData, "displayName"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      gender: getString(formData, "gender"),
      membershipStatus: getString(formData, "membershipStatus") || "active",
      membershipType: getString(formData, "membershipType"),
      memberCode: getString(formData, "memberCode"),
      householdId: getString(formData, "householdId"),
      householdRole: getString(formData, "householdRole"),
      dateJoined: getString(formData, "dateJoined"),
      dateOfBirth: getString(formData, "dateOfBirth"),
      baptismDate: getString(formData, "baptismDate"),
      transferInDate: getString(formData, "transferInDate"),
      transferOutDate: getString(formData, "transferOutDate"),
      previousChurch: getString(formData, "previousChurch"),
      city: getString(formData, "city"),
      country: getString(formData, "country"),
      address: getString(formData, "address"),
      profession: getString(formData, "profession"),
      maritalStatus: getString(formData, "maritalStatus"),
      emergencyContactName: getString(formData, "emergencyContactName"),
      emergencyContactPhone: getString(formData, "emergencyContactPhone"),
      notes: getString(formData, "notes"),
      departmentId: getString(formData, "departmentId"),
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    revalidatePath(`/c/${churchSlug}/members`);
    revalidatePath(`/c/${churchSlug}/dashboard`);
    revalidatePath(`/c/${churchSlug}/reports`);
    revalidatePath(`/c/${churchSlug}/households`);

    return { ok: true, message: "Member created successfully.", memberId: result.memberId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create member.",
    };
  }
}

export async function updateMemberAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  try {
    const parsed = parseUpdateMemberInput({
      memberId: getString(formData, "memberId"),
      churchId: ctx.churchId,
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      displayName: getString(formData, "displayName"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      gender: getString(formData, "gender"),
      membershipStatus: getString(formData, "membershipStatus") || "active",
      membershipType: getString(formData, "membershipType"),
      memberCode: getString(formData, "memberCode"),
      householdId: getString(formData, "householdId"),
      householdRole: getString(formData, "householdRole"),
      dateJoined: getString(formData, "dateJoined"),
      dateOfBirth: getString(formData, "dateOfBirth"),
      baptismDate: getString(formData, "baptismDate"),
      transferInDate: getString(formData, "transferInDate"),
      transferOutDate: getString(formData, "transferOutDate"),
      previousChurch: getString(formData, "previousChurch"),
      city: getString(formData, "city"),
      country: getString(formData, "country"),
      address: getString(formData, "address"),
      profession: getString(formData, "profession"),
      maritalStatus: getString(formData, "maritalStatus"),
      emergencyContactName: getString(formData, "emergencyContactName"),
      emergencyContactPhone: getString(formData, "emergencyContactPhone"),
      notes: getString(formData, "notes"),
      departmentId: getString(formData, "departmentId"),
    });

    const memberCode = parsed.memberCode || buildMemberCode(ctx.churchSlug);

    const unique = await ensureUniqueMemberCode(supabase, memberCode, parsed.memberId);
    if (!unique) {
      return { ok: false, error: "Member code is already in use." };
    }

    const validHousehold = await ensureHouseholdBelongsToChurch(supabase, ctx.churchId, parsed.householdId ?? null);
    if (!validHousehold) {
      return { ok: false, error: "Selected household does not belong to this church." };
    }

    const { error } = await supabase
      .from("members")
      .update({
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        display_name: parsed.displayName || [parsed.firstName, parsed.lastName].filter(Boolean).join(" "),
        email: parsed.email,
        phone: parsed.phone,
        gender: parsed.gender,
        membership_status: parsed.membershipStatus,
        membership_type: parsed.membershipType,
        member_code: memberCode,
        household_id: parsed.householdId,
        household_role: parsed.householdRole,
        date_joined: parsed.dateJoined,
        date_of_birth: parsed.dateOfBirth,
        baptism_date: parsed.baptismDate,
        transfer_in_date: parsed.transferInDate,
        transfer_out_date: parsed.transferOutDate,
        previous_church: parsed.previousChurch,
        city: parsed.city,
        country: parsed.country,
        address: parsed.address,
        profession: parsed.profession,
        marital_status: parsed.maritalStatus,
        emergency_contact_name: parsed.emergencyContactName,
        emergency_contact_phone: parsed.emergencyContactPhone,
        notes: parsed.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("id", parsed.memberId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(`/c/${churchSlug}/members`);
    revalidatePath(`/c/${churchSlug}/members/${parsed.memberId}`);
    revalidatePath(`/c/${churchSlug}/dashboard`);
    revalidatePath(`/c/${churchSlug}/reports`);
    revalidatePath(`/c/${churchSlug}/households`);

    return { ok: true, message: "Member updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update member.",
    };
  }
}

export async function updateMemberStatusAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const memberId = getString(formData, "memberId");
  const newStatus = getString(formData, "newStatus");
  const reason = getString(formData, "reason");

  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!memberId) {
    return { ok: false, error: "Member ID is required." };
  }

  if (!newStatus) {
    return { ok: false, error: "New status is required." };
  }

  if (!reason) {
    return { ok: false, error: "Reason is required for a status change." };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, membership_status")
    .eq("church_id", ctx.churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  if (!member) {
    return { ok: false, error: "Member not found." };
  }

  const oldStatus = member.membership_status;

  if (oldStatus === newStatus) {
    return { ok: false, error: "Member already has that status." };
  }

  const { error: updateError } = await supabase
    .from("members")
    .update({
      membership_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", memberId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const { error: historyError } = await supabase.from("member_status_history").insert({
    church_id: ctx.churchId,
    member_id: memberId,
    old_status: oldStatus,
    new_status: newStatus,
    reason: reason,
    changed_by_user_id: ctx.userId,
  });

  if (historyError) {
    return { ok: false, error: historyError.message };
  }

  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/members/${memberId}`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/c/${churchSlug}/reports`);

  return { ok: true, message: "Member status updated successfully." };
}

export async function processMemberTransferAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const memberId = getString(formData, "memberId");
  const transferType = getString(formData, "transferType");
  const rawTransferDate = getString(formData, "transferDate");
  const previousChurch = getString(formData, "previousChurch");
  const reason = getString(formData, "reason");

  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!memberId) {
    return { ok: false, error: "Member ID is required." };
  }

  if (transferType !== "in" && transferType !== "out") {
    return { ok: false, error: "Transfer type must be in or out." };
  }

  if (!rawTransferDate) {
    return { ok: false, error: "Transfer date is required." };
  }

  let transferDate: string;
  try {
    transferDate = normalizeDateOnly(rawTransferDate, "Transfer date") ?? "";
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Transfer date must be valid.",
    };
  }

  if (!reason) {
    return { ok: false, error: "Reason is required for transfer processing." };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, membership_status, previous_church")
    .eq("church_id", ctx.churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  if (!member) {
    return { ok: false, error: "Member not found." };
  }

  let updatePayload: any = {
    updated_at: new Date().toISOString(),
  };

  let nextStatus = member.membership_status;

  if (transferType === "in") {
    updatePayload.transfer_in_date = transferDate;
    updatePayload.previous_church = previousChurch || null;
    updatePayload.membership_status = "active";
    nextStatus = "active";
  } else {
    updatePayload.transfer_out_date = transferDate;
    if (previousChurch) {
      updatePayload.previous_church = previousChurch;
    }
    updatePayload.membership_status = "transferred";
    nextStatus = "transferred";
  }

  const { error: updateError } = await supabase
    .from("members")
    .update(updatePayload)
    .eq("church_id", ctx.churchId)
    .eq("id", memberId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (member.membership_status !== nextStatus) {
    const { error: historyError } = await supabase.from("member_status_history").insert({
      church_id: ctx.churchId,
      member_id: memberId,
      old_status: member.membership_status,
      new_status: nextStatus,
      reason: `${transferType === "in" ? "Transfer in" : "Transfer out"}: ${reason}`,
      changed_by_user_id: ctx.userId,
    });

    if (historyError) {
      return { ok: false, error: historyError.message };
    }
  }

  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/members/${memberId}`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/c/${churchSlug}/reports`);

  return { ok: true, message: transferType === "in" ? "Transfer in processed." : "Transfer out processed." };
}

export async function assignMemberDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const memberId = getString(formData, "memberId");
  const departmentId = getString(formData, "departmentId");
  const roleInDepartment = getString(formData, "roleInDepartment");
  const joinedDate = getString(formData, "joinedDate");

  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!memberId || !departmentId) {
    return { ok: false, error: "Member and department are required." };
  }

  // Resolve department name server-side from church_departments
  const { data: departmentRow, error: deptFetchError } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (deptFetchError) {
    return { ok: false, error: deptFetchError.message };
  }
  if (!departmentRow) {
    return { ok: false, error: "Department not found in this church." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("member_departments")
    .select("id")
    .eq("member_id", memberId)
    .eq("department_id", departmentId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }

  if (existing) {
    return { ok: false, error: "Member is already assigned to that department." };
  }

  const { error } = await supabase.from("member_departments").insert({
    church_id: ctx.churchId,
    member_id: memberId,
    department_id: departmentRow.id,
    department_name: departmentRow.department_name,
    role_in_department: roleInDepartment || null,
    joined_date: joinedDate || null,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/members/${memberId}`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/reports`);

  return { ok: true, message: "Department assignment added." };
}

export async function removeMemberDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const memberId = getString(formData, "memberId");
  const assignmentId = getString(formData, "assignmentId");

  await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!assignmentId) {
    return { ok: false, error: "Assignment ID is required." };
  }

  const { error } = await supabase
    .from("member_departments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/members/${memberId}`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/reports`);

  return { ok: true, message: "Department assignment removed." };
}

export async function reassignMemberHouseholdAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const memberId = getString(formData, "memberId");
  const householdId = getString(formData, "householdId") || null;

  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!memberId) {
    return { ok: false, error: "Member ID is required." };
  }

  const validHousehold = await ensureHouseholdBelongsToChurch(supabase, ctx.churchId, householdId);
  if (!validHousehold) {
    return { ok: false, error: "Selected household does not belong to this church." };
  }

  const { error } = await supabase
    .from("members")
    .update({
      household_id: householdId,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", memberId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/members/${memberId}`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/reports`);

  return { ok: true, message: householdId ? "Household updated." : "Household removed." };
}
