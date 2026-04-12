"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function revalidateDepartmentPaths(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/c/${churchSlug}/members`);
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

  const { error } = await supabase.from("church_departments").insert({
    church_id: ctx.churchId,
    department_name,
    code: code || null,
    description: description || null,
    is_active,
  });

  if (error) {
    const message = error.message?.toLowerCase?.() || "";
    if (message.includes("row-level security") || message.includes("policy")) {
      return { 
        ok: false, 
        error: "Department creation blocked by security policy. Ensure you have admin or clerk role." 
      };
    }
    return { ok: false, error: error.message };
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

  revalidateDepartmentPaths(churchSlug);
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

    revalidateDepartmentPaths(churchSlug);
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

  revalidateDepartmentPaths(churchSlug);
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

  revalidateDepartmentPaths(churchSlug);
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

  const { error } = await supabase
    .from("member_departments")
    .update({
      is_active: false,
    })
    .eq("church_id", ctx.churchId)
    .eq("id", assignmentId);

  if (error) return { ok: false, error: error.message };

  revalidateDepartmentPaths(churchSlug);
  return { ok: true, message: "Assignment removed successfully." };
}
