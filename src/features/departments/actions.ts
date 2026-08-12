"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getBoolean, getString } from "@/lib/domain/validation";
import { normalizeSupabaseErrorMessage } from "@/lib/supabase/errors";
import { requireDepartmentManager } from "./queries";
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

function isMissingColumnError(error: any, column: string) {
  const code = String(error?.code || "").toLowerCase();
  const combined = [error?.message, error?.details, error?.hint]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .join(" ");

  if (!combined.includes(column.toLowerCase())) return false;
  return (
    code === "42703" ||
    combined.includes("does not exist") ||
    combined.includes("could not find the")
  );
}

function isDuplicateKeyError(error: any) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code === "23505" || message.includes("duplicate key");
}

function normalizeFundCodeSegment(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return cleaned || "DEPARTMENT";
}

function buildDepartmentFundCode(args: {
  departmentId: string;
  departmentCode?: string | null;
  departmentName: string;
}) {
  const { departmentId, departmentCode, departmentName } = args;
  const base = normalizeFundCodeSegment(departmentCode || departmentName);
  const suffix = departmentId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `DEPT_${base}_${suffix}`.slice(0, 50);
}

async function ensureDepartmentFinanceSetup(params: {
  supabase: any;
  churchId: string;
  department: {
    id: string;
    department_name: string;
    code: string | null;
    is_active: boolean;
  };
}) {
  const { supabase, churchId, department } = params;
  const fundCode = buildDepartmentFundCode({
    departmentId: department.id,
    departmentCode: department.code,
    departmentName: department.department_name,
  });
  const fundName = `${department.department_name} Fund`;
  const fundDescription = `Auto-generated department fund for ${department.department_name}.`;

  const existingByDepartment = await supabase
    .from("treasury_funds")
    .select("id")
    .eq("church_id", churchId)
    .eq("department_id", department.id)
    .maybeSingle();

  const departmentColumnMissing =
    !!existingByDepartment.error &&
    isMissingColumnError(existingByDepartment.error, "department_id");

  if (existingByDepartment.error && !departmentColumnMissing) {
    return {
      ok: false,
      error: normalizeSupabaseErrorMessage(
        existingByDepartment.error,
        "Failed to verify existing department fund setup."
      ),
    } as const;
  }

  if (existingByDepartment.data) {
    const { error: updateExistingError } = await supabase
      .from("treasury_funds")
      .update({
        code: fundCode,
        name: fundName,
        fund_type: "department",
        description: fundDescription,
        is_active: department.is_active,
      })
      .eq("church_id", churchId)
      .eq("id", existingByDepartment.data.id);

    if (updateExistingError) {
      return {
        ok: false,
        error: normalizeSupabaseErrorMessage(
          updateExistingError,
          "Failed to synchronize existing department fund."
        ),
      } as const;
    }

    return { ok: true } as const;
  }

  const existingByCode = await supabase
    .from("treasury_funds")
    .select("id")
    .eq("church_id", churchId)
    .eq("code", fundCode)
    .maybeSingle();

  if (existingByCode.error) {
    return {
      ok: false,
      error: normalizeSupabaseErrorMessage(
        existingByCode.error,
        "Failed to verify department fund code uniqueness."
      ),
    } as const;
  }

  if (existingByCode.data) {
    const updatePayload: Record<string, unknown> = {
      name: fundName,
      fund_type: "department",
      description: fundDescription,
      is_active: department.is_active,
    };
    if (!departmentColumnMissing) {
      updatePayload.department_id = department.id;
    }

    const { error: updateByCodeError } = await supabase
      .from("treasury_funds")
      .update(updatePayload)
      .eq("church_id", churchId)
      .eq("id", existingByCode.data.id);

    if (updateByCodeError) {
      return {
        ok: false,
        error: normalizeSupabaseErrorMessage(
          updateByCodeError,
          "Failed to link existing department fund."
        ),
      } as const;
    }

    return { ok: true } as const;
  }

  const insertPayload: Record<string, unknown> = {
    church_id: churchId,
    code: fundCode,
    name: fundName,
    fund_type: "department",
    description: fundDescription,
    is_active: department.is_active,
  };
  if (!departmentColumnMissing) {
    insertPayload.department_id = department.id;
  }

  const withDepartmentInsert = await supabase
    .from("treasury_funds")
    .insert(insertPayload);

  if (!withDepartmentInsert.error) {
    return { ok: true } as const;
  }

  if (
    !departmentColumnMissing &&
    isMissingColumnError(withDepartmentInsert.error, "department_id")
  ) {
    const legacyInsert = await supabase
      .from("treasury_funds")
      .insert({
        church_id: churchId,
        code: fundCode,
        name: fundName,
        fund_type: "department",
        description: fundDescription,
        is_active: department.is_active,
      });

    if (!legacyInsert.error || isDuplicateKeyError(legacyInsert.error)) {
      return { ok: true } as const;
    }

    return {
      ok: false,
      error: normalizeSupabaseErrorMessage(
        legacyInsert.error,
        "Failed to create department treasury fund."
      ),
    } as const;
  }

  if (isDuplicateKeyError(withDepartmentInsert.error)) {
    return { ok: true } as const;
  }

  return {
    ok: false,
    error: normalizeSupabaseErrorMessage(
      withDepartmentInsert.error,
      "Failed to create department treasury fund."
    ),
  } as const;
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

  const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
  if (!validDepartment) return { ok: false, error: "Department not found in this church." };

  const { department_name, code, description, is_active } = parsed.data;

  const { error } = await supabase
    .from("church_departments")
    .update({
      department_name,
      code: code || null,
      description: description || null,
      is_active,
    })
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

  const financeSetupResult = await ensureDepartmentFinanceSetup({
    supabase,
    churchId: ctx.churchId,
    department: {
      id: departmentId,
      department_name,
      code: code || null,
      is_active,
    },
  });

  revalidateDepartmentPaths(churchSlug);
  if (!financeSetupResult.ok) {
    return {
      ok: true,
      message: `Department updated, but finance setup sync needs attention: ${financeSetupResult.error}`,
    };
  }
  return { ok: true, message: "Department updated successfully." };
}

export async function assignMemberToDepartmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireDepartmentManager(churchSlug);
  const supabase = await createClient();

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

export async function updateAssignmentAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const assignmentId = getString(formData, "assignmentId");
  const ctx = await requireDepartmentManager(churchSlug);
  const supabase = await createClient();

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
  const ctx = await requireDepartmentManager(churchSlug);
  const supabase = await createClient();

  if (!assignmentId) return { ok: false, error: "Assignment ID is required." };

  const { data: assignment, error: assignmentLookupError } = await supabase
    .from("member_departments")
    .select("member_id")
    .eq("church_id", ctx.churchId)
    .eq("id", assignmentId)
    .maybeSingle();

  if (assignmentLookupError) return { ok: false, error: assignmentLookupError.message };

  const { error } = await supabase
    .from("member_departments")
    .update({
      is_active: false,
    })
    .eq("church_id", ctx.churchId)
    .eq("id", assignmentId);

  if (error) return { ok: false, error: error.message };

  revalidateMemberDepartmentPaths(churchSlug, assignment?.member_id ?? null);
  return { ok: true, message: "Assignment removed successfully." };
}
