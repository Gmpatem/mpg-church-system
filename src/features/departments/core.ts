import { normalizeSupabaseErrorMessage } from "@/lib/supabase/errors";

type SupabaseLike = {
  from: (table: string) => any;
};

export const CORE_CHURCH_DEPARTMENTS = [
  {
    key: "sabbath_school",
    name: "Sabbath School",
    code: "SABBATH_SCHOOL",
    description: "Bible study classes, lesson groups, and Sabbath School coordination.",
  },
  {
    key: "deacons",
    name: "Deacons Department",
    code: "DEACONS",
    description: "Deacon operations, service support, welcome, offering, and facility readiness.",
  },
  {
    key: "children",
    name: "Children's Department",
    code: "CHILDREN",
    description: "Children's ministry, child records, classes, safety, and parent follow-up.",
  },
  {
    key: "media",
    name: "Media Department",
    code: "MEDIA",
    description: "Media requests, livestream, audio visual support, and service run sheets.",
  },
] as const;

export type CoreChurchDepartmentKey = (typeof CORE_CHURCH_DEPARTMENTS)[number]["key"];

function departmentNameMatches(name: string, candidates: string[]) {
  const normalized = name.trim().toLowerCase();
  return candidates.some((candidate) => normalized === candidate.toLowerCase());
}

export async function findCoreDepartment(
  supabase: SupabaseLike,
  churchId: string,
  key: CoreChurchDepartmentKey
) {
  const template = CORE_CHURCH_DEPARTMENTS.find((department) => department.key === key);
  if (!template) return null;

  const nameCandidates =
    key === "children"
      ? [template.name, "Children Department", "Children's Ministry", "Children Ministry"]
      : [template.name];

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", churchId)
    .eq("is_active", true);

  if (error) {
    throw new Error(normalizeSupabaseErrorMessage(error, "Core department could not be loaded."));
  }

  return (
    (data ?? []).find((department: any) => {
      const code = String(department.code ?? "").trim().toUpperCase();
      const name = String(department.department_name ?? "");
      return code === template.code || departmentNameMatches(name, nameCandidates);
    }) ?? null
  );
}

export async function ensureCoreDepartment(
  supabase: SupabaseLike,
  churchId: string,
  key: CoreChurchDepartmentKey
) {
  const existing = await findCoreDepartment(supabase, churchId, key);
  if (existing) return { ok: true as const, department: existing, created: false };

  const template = CORE_CHURCH_DEPARTMENTS.find((department) => department.key === key);
  if (!template) {
    return { ok: false as const, error: "Core department template was not found." };
  }

  const { data, error } = await supabase
    .from("church_departments")
    .insert({
      church_id: churchId,
      department_name: template.name,
      code: template.code,
      description: template.description,
      is_active: true,
    })
    .select("id, department_name, code, is_active")
    .single();

  if (error || !data) {
    return {
      ok: false as const,
      error: normalizeSupabaseErrorMessage(error, `Failed to create ${template.name}.`),
    };
  }

  return { ok: true as const, department: data, created: true };
}

export async function ensureCoreChurchDepartments(
  supabase: SupabaseLike,
  churchId: string
) {
  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", churchId);

  if (error) {
    return {
      ok: false as const,
      error: normalizeSupabaseErrorMessage(error, "Core departments could not be loaded."),
    };
  }

  const existing = data ?? [];
  const created: string[] = [];

  for (const template of CORE_CHURCH_DEPARTMENTS) {
    const alreadyExists = existing.some((department: any) => {
      const code = String(department.code ?? "").trim().toUpperCase();
      const name = String(department.department_name ?? "");
      return code === template.code || departmentNameMatches(name, [template.name]);
    });

    if (alreadyExists) continue;

    const { error: insertError } = await supabase.from("church_departments").insert({
      church_id: churchId,
      department_name: template.name,
      code: template.code,
      description: template.description,
      is_active: true,
    });

    if (insertError) {
      return {
        ok: false as const,
        error: normalizeSupabaseErrorMessage(insertError, `Failed to create ${template.name}.`),
      };
    }

    created.push(template.name);
  }

  return { ok: true as const, created };
}

export async function assignMemberToDepartmentById(params: {
  supabase: SupabaseLike;
  churchId: string;
  memberId: string;
  department: { id: string; department_name: string };
  roleTitle?: string | null;
  startDate?: string | null;
}) {
  const { supabase, churchId, memberId, department, roleTitle, startDate } = params;

  const { data: existing, error: existingError } = await supabase
    .from("member_departments")
    .select("id, is_active")
    .eq("church_id", churchId)
    .eq("member_id", memberId)
    .eq("department_id", department.id)
    .maybeSingle();

  if (existingError) {
    return {
      ok: false as const,
      error: normalizeSupabaseErrorMessage(existingError, "Department assignment could not be checked."),
    };
  }

  const joinedDate = startDate || new Date().toISOString().slice(0, 10);

  if (existing) {
    if (existing.is_active !== false) {
      return { ok: true as const, assignmentId: existing.id, reused: true };
    }

    const { error: updateError } = await supabase
      .from("member_departments")
      .update({
        department_name: department.department_name,
        role_title: roleTitle || null,
        role_in_department: roleTitle || null,
        start_date: joinedDate,
        joined_date: joinedDate,
        is_active: true,
      })
      .eq("church_id", churchId)
      .eq("id", existing.id);

    if (updateError) {
      return {
        ok: false as const,
        error: normalizeSupabaseErrorMessage(updateError, "Department assignment could not be reactivated."),
      };
    }

    return { ok: true as const, assignmentId: existing.id, reused: true };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("member_departments")
    .insert({
      church_id: churchId,
      member_id: memberId,
      department_id: department.id,
      department_name: department.department_name,
      role_title: roleTitle || null,
      role_in_department: roleTitle || null,
      start_date: joinedDate,
      joined_date: joinedDate,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError) {
    return {
      ok: false as const,
      error: normalizeSupabaseErrorMessage(insertError, "Department assignment could not be created."),
    };
  }

  return { ok: true as const, assignmentId: inserted?.id ?? null, reused: false };
}
