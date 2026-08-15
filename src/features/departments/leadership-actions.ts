"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBoolean, getString } from "@/lib/domain/validation";
import { normalizeSupabaseErrorMessage } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { getDepartmentLeadershipRole } from "./leadership-roles";
import { requireDepartmentManager } from "./queries";
import type { ActionState } from "./types";

const leadershipSchema = z
  .object({
    department_id: z.string().uuid("Valid department is required."),
    member_id: z.string().uuid("Valid member is required."),
    leadership_role_code: z.string().trim().min(1, "Leadership role is required."),
    start_date: z.string().trim().min(1, "Start date is required."),
    end_date: z.string().trim().optional().default(""),
    notes: z.string().trim().max(1000).optional().default(""),
    is_primary: z.boolean(),
    confirm_add_to_department: z.boolean(),
    replace_primary: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.end_date && value.end_date < value.start_date) {
      context.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "End date cannot be before the start date.",
      });
    }
  });

function revalidateLeadershipPaths(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/c/${churchSlug}/leadership`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/my/${churchSlug}`);
}

async function getScopedDepartmentAndMember(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  memberId: string;
}) {
  const { supabase, churchId, departmentId, memberId } = params;
  const [{ data: department, error: departmentError }, { data: member, error: memberError }] =
    await Promise.all([
      supabase
        .from("church_departments")
        .select("id, department_name")
        .eq("church_id", churchId)
        .eq("id", departmentId)
        .maybeSingle(),
      supabase
        .from("members")
        .select("id, membership_status")
        .eq("church_id", churchId)
        .eq("id", memberId)
        .maybeSingle(),
    ]);

  if (departmentError) throw new Error(departmentError.message);
  if (memberError) throw new Error(memberError.message);
  if (!department) throw new Error("Department not found in this church.");
  if (!member) throw new Error("Member not found in this church.");

  return { department, member };
}

async function ensureActiveDepartmentMembership(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  departmentName: string;
  memberId: string;
  startDate: string;
  confirmed: boolean;
}) {
  const {
    supabase,
    churchId,
    departmentId,
    departmentName,
    memberId,
    startDate,
    confirmed,
  } = params;
  const { data: activeMembership, error: activeError } = await supabase
    .from("member_departments")
    .select("id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("member_id", memberId)
    .eq("is_active", true)
    .maybeSingle();

  if (activeError) throw new Error(activeError.message);
  if (activeMembership) return;
  if (!confirmed) {
    throw new Error(
      "This person is not an active department member. Confirm adding them to the department before assigning leadership."
    );
  }

  const { data: inactiveMembership, error: inactiveError } = await supabase
    .from("member_departments")
    .select("id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("member_id", memberId)
    .eq("is_active", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inactiveError) throw new Error(inactiveError.message);

  if (inactiveMembership) {
    const { error } = await supabase
      .from("member_departments")
      .update({
        department_name: departmentName,
        role_title: null,
        role_in_department: null,
        start_date: startDate,
        joined_date: startDate,
        is_active: true,
      })
      .eq("church_id", churchId)
      .eq("id", inactiveMembership.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("member_departments").insert({
    church_id: churchId,
    department_id: departmentId,
    department_name: departmentName,
    member_id: memberId,
    role_title: null,
    role_in_department: null,
    start_date: startDate,
    joined_date: startDate,
    is_active: true,
  });
  if (error) throw new Error(error.message);
}

async function archiveReplacedPrimary(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  excludeAssignmentId?: string;
  replacePrimary: boolean;
}) {
  const { supabase, churchId, departmentId, excludeAssignmentId, replacePrimary } = params;
  let query = supabase
    .from("department_leadership_assignments")
    .select("id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("is_active", true)
    .eq("is_primary", true);

  if (excludeAssignmentId) query = query.neq("id", excludeAssignmentId);
  const { data: currentPrimary, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!currentPrimary) return null;
  if (!replacePrimary) {
    throw new Error(
      "This department already has a primary leader. Confirm replacement to continue."
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error: archiveError } = await supabase
    .from("department_leadership_assignments")
    .update({ is_active: false, is_primary: false, end_date: today })
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("id", currentPrimary.id);
  if (archiveError) throw new Error(archiveError.message);
  return currentPrimary.id as string;
}

async function restorePrimary(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  assignmentId: string | null;
}) {
  if (!params.assignmentId) return;
  await params.supabase
    .from("department_leadership_assignments")
    .update({ is_active: true, is_primary: true, end_date: null })
    .eq("church_id", params.churchId)
    .eq("department_id", params.departmentId)
    .eq("id", params.assignmentId);
}

function parseLeadershipForm(formData: FormData) {
  return leadershipSchema.safeParse({
    department_id: getString(formData, "department_id"),
    member_id: getString(formData, "member_id"),
    leadership_role_code: getString(formData, "leadership_role_code"),
    start_date: getString(formData, "start_date"),
    end_date: getString(formData, "end_date"),
    notes: getString(formData, "notes"),
    is_primary: getBoolean(formData, "is_primary"),
    confirm_add_to_department: getBoolean(formData, "confirm_add_to_department"),
    replace_primary: getBoolean(formData, "replace_primary"),
  });
}

export async function assignDepartmentLeaderAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const parsed = parseLeadershipForm(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid leadership data." };
    }

    const role = getDepartmentLeadershipRole(parsed.data.leadership_role_code);
    if (!role) return { ok: false, error: "Choose a supported leadership role." };
    if (parsed.data.is_primary && role.code !== "department_leader") {
      return { ok: false, error: "Only the Department Leader role can be primary." };
    }

    const ctx = await requireDepartmentManager(churchSlug);
    const supabase = await createClient();
    const { department } = await getScopedDepartmentAndMember({
      supabase,
      churchId: ctx.churchId,
      departmentId: parsed.data.department_id,
      memberId: parsed.data.member_id,
    });

    await ensureActiveDepartmentMembership({
      supabase,
      churchId: ctx.churchId,
      departmentId: parsed.data.department_id,
      departmentName: department.department_name,
      memberId: parsed.data.member_id,
      startDate: parsed.data.start_date,
      confirmed: parsed.data.confirm_add_to_department,
    });

    const { data: duplicate, error: duplicateError } = await supabase
      .from("department_leadership_assignments")
      .select("id")
      .eq("church_id", ctx.churchId)
      .eq("department_id", parsed.data.department_id)
      .eq("member_id", parsed.data.member_id)
      .eq("leadership_role_name", role.name)
      .eq("is_active", true)
      .maybeSingle();
    if (duplicateError) throw new Error(duplicateError.message);
    if (duplicate) return { ok: false, error: "This member already holds that active leadership role." };

    const replacedPrimaryId = parsed.data.is_primary
      ? await archiveReplacedPrimary({
          supabase,
          churchId: ctx.churchId,
          departmentId: parsed.data.department_id,
          replacePrimary: parsed.data.replace_primary,
        })
      : null;

    const { error } = await supabase.from("department_leadership_assignments").insert({
      church_id: ctx.churchId,
      department_id: parsed.data.department_id,
      member_id: parsed.data.member_id,
      leadership_role_code: role.code,
      leadership_role_name: role.name,
      is_primary: parsed.data.is_primary,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date || null,
      is_active: true,
      assigned_by_user_id: ctx.profile.id,
      notes: parsed.data.notes || null,
    });

    if (error) {
      await restorePrimary({
        supabase,
        churchId: ctx.churchId,
        departmentId: parsed.data.department_id,
        assignmentId: replacedPrimaryId,
      });
      return { ok: false, error: normalizeSupabaseErrorMessage(error, "Failed to assign leader.") };
    }

    revalidateLeadershipPaths(churchSlug);
    return { ok: true, message: "Department leader assigned successfully." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to assign leader." };
  }
}

export async function updateDepartmentLeaderAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const leadershipAssignmentId = getString(formData, "leadershipAssignmentId");
    if (!leadershipAssignmentId) return { ok: false, error: "Leadership assignment is required." };

    const parsed = parseLeadershipForm(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid leadership data." };
    }
    const role = getDepartmentLeadershipRole(parsed.data.leadership_role_code);
    if (!role) return { ok: false, error: "Choose a supported leadership role." };
    if (parsed.data.is_primary && role.code !== "department_leader") {
      return { ok: false, error: "Only the Department Leader role can be primary." };
    }

    const ctx = await requireDepartmentManager(churchSlug);
    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("department_leadership_assignments")
      .select("id, member_id")
      .eq("church_id", ctx.churchId)
      .eq("department_id", parsed.data.department_id)
      .eq("id", leadershipAssignmentId)
      .eq("is_active", true)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing || existing.member_id !== parsed.data.member_id) {
      return { ok: false, error: "Active leadership assignment not found in this church." };
    }

    const { department } = await getScopedDepartmentAndMember({
      supabase,
      churchId: ctx.churchId,
      departmentId: parsed.data.department_id,
      memberId: parsed.data.member_id,
    });
    await ensureActiveDepartmentMembership({
      supabase,
      churchId: ctx.churchId,
      departmentId: parsed.data.department_id,
      departmentName: department.department_name,
      memberId: parsed.data.member_id,
      startDate: parsed.data.start_date,
      confirmed: parsed.data.confirm_add_to_department,
    });

    const { data: duplicate, error: duplicateError } = await supabase
      .from("department_leadership_assignments")
      .select("id")
      .eq("church_id", ctx.churchId)
      .eq("department_id", parsed.data.department_id)
      .eq("member_id", parsed.data.member_id)
      .eq("leadership_role_name", role.name)
      .eq("is_active", true)
      .neq("id", leadershipAssignmentId)
      .maybeSingle();
    if (duplicateError) throw new Error(duplicateError.message);
    if (duplicate) return { ok: false, error: "This member already holds that active leadership role." };

    const replacedPrimaryId = parsed.data.is_primary
      ? await archiveReplacedPrimary({
          supabase,
          churchId: ctx.churchId,
          departmentId: parsed.data.department_id,
          excludeAssignmentId: leadershipAssignmentId,
          replacePrimary: parsed.data.replace_primary,
        })
      : null;

    const { error } = await supabase
      .from("department_leadership_assignments")
      .update({
        leadership_role_code: role.code,
        leadership_role_name: role.name,
        is_primary: parsed.data.is_primary,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date || null,
        notes: parsed.data.notes || null,
      })
      .eq("church_id", ctx.churchId)
      .eq("department_id", parsed.data.department_id)
      .eq("id", leadershipAssignmentId);

    if (error) {
      await restorePrimary({
        supabase,
        churchId: ctx.churchId,
        departmentId: parsed.data.department_id,
        assignmentId: replacedPrimaryId,
      });
      return { ok: false, error: normalizeSupabaseErrorMessage(error, "Failed to update leader.") };
    }

    revalidateLeadershipPaths(churchSlug);
    return { ok: true, message: "Leadership assignment updated successfully." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update leader." };
  }
}

export async function removeDepartmentLeaderAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const departmentId = getString(formData, "departmentId");
    const leadershipAssignmentId = getString(formData, "leadershipAssignmentId");
    if (!departmentId || !leadershipAssignmentId) {
      return { ok: false, error: "Leadership assignment and department are required." };
    }

    const ctx = await requireDepartmentManager(churchSlug);
    const supabase = await createClient();
    const { data: assignment, error: lookupError } = await supabase
      .from("department_leadership_assignments")
      .select("id")
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId)
      .eq("id", leadershipAssignmentId)
      .eq("is_active", true)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (!assignment) return { ok: false, error: "Active leadership assignment not found." };

    const { error } = await supabase
      .from("department_leadership_assignments")
      .update({
        is_active: false,
        is_primary: false,
        end_date: new Date().toISOString().slice(0, 10),
      })
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId)
      .eq("id", leadershipAssignmentId);
    if (error) return { ok: false, error: normalizeSupabaseErrorMessage(error, "Failed to remove leader.") };

    revalidateLeadershipPaths(churchSlug);
    return { ok: true, message: "Leadership assignment archived successfully." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to remove leader." };
  }
}
