"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getBoolean, getString } from "@/lib/domain/validation";
import { normalizeSupabaseErrorMessage } from "@/lib/supabase/errors";
import { requireDepartmentManager } from "./queries";
import { requireDepartmentAccess } from "./access";
import { ensureDepartmentFinanceSetup } from "./finance-setup";
import type { ActionState } from "./types";

const departmentSchema = z.object({
  department_name: z.string().trim().min(1, "Department name is required.").max(120),
  code: z.string().trim().max(50).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  is_active: z.boolean(),
});

const assignmentSchema = z.object({
  member_id: z.string().uuid("Valid member is required."),
  department_id: z.string().uuid("Valid department is required."),
  role_title: z.string().trim().max(120).optional().default(""),
  start_date: z.string().trim().optional().default(""),
  is_active: z.boolean(),
});

function normalizeDepartmentLookup(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

async function findDepartmentIdentityConflict(params: {
  supabase: any;
  churchId: string;
  departmentName: string;
  code: string | null;
  excludeDepartmentId?: string;
}) {
  const { supabase, churchId, departmentName, code, excludeDepartmentId } = params;
  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code")
    .eq("church_id", churchId);

  if (error) throw new Error(error.message);

  const normalizedName = normalizeDepartmentLookup(departmentName);
  const normalizedCode = normalizeDepartmentLookup(code);

  return (data ?? []).find((department: any) => {
    if (excludeDepartmentId && department.id === excludeDepartmentId) return false;
    const sameName = normalizeDepartmentLookup(department.department_name) === normalizedName;
    const sameCode = normalizedCode && normalizeDepartmentLookup(department.code) === normalizedCode;
    return sameName || sameCode;
  }) ?? null;
}

function revalidateDepartmentPaths(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/c/${churchSlug}/members`);
}

function revalidateMemberDepartmentPaths(churchSlug: string, memberId?: string | null) {
  revalidateDepartmentPaths(churchSlug);
  if (memberId) {
    revalidatePath(`/c/${churchSlug}/members/${memberId}`);
  }
}

async function ensureDepartmentBelongsToChurch(supabase: any, churchId: string, departmentId: string) {
  const { data, error } = await supabase
    .from("church_departments")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function ensureMemberBelongsToChurch(supabase: any, churchId: string, memberId: string) {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function createDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireDepartmentManager(churchSlug);
  const supabase = await createClient();

  const parsed = departmentSchema.safeParse({
    department_name: getString(formData, "department_name"),
    code: getString(formData, "code"),
    description: getString(formData, "description"),
    is_active: getBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid department data." };
  }

  const { department_name, code, description, is_active } = parsed.data;

  const identityConflict = await findDepartmentIdentityConflict({
    supabase,
    churchId: ctx.churchId,
    departmentName: department_name,
    code: code || null,
  });

  if (identityConflict) {
    const exactMatch =
      normalizeDepartmentLookup(identityConflict.department_name) ===
        normalizeDepartmentLookup(department_name) &&
      normalizeDepartmentLookup(identityConflict.code) === normalizeDepartmentLookup(code);

    return exactMatch
      ? { ok: true, message: "Department already exists; no duplicate was created." }
      : {
          ok: false,
          error: "A department with the same name or code already exists in this church.",
        };
  }

  const { data: insertedDepartment, error } = await supabase
    .from("church_departments")
    .insert({
      church_id: ctx.churchId,
      department_name,
      code: code || null,
      description: description || null,
      is_active,
    })
    .select("id, department_name, code, is_active")
    .single();

  if (error || !insertedDepartment) {
    const message = error?.message?.toLowerCase?.() || "";
    if (message.includes("row-level security") || message.includes("policy")) {
      return { 
        ok: false, 
        error: "Department creation blocked by security policy. Ensure you have admin or clerk role." 
      };
    }
    return {
      ok: false,
      error: normalizeSupabaseErrorMessage(error, "Failed to create department."),
    };
  }

  const financeSetupResult = await ensureDepartmentFinanceSetup({
    supabase,
    churchId: ctx.churchId,
    department: {
      id: insertedDepartment.id,
      department_name: insertedDepartment.department_name,
      code: insertedDepartment.code,
      is_active: insertedDepartment.is_active,
    },
  });

  if (!financeSetupResult.ok) {
    const normalizedSetupError = String(financeSetupResult.error || "").toLowerCase();
    const softSetupFailure =
      normalizedSetupError.includes("row-level security") ||
      normalizedSetupError.includes("policy") ||
      normalizedSetupError.includes("permission") ||
      normalizedSetupError.includes("does not exist") ||
      normalizedSetupError.includes("could not find");

    if (softSetupFailure) {
      revalidateDepartmentPaths(churchSlug);
      return {
        ok: true,
        message:
          "Department created. Finance setup will complete automatically once department finance migrations are applied.",
      };
    }

    const { error: rollbackError } = await supabase
      .from("church_departments")
      .delete()
      .eq("church_id", ctx.churchId)
      .eq("id", insertedDepartment.id);

    if (rollbackError) {
      return {
        ok: false,
        error: `${financeSetupResult.error} Department was created, but rollback failed. Please delete the department manually and retry.`,
      };
    }

    return {
      ok: false,
      error: `${financeSetupResult.error} Department creation was rolled back to keep finance setup consistent.`,
    };
  }

  revalidateDepartmentPaths(churchSlug);
  return { ok: true, message: "Department created successfully." };
}

export async function updateDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "departmentId");
  const ctx = await requireDepartmentManager(churchSlug);
  const supabase = await createClient();

  if (!departmentId) return { ok: false, error: "Department ID is required." };

  const parsed = departmentSchema.safeParse({
    department_name: getString(formData, "department_name"),
    code: getString(formData, "code"),
    description: getString(formData, "description"),
    is_active: getBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid department data." };
  }

  const { data: currentDepartment, error: currentDepartmentError } = await supabase
    .from("church_departments")
    .select("id, department_name, code, description, is_active")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();
  if (currentDepartmentError) return { ok: false, error: currentDepartmentError.message };
  if (!currentDepartment) return { ok: false, error: "Department not found in this church." };

  const { department_name, code, description, is_active } = parsed.data;

  const identityConflict = await findDepartmentIdentityConflict({
    supabase,
    churchId: ctx.churchId,
    departmentName: department_name,
    code: code || null,
    excludeDepartmentId: departmentId,
  });

  if (identityConflict) {
    return {
      ok: false,
      error: "A different department with the same name or code already exists in this church.",
    };
  }

  const updatePayload: Record<string, string | boolean | null> = {};
  if (currentDepartment.department_name !== department_name) {
    updatePayload.department_name = department_name;
  }
  if ((currentDepartment.code ?? null) !== (code || null)) {
    updatePayload.code = code || null;
  }
  if ((currentDepartment.description ?? null) !== (description || null)) {
    updatePayload.description = description || null;
  }
  if (currentDepartment.is_active !== is_active) {
    updatePayload.is_active = is_active;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { ok: true, message: "Department details are already up to date." };
  }

  const { error } = await supabase
    .from("church_departments")
    .update(updatePayload)
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId);

  if (error) {
    const message = error.message?.toLowerCase?.() || "";
    if (message.includes("row-level security") || message.includes("policy")) {
      return { 
        ok: false, 
        error: "Department update blocked by security policy. Ensure you have admin or clerk role." 
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateDepartmentPaths(churchSlug);
  return { ok: true, message: "Department updated successfully." };
}

export async function assignMemberToDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");

  const parsed = assignmentSchema.safeParse({
    member_id: getString(formData, "member_id"),
    department_id: getString(formData, "department_id"),
    role_title: getString(formData, "role_title"),
    start_date: getString(formData, "start_date"),
    is_active: getBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid assignment data." };
  }

  const { member_id, department_id, role_title, start_date, is_active } = parsed.data;
  const access = await requireDepartmentAccess(churchSlug, department_id, "manage_members");
  const { ctx, supabase } = access;

  const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, member_id);
  if (!validMember) return { ok: false, error: "Member does not belong to this church." };

  const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, department_id);
  if (!validDepartment) return { ok: false, error: "Department does not belong to this church." };

  const { data: departmentRow, error: deptFetchError } = await supabase
    .from("church_departments")
    .select("department_name")
    .eq("church_id", ctx.churchId)
    .eq("id", department_id)
    .maybeSingle();

  if (deptFetchError) return { ok: false, error: deptFetchError.message };
  if (!departmentRow) return { ok: false, error: "Department not found." };

  const { data: existingActive, error: existingActiveError } = await supabase
    .from("member_departments")
    .select("id")
    .eq("church_id", ctx.churchId)
    .eq("member_id", member_id)
    .eq("department_id", department_id)
    .eq("is_active", true)
    .maybeSingle();

  if (existingActiveError) return { ok: false, error: existingActiveError.message };
  if (existingActive) {
    return { ok: false, error: "This member is already actively assigned to this department." };
  }

  const { data: existingInactive, error: existingInactiveError } = await supabase
    .from("member_departments")
    .select("id")
    .eq("church_id", ctx.churchId)
    .eq("member_id", member_id)
    .eq("department_id", department_id)
    .eq("is_active", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingInactiveError) return { ok: false, error: existingInactiveError.message };

  if (existingInactive) {
    const { error: reactivateError } = await supabase
      .from("member_departments")
      .update({
        department_name: departmentRow.department_name,
        role_title: role_title || null,
        role_in_department: role_title || null,
        start_date: start_date || null,
        joined_date: start_date || null,
        is_active,
      })
      .eq("church_id", ctx.churchId)
      .eq("id", existingInactive.id);

    if (reactivateError) return { ok: false, error: reactivateError.message };

    revalidateMemberDepartmentPaths(churchSlug, member_id);
    return { ok: true, message: "Inactive assignment reactivated successfully." };
  }

  const { error } = await supabase.from("member_departments").insert({
    church_id: ctx.churchId,
    member_id,
    department_id,
    department_name: departmentRow.department_name,
    role_title: role_title || null,
    role_in_department: role_title || null,
    start_date: start_date || null,
    joined_date: start_date || null,
    is_active,
  });

  if (error) return { ok: false, error: error.message };

  revalidateMemberDepartmentPaths(churchSlug, member_id);
  return { ok: true, message: "Member assigned successfully." };
}

export async function assignMembersToDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const departmentId = getString(formData, "department_id");
  const roleTitle = getString(formData, "role_title");
  const startDate = getString(formData, "start_date");
  const isActive = getBoolean(formData, "is_active");
  const memberIds = Array.from(
    new Set(
      formData
        .getAll("member_ids")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

  const parsed = z.object({
    departmentId: z.string().uuid("Valid department is required."),
    memberIds: z.array(z.string().uuid("Every selected member must be valid.")).min(1, "Select at least one member.").max(50),
    roleTitle: z.string().max(120),
    startDate: z.string().optional(),
  }).safeParse({ departmentId, memberIds, roleTitle, startDate });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid member assignments." };
  }

  const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_members");
  const { ctx, supabase } = access;
  const [{ data: department, error: departmentError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase
        .from("church_departments")
        .select("id, department_name")
        .eq("church_id", ctx.churchId)
        .eq("id", departmentId)
        .maybeSingle(),
      supabase
        .from("members")
        .select("id")
        .eq("church_id", ctx.churchId)
        .in("id", memberIds),
    ]);

  if (departmentError) return { ok: false, error: departmentError.message };
  if (membersError) return { ok: false, error: membersError.message };
  if (!department) return { ok: false, error: "Department does not belong to this church." };
  if ((members ?? []).length !== memberIds.length) {
    return { ok: false, error: "One or more selected members do not belong to this church." };
  }

  const { data: existingAssignments, error: existingError } = await supabase
    .from("member_departments")
    .select("id, member_id, is_active, updated_at")
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .in("member_id", memberIds)
    .order("updated_at", { ascending: false });

  if (existingError) return { ok: false, error: existingError.message };
  const activeDuplicates = (existingAssignments ?? []).filter((row: any) => row.is_active);
  if (activeDuplicates.length > 0) {
    return {
      ok: false,
      error: `${activeDuplicates.length} selected member${activeDuplicates.length === 1 ? " is" : "s are"} already active in this department. No assignments were changed.`,
    };
  }

  const latestInactiveByMemberId = new Map<string, string>();
  for (const row of existingAssignments ?? []) {
    if (!row.is_active && !latestInactiveByMemberId.has(row.member_id)) {
      latestInactiveByMemberId.set(row.member_id, row.id);
    }
  }

  const memberIdsToInsert = memberIds.filter((memberId) => !latestInactiveByMemberId.has(memberId));
  if (memberIdsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("member_departments").insert(
      memberIdsToInsert.map((memberId) => ({
        church_id: ctx.churchId,
        member_id: memberId,
        department_id: departmentId,
        department_name: department.department_name,
        role_title: roleTitle || null,
        role_in_department: roleTitle || null,
        start_date: startDate || null,
        joined_date: startDate || null,
        is_active: isActive,
      }))
    );
    if (insertError) return { ok: false, error: insertError.message };
  }

  const reactivationResults = await Promise.all(
    Array.from(latestInactiveByMemberId.entries()).map(([, assignmentId]) =>
      supabase
        .from("member_departments")
        .update({
          department_name: department.department_name,
          role_title: roleTitle || null,
          role_in_department: roleTitle || null,
          start_date: startDate || null,
          joined_date: startDate || null,
          is_active: isActive,
        })
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .eq("id", assignmentId)
    )
  );
  const reactivationError = reactivationResults.find((result) => result.error)?.error;
  if (reactivationError) {
    return { ok: false, error: `Some assignments were added, but reactivation failed: ${reactivationError.message}` };
  }

  revalidateDepartmentPaths(churchSlug);
  memberIds.forEach((memberId) => revalidatePath(`/c/${churchSlug}/members/${memberId}`));
  return {
    ok: true,
    message: `${memberIds.length} member${memberIds.length === 1 ? "" : "s"} added to the department.`,
  };
}

export async function updateAssignmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const assignmentId = getString(formData, "assignmentId");

  if (!assignmentId) return { ok: false, error: "Assignment ID is required." };

  const parsed = assignmentSchema.safeParse({
    member_id: getString(formData, "member_id"),
    department_id: getString(formData, "department_id"),
    role_title: getString(formData, "role_title"),
    start_date: getString(formData, "start_date"),
    is_active: getBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid assignment data." };
  }

  const { member_id, department_id, role_title, start_date, is_active } = parsed.data;
  const access = await requireDepartmentAccess(churchSlug, department_id, "manage_members");
  const { ctx, supabase } = access;

  const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, member_id);
  if (!validMember) return { ok: false, error: "Member does not belong to this church." };

  const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, department_id);
  if (!validDepartment) return { ok: false, error: "Department does not belong to this church." };

  const { data: departmentRow, error: deptFetchError } = await supabase
    .from("church_departments")
    .select("department_name")
    .eq("church_id", ctx.churchId)
    .eq("id", department_id)
    .maybeSingle();

  if (deptFetchError) return { ok: false, error: deptFetchError.message };
  if (!departmentRow) return { ok: false, error: "Department not found." };

  if (is_active) {
    const { data: conflictingActive, error: conflictingError } = await supabase
      .from("member_departments")
      .select("id")
      .eq("church_id", ctx.churchId)
      .eq("member_id", member_id)
      .eq("department_id", department_id)
      .eq("is_active", true)
      .neq("id", assignmentId)
      .maybeSingle();

    if (conflictingError) return { ok: false, error: conflictingError.message };
    if (conflictingActive) {
      return { ok: false, error: "Another active assignment already exists for this member in this department." };
    }
  }

  const { error } = await supabase
    .from("member_departments")
    .update({
      church_id: ctx.churchId,
      member_id,
      department_id,
      department_name: departmentRow.department_name,
      role_title: role_title || null,
      role_in_department: role_title || null,
      start_date: start_date || null,
      joined_date: start_date || null,
      is_active,
    })
    .eq("church_id", ctx.churchId)
    .eq("id", assignmentId);

  if (error) return { ok: false, error: error.message };

  revalidateMemberDepartmentPaths(churchSlug, member_id);
  return { ok: true, message: is_active ? "Assignment updated successfully." : "Assignment archived successfully." };
}

export async function removeAssignmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const assignmentId = getString(formData, "assignmentId");
  const departmentId = getString(formData, "departmentId");

  if (!assignmentId || !departmentId) {
    return { ok: false, error: "Assignment and department are required." };
  }

  const access = await requireDepartmentAccess(churchSlug, departmentId, "manage_members");
  const { ctx, supabase } = access;

  const { data: assignment, error: assignmentLookupError } = await supabase
    .from("member_departments")
    .select("member_id, department_id")
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentLookupError) return { ok: false, error: assignmentLookupError.message };
  if (!assignment) return { ok: false, error: "Assignment not found in this department." };

  const { data: activeLeadership, error: leadershipLookupError } = await supabase
    .from("department_leadership_assignments")
    .select("id")
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("member_id", assignment.member_id)
    .eq("is_active", true)
    .limit(1);

  if (leadershipLookupError) return { ok: false, error: leadershipLookupError.message };
  if ((activeLeadership ?? []).length > 0) {
    return {
      ok: false,
      error: "Remove this person's active department leadership assignments before archiving their membership.",
    };
  }

  const { error } = await supabase
    .from("member_departments")
    .update({
      is_active: false,
    })
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .eq("id", assignmentId);

  if (error) return { ok: false, error: error.message };

  revalidateMemberDepartmentPaths(churchSlug, assignment?.member_id ?? null);
  return { ok: true, message: "Assignment removed successfully." };
}
