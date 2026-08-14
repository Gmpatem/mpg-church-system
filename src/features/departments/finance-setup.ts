import "server-only";

import { normalizeSupabaseErrorMessage } from "@/lib/supabase/errors";

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

export async function ensureDepartmentFinanceSetup(params: {
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
