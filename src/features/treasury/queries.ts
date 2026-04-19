import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type {
  TreasuryAllocationPreviewEntry,
  TreasuryFinanceSettings,
} from "@/features/treasury/types";

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function sumAmount(rows: any[]) {
  return (rows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
}

const TREASURY_ALLOWED_ROLES = ["church_admin", "treasurer", "pastor"] as const;
const TREASURY_INFLOWS_DEPARTMENT_COLUMN = "department_id";
const TREASURY_DEPARTMENT_MIGRATION_REQUIRED_MESSAGE =
  "Department-linked treasury inflows require the department finance migration (database/rls/20260418_department_finance_system.sql).";

const DEFAULT_TREASURY_FINANCE_SETTINGS: TreasuryFinanceSettings = {
  tithe_auto_allocate: false,
  offering_auto_allocate: false,
  require_reference_numbers: false,
  require_member_for_named_inflows: true,
  allow_tithe_outflow_only_for_remittance: true,
  updated_at: null,
};

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeSupabaseErrorMessage(error: any, fallback: string) {
  const parts = [error?.message, error?.details, error?.hint]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
}

function withNullableDepartmentId<T extends Record<string, unknown>>(rows: T[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    ...row,
    department_id:
      Object.prototype.hasOwnProperty.call(row, TREASURY_INFLOWS_DEPARTMENT_COLUMN) &&
      row[TREASURY_INFLOWS_DEPARTMENT_COLUMN] !== undefined
        ? (row[TREASURY_INFLOWS_DEPARTMENT_COLUMN] as string | null)
        : null,
  }));
}

async function getLinkedInflowsCountForChurch(
  supabase: any,
  churchId: string
): Promise<{ count: number | null; error: any; hasDepartmentColumn: boolean }> {
  const withDepartment = await supabase
    .from("treasury_inflows")
    .select("id", { count: "exact", head: true })
    .eq("church_id", churchId)
    .eq("is_anonymous", false)
    .or("member_id.not.is.null,department_id.not.is.null");

  if (!withDepartment.error) {
    return {
      count: withDepartment.count ?? 0,
      error: null,
      hasDepartmentColumn: true,
    };
  }

  const withoutDepartment = await supabase
    .from("treasury_inflows")
    .select("id", { count: "exact", head: true })
    .eq("church_id", churchId)
    .eq("is_anonymous", false)
    .not("member_id", "is", null);

  if (!withoutDepartment.error) {
    return {
      count: withoutDepartment.count ?? 0,
      error: null,
      hasDepartmentColumn: false,
    };
  }

  const nonAnonymousFallback = await supabase
    .from("treasury_inflows")
    .select("id", { count: "exact", head: true })
    .eq("church_id", churchId)
    .eq("is_anonymous", false);

  if (!nonAnonymousFallback.error) {
    return {
      count: nonAnonymousFallback.count ?? 0,
      error: null,
      hasDepartmentColumn: false,
    };
  }

  const composedMessage = [
    normalizeSupabaseErrorMessage(
      withDepartment.error,
      "Department-aware linked inflows count failed."
    ),
    normalizeSupabaseErrorMessage(
      withoutDepartment.error,
      "Legacy member-linked inflows count failed."
    ),
    normalizeSupabaseErrorMessage(
      nonAnonymousFallback.error,
      "Non-anonymous inflows fallback count failed."
    ),
  ].join(" | ");

  return {
    count: null,
    error: new Error(composedMessage),
    hasDepartmentColumn: false,
  };
}

async function getRecentInflowsForChurch(
  supabase: any,
  churchId: string,
  limit: number
): Promise<{ data: any[] | null; error: any; hasDepartmentColumn: boolean }> {
  const withDepartment = await supabase
    .from("treasury_inflows")
    .select(
      "id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, department_id, fund_id"
    )
    .eq("church_id", churchId)
    .order("inflow_date", { ascending: false })
    .limit(limit);

  if (!withDepartment.error) {
    return {
      data: withNullableDepartmentId(withDepartment.data as unknown as Record<string, unknown>[]),
      error: null,
      hasDepartmentColumn: true,
    };
  }

  const withoutDepartment = await supabase
    .from("treasury_inflows")
    .select(
      "id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, fund_id"
    )
    .eq("church_id", churchId)
    .order("inflow_date", { ascending: false })
    .limit(limit);

  if (withoutDepartment.error) {
    const composedMessage = [
      normalizeSupabaseErrorMessage(
        withDepartment.error,
        "Department-aware recent inflows query failed."
      ),
      normalizeSupabaseErrorMessage(
        withoutDepartment.error,
        "Legacy recent inflows fallback query failed."
      ),
    ].join(" | ");

    return {
      data: null,
      error: new Error(composedMessage),
      hasDepartmentColumn: false,
    };
  }

  return {
    data: withNullableDepartmentId(withoutDepartment.data as unknown as Record<string, unknown>[]),
    error: null,
    hasDepartmentColumn: false,
  };
}

function pickStringFromRecord(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickNumberFromRecord(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function normalizeFinanceSettings(row: Record<string, unknown> | null): TreasuryFinanceSettings {
  if (!row) return { ...DEFAULT_TREASURY_FINANCE_SETTINGS };

  return {
    tithe_auto_allocate: toBoolean(
      row.tithe_auto_allocate,
      DEFAULT_TREASURY_FINANCE_SETTINGS.tithe_auto_allocate
    ),
    offering_auto_allocate: toBoolean(
      row.offering_auto_allocate,
      DEFAULT_TREASURY_FINANCE_SETTINGS.offering_auto_allocate
    ),
    require_reference_numbers: toBoolean(
      row.require_reference_numbers,
      DEFAULT_TREASURY_FINANCE_SETTINGS.require_reference_numbers
    ),
    require_member_for_named_inflows: toBoolean(
      row.require_member_for_named_inflows,
      DEFAULT_TREASURY_FINANCE_SETTINGS.require_member_for_named_inflows
    ),
    allow_tithe_outflow_only_for_remittance: toBoolean(
      row.allow_tithe_outflow_only_for_remittance,
      DEFAULT_TREASURY_FINANCE_SETTINGS.allow_tithe_outflow_only_for_remittance
    ),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

async function fetchTreasuryFinanceSettingsRaw(supabase: any, churchId: string) {
  try {
    const { data, error } = await supabase
      .from("treasury_finance_settings")
      .select("*")
      .eq("church_id", churchId)
      .maybeSingle();

    if (error) return { ...DEFAULT_TREASURY_FINANCE_SETTINGS };
    return normalizeFinanceSettings((data ?? null) as Record<string, unknown> | null);
  } catch {
    return { ...DEFAULT_TREASURY_FINANCE_SETTINGS };
  }
}

function normalizeAllocationStatus(value: string | null) {
  if (!value) return "pending";
  return value;
}

async function getAllocationPreviewRaw(
  supabase: any,
  churchId: string,
  funds: Array<{ id: string; code: string; name: string; fund_type: string }>,
  limit: number = 40
): Promise<TreasuryAllocationPreviewEntry[]> {
  try {
    const { data: rows, error } = await supabase
      .from("treasury_inflow_allocations")
      .select("*")
      .eq("church_id", churchId)
      .limit(Math.max(limit * 2, 40));

    if (error || !Array.isArray(rows) || rows.length === 0) return [];

    const normalizedRows = rows.map((raw: any, index: number) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const inflowId = pickStringFromRecord(row, ["inflow_id", "treasury_inflow_id", "inflow_entry_id"]);
      return {
        id: pickStringFromRecord(row, ["id"]) ?? `alloc-${index}`,
        inflow_id: inflowId,
        allocation_kind: pickStringFromRecord(row, ["allocation_kind", "kind"]) ?? "local_retained",
        target_fund_id: pickStringFromRecord(row, ["target_fund_id", "fund_id", "destination_fund_id"]),
        allocated_amount:
          pickNumberFromRecord(row, ["allocated_amount", "allocation_amount", "amount"]) ?? 0,
        status: normalizeAllocationStatus(
          pickStringFromRecord(row, ["allocation_status", "status"])
        ),
        rule_name: pickStringFromRecord(row, ["rule_name", "rule_code", "rule_label", "name"]),
        source_inflow_type: pickStringFromRecord(row, ["source_inflow_type", "inflow_type"]) ?? "unknown",
        created_at: pickStringFromRecord(row, ["created_at", "updated_at"]),
      };
    });

    const inflowIds = Array.from(
      new Set(
        normalizedRows
          .map((row) => row.inflow_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    let inflowMap = new Map<string, Record<string, unknown>>();
    if (inflowIds.length > 0) {
      const { data: inflowRows, error: inflowError } = await supabase
        .from("treasury_inflows")
        .select("id, inflow_type, inflow_date, amount, reference_number")
        .eq("church_id", churchId)
        .in("id", inflowIds);

      if (!inflowError && Array.isArray(inflowRows)) {
        inflowMap = new Map<string, Record<string, unknown>>(
          inflowRows.map((item: any) => [String(item.id), item as Record<string, unknown>])
        );
      }
    }

    const fundMap = new Map(funds.map((fund) => [fund.id, fund.name]));

    const enriched = normalizedRows
      .map((row) => {
        const inflow = row.inflow_id ? inflowMap.get(row.inflow_id) : null;
        const targetFundName = row.target_fund_id ? fundMap.get(row.target_fund_id) ?? null : null;

        return {
          id: row.id,
          inflow_id: row.inflow_id,
          inflow_reference: inflow
            ? (pickStringFromRecord(inflow, ["reference_number"]) ?? row.inflow_id)
            : row.inflow_id,
          inflow_type: (inflow && pickStringFromRecord(inflow, ["inflow_type"])) ?? row.source_inflow_type,
          inflow_date: inflow ? pickStringFromRecord(inflow, ["inflow_date"]) : null,
          inflow_amount: inflow ? pickNumberFromRecord(inflow, ["amount"]) : null,
          allocation_kind: row.allocation_kind,
          target_fund_id: row.target_fund_id,
          target_fund_name: targetFundName,
          allocated_amount: Number(row.allocated_amount || 0),
          status: row.status,
          rule_name: row.rule_name,
          created_at: row.created_at,
        } satisfies TreasuryAllocationPreviewEntry;
      })
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

    return enriched.slice(0, limit);
  } catch {
    return [];
  }
}

function summarizeAllocationPreview(rows: TreasuryAllocationPreviewEntry[]) {
  let missionRemittanceAllocated = 0;
  let localRetainedAllocated = 0;
  let pendingMissionRemittance = 0;
  let pendingLocalRetained = 0;

  for (const row of rows) {
    const amount = Number(row.allocated_amount || 0);
    const status = String(row.status || "pending").toLowerCase();
    const isPending = status === "pending";

    if (row.allocation_kind === "mission_remittance") {
      missionRemittanceAllocated += amount;
      if (isPending) pendingMissionRemittance += amount;
      continue;
    }

    if (row.allocation_kind === "local_retained") {
      localRetainedAllocated += amount;
      if (isPending) pendingLocalRetained += amount;
    }
  }

  return {
    allocationCount: rows.length,
    missionRemittanceAllocated,
    localRetainedAllocated,
    pendingMissionRemittance,
    pendingLocalRetained,
  };
}

export interface TreasuryMemberOption {
  id: string;
  display_name?: string | null;
  first_name: string;
  last_name: string;
  member_code?: string | null;
}

interface TreasuryFormOptionOverrides {
  includeFundIds?: string[];
  includeDepartmentIds?: string[];
}

export async function getTreasuryDashboard(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const linkedInflowsPromise = getLinkedInflowsCountForChurch(supabase, ctx.churchId);

  const [
    { count: fundCount, error: fundError },
    { data: inflows, error: inflowError },
    { data: outflows, error: outflowError },
    { count: linkedInflowsCount, error: linkedError },
    { count: anonymousInflowsCount, error: anonymousError },
  ] = await Promise.all([
    supabase.from("treasury_funds").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId),
    supabase.from("treasury_inflows").select("amount, inflow_type, inflow_date").eq("church_id", ctx.churchId),
    supabase.from("treasury_outflows").select("amount, outflow_type, outflow_date").eq("church_id", ctx.churchId),
    linkedInflowsPromise,
    supabase.from("treasury_inflows").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("is_anonymous", true),
  ]);

  if (fundError) throw new Error(normalizeSupabaseErrorMessage(fundError, "Failed to load treasury funds count."));
  if (inflowError) throw new Error(normalizeSupabaseErrorMessage(inflowError, "Failed to load treasury inflows."));
  if (outflowError) throw new Error(normalizeSupabaseErrorMessage(outflowError, "Failed to load treasury outflows."));
  if (linkedError) throw new Error(normalizeSupabaseErrorMessage(linkedError, "Failed to load linked inflows count."));
  if (anonymousError) throw new Error(normalizeSupabaseErrorMessage(anonymousError, "Failed to load anonymous inflows count."));

  const totalIn = sumAmount(inflows ?? []);
  const totalOut = sumAmount(outflows ?? []);

  const inflowByType = Object.entries(
    (inflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.inflow_type || "unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  ).map(([type, amount]) => ({ type, amount }));

  const outflowByType = Object.entries(
    (outflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.outflow_type || "unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  ).map(([type, amount]) => ({ type, amount }));

  return {
    fundCount: fundCount ?? 0,
    totalIn,
    totalOut,
    netBalance: totalIn - totalOut,
    linkedInflowsCount: linkedInflowsCount ?? 0,
    anonymousInflowsCount: anonymousInflowsCount ?? 0,
    inflowByType,
    outflowByType,
  };
}

/**
 * Request-level cache for treasury funds list.
 * Safe because: scoped to churchSlug, returns stable reference data.
 * Cache scope: Single request (React cache).
 * Invalidation: Automatic at request end.
 * Note: Funds are relatively stable; mutations should use revalidateTag for cross-request freshness.
 */
export const getTreasuryFunds = cache(async (churchSlug: string) => {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("treasury_funds")
    .select("id, code, name, fund_type, description, is_active, created_at")
    .eq("church_id", ctx.churchId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
});

// Tag-based cache keys for treasury data (for use with unstable_cache if needed)
export const treasuryCacheTags = {
  funds: (churchSlug: string) => `church-${churchSlug}-funds`,
  treasury: (churchSlug: string) => `church-${churchSlug}-treasury`,
};

export async function getTreasuryRecentInflows(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await getRecentInflowsForChurch(supabase, ctx.churchId, 10);
  if (error) throw new Error(normalizeSupabaseErrorMessage(error, "Failed to load recent treasury inflows."));
  return data ?? [];
}

export async function getTreasuryRecentOutflows(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("treasury_outflows")
    .select("id, outflow_type, amount, outflow_date, payee, purpose, project_name, reference_number, fund_id, department_id")
    .eq("church_id", ctx.churchId)
    .order("outflow_date", { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);

  return data ?? [];
}

/**
 * Get treasury form options - cached per church for request deduplication.
 * Safe to cache: form reference data (funds, members, departments) changes infrequently.
 * Cache scope: Single request (React cache).
 * Cache key: churchSlug
 */
export const getTreasuryMemberOptions = cache(async (churchSlug: string): Promise<TreasuryMemberOption[]> => {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id, display_name, first_name, last_name, member_code")
    .eq("church_id", ctx.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TreasuryMemberOption[];
});

const getTreasuryFormOptionsBase = cache(async (churchSlug: string) => {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();

  const [{ data: funds, error: fundsError }, { data: departments, error: departmentsError }, members] = await Promise.all([
    supabase
      .from("treasury_funds")
      .select("id, code, name, fund_type")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("church_departments")
      .select("id, department_name")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true)
      .order("department_name", { ascending: true }),
    getTreasuryMemberOptions(churchSlug),
  ]);

  if (fundsError) throw new Error(fundsError.message);
  if (departmentsError) throw new Error(departmentsError.message);

  return {
    churchId: ctx.churchId,
    funds: funds ?? [],
    members: members ?? [],
    departments: departments ?? [],
  };
});

export async function getTreasuryFormOptions(
  churchSlug: string,
  overrides?: TreasuryFormOptionOverrides
) {
  const base = await getTreasuryFormOptionsBase(churchSlug);
  const includeFundIds = Array.from(new Set((overrides?.includeFundIds ?? []).filter(Boolean)));
  const includeDepartmentIds = Array.from(new Set((overrides?.includeDepartmentIds ?? []).filter(Boolean)));

  if (includeFundIds.length === 0 && includeDepartmentIds.length === 0) {
    return base;
  }

  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();

  const currentFundIds = new Set(base.funds.map((item: any) => item.id));
  const currentDepartmentIds = new Set(base.departments.map((item: any) => item.id));

  const missingFundIds = includeFundIds.filter((id) => !currentFundIds.has(id));
  const missingDepartmentIds = includeDepartmentIds.filter((id) => !currentDepartmentIds.has(id));

  const [missingFunds, missingDepartments] = await Promise.all([
    missingFundIds.length > 0
      ? supabase
          .from("treasury_funds")
          .select("id, code, name, fund_type")
          .eq("church_id", ctx.churchId)
          .in("id", missingFundIds)
      : Promise.resolve({ data: [], error: null as any }),
    missingDepartmentIds.length > 0
      ? supabase
          .from("church_departments")
          .select("id, department_name")
          .eq("church_id", ctx.churchId)
          .in("id", missingDepartmentIds)
      : Promise.resolve({ data: [], error: null as any }),
  ]);

  if (missingFunds.error) throw new Error(missingFunds.error.message);
  if (missingDepartments.error) throw new Error(missingDepartments.error.message);

  const mergedFunds = [...base.funds, ...(missingFunds.data ?? [])].sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
  const mergedDepartments = [...base.departments, ...(missingDepartments.data ?? [])].sort((a, b) =>
    String(a.department_name).localeCompare(String(b.department_name))
  );

  return {
    ...base,
    funds: mergedFunds,
    departments: mergedDepartments,
  };
}

export async function getTreasuryFinanceSettings(
  churchSlug: string
): Promise<TreasuryFinanceSettings> {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();
  return fetchTreasuryFinanceSettingsRaw(supabase, ctx.churchId);
}

export async function getTreasuryAllocationPreview(
  churchSlug: string,
  limit: number = 30
): Promise<TreasuryAllocationPreviewEntry[]> {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();
  const funds = await getTreasuryFunds(churchSlug);
  return getAllocationPreviewRaw(supabase, ctx.churchId, funds as any[], limit);
}

export async function getTreasuryInflows(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const q = pickSingle(rawFilters?.q);
  const inflowType = pickSingle(rawFilters?.inflowType);
  const fundId = pickSingle(rawFilters?.fundId);
  const memberId = pickSingle(rawFilters?.memberId);
  const departmentId = pickSingle(rawFilters?.departmentId);
  const dateFrom = pickSingle(rawFilters?.dateFrom);
  const dateTo = pickSingle(rawFilters?.dateTo);

  const applyFilters = (query: any, hasDepartmentColumn: boolean) => {
    if (inflowType) query = query.eq("inflow_type", inflowType);
    if (fundId) query = query.eq("fund_id", fundId);
    if (memberId) query = query.eq("member_id", memberId);
    if (departmentId) {
      if (!hasDepartmentColumn) {
        throw new Error(TREASURY_DEPARTMENT_MIGRATION_REQUIRED_MESSAGE);
      }
      query = query.eq("department_id", departmentId);
    }
    if (dateFrom) query = query.gte("inflow_date", dateFrom);
    if (dateTo) query = query.lte("inflow_date", dateTo);

    if (q) {
      const safe = q.replace(/,/g, " ");
      query = query.or(
        ["note.ilike.%" + safe + "%", "reference_number.ilike.%" + safe + "%"].join(",")
      );
    }

    return query.order("inflow_date", { ascending: false }).order("created_at", { ascending: false });
  };

  const runQuery = async (hasDepartmentColumn: boolean) => {
    let query = supabase
      .from("treasury_inflows")
      .select(
        hasDepartmentColumn
          ? "id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, department_id, fund_id, created_at"
          : "id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, fund_id, created_at"
      )
      .eq("church_id", ctx.churchId);

    query = applyFilters(query, hasDepartmentColumn);
    return query;
  };

  try {
    const withDepartment = await runQuery(true);
    if (!withDepartment.error) {
      return withNullableDepartmentId(withDepartment.data as unknown as Record<string, unknown>[]);
    }

    const withoutDepartment = await runQuery(false);
    if (withoutDepartment.error) {
      const composedMessage = [
        normalizeSupabaseErrorMessage(withDepartment.error, "Department-aware treasury inflows query failed."),
        normalizeSupabaseErrorMessage(withoutDepartment.error, "Legacy treasury inflows fallback query failed."),
      ].join(" | ");
      throw new Error(composedMessage);
    }

    return withNullableDepartmentId(withoutDepartment.data as unknown as Record<string, unknown>[]);
  } catch (error: any) {
    throw error instanceof Error
      ? error
      : new Error(normalizeSupabaseErrorMessage(error, "Failed to load treasury inflows."));
  }
}

export async function getTreasuryOutflows(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const q = pickSingle(rawFilters?.q);
  const outflowType = pickSingle(rawFilters?.outflowType);
  const fundId = pickSingle(rawFilters?.fundId);
  const departmentId = pickSingle(rawFilters?.departmentId);
  const dateFrom = pickSingle(rawFilters?.dateFrom);
  const dateTo = pickSingle(rawFilters?.dateTo);

  let query = supabase
    .from("treasury_outflows")
    .select("id, outflow_type, amount, outflow_date, payee, purpose, project_name, reference_number, note, fund_id, department_id, created_at")
    .eq("church_id", ctx.churchId);

  if (outflowType) query = query.eq("outflow_type", outflowType);
  if (fundId) query = query.eq("fund_id", fundId);
  if (departmentId) query = query.eq("department_id", departmentId);
  if (dateFrom) query = query.gte("outflow_date", dateFrom);
  if (dateTo) query = query.lte("outflow_date", dateTo);

  if (q) {
    const safe = q.replace(/,/g, " ");
    query = query.or([
      "purpose.ilike.%" + safe + "%",
      "payee.ilike.%" + safe + "%",
      "project_name.ilike.%" + safe + "%",
      "reference_number.ilike.%" + safe + "%",
      "note.ilike.%" + safe + "%",
    ].join(","));
  }

  query = query.order("outflow_date", { ascending: false }).order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data ?? [];
}

/**
 * Narrow field selection for treasury inflow lookup.
 * Previous: select("*") - fetched all fields including internal metadata
 * Now: explicit fields needed for editing and display
 */
const INFLOW_DETAIL_FIELDS_WITH_DEPARTMENT = `
  id, church_id, member_id, department_id, fund_id, 
  inflow_type, amount, inflow_date, is_anonymous,
  note, reference_number, created_at, updated_at
`;
const INFLOW_DETAIL_FIELDS_LEGACY = `
  id, church_id, member_id, fund_id, 
  inflow_type, amount, inflow_date, is_anonymous,
  note, reference_number, created_at, updated_at
`;

export async function getTreasuryInflowById(churchSlug: string, entryId: string) {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const withDepartment = await supabase
    .from("treasury_inflows")
    .select(INFLOW_DETAIL_FIELDS_WITH_DEPARTMENT)
    .eq("church_id", ctx.churchId)
    .eq("id", entryId)
    .maybeSingle();

  if (!withDepartment.error) {
    return withDepartment.data
      ? withNullableDepartmentId([withDepartment.data as Record<string, unknown>])[0]
      : null;
  }

  const legacy = await supabase
    .from("treasury_inflows")
    .select(INFLOW_DETAIL_FIELDS_LEGACY)
    .eq("church_id", ctx.churchId)
    .eq("id", entryId)
    .maybeSingle();

  if (legacy.error) {
    const composedMessage = [
      normalizeSupabaseErrorMessage(withDepartment.error, "Department-aware treasury inflow lookup failed."),
      normalizeSupabaseErrorMessage(legacy.error, "Legacy treasury inflow lookup failed."),
    ].join(" | ");
    throw new Error(composedMessage);
  }

  return legacy.data
    ? withNullableDepartmentId([legacy.data as Record<string, unknown>])[0]
    : null;
}

/**
 * Narrow field selection for treasury outflow lookup.
 * Previous: select("*") - fetched all fields including internal metadata
 * Now: explicit fields needed for editing and display
 */
const OUTFLOW_DETAIL_FIELDS = `
  id, church_id, fund_id, department_id,
  outflow_type, amount, outflow_date, payee, purpose, project_name,
  note, reference_number, created_at, updated_at
`;

export async function getTreasuryOutflowById(churchSlug: string, entryId: string) {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("treasury_outflows")
    .select(OUTFLOW_DETAIL_FIELDS)
    .eq("church_id", ctx.churchId)
    .eq("id", entryId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getTreasurySummary(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const dateFrom = pickSingle(rawFilters?.dateFrom);
  const dateTo = pickSingle(rawFilters?.dateTo);

  const buildInflowSummaryQuery = (hasDepartmentColumn: boolean) => {
    let query = supabase
      .from("treasury_inflows")
      .select(
        hasDepartmentColumn
          ? "id, amount, inflow_type, fund_id, member_id, department_id, is_anonymous, inflow_date"
          : "id, amount, inflow_type, fund_id, member_id, is_anonymous, inflow_date"
      )
      .eq("church_id", ctx.churchId);

    if (dateFrom) query = query.gte("inflow_date", dateFrom);
    if (dateTo) query = query.lte("inflow_date", dateTo);
    return query;
  };

  let outflowQuery = supabase
    .from("treasury_outflows")
    .select("id, amount, outflow_type, fund_id, department_id, project_name, outflow_date")
    .eq("church_id", ctx.churchId);

  if (dateFrom) outflowQuery = outflowQuery.gte("outflow_date", dateFrom);
  if (dateTo) outflowQuery = outflowQuery.lte("outflow_date", dateTo);

  const [withDepartmentInflowsResult, { data: outflows, error: outflowError }, { data: funds, error: fundsError }, { data: departments, error: departmentsError }] =
    await Promise.all([
      buildInflowSummaryQuery(true),
      outflowQuery,
      supabase.from("treasury_funds").select("id, code, name, fund_type").eq("church_id", ctx.churchId),
      supabase.from("church_departments").select("id, department_name").eq("church_id", ctx.churchId),
    ]);

  let inflows = withNullableDepartmentId(
    (withDepartmentInflowsResult.data as unknown as Record<string, unknown>[] | null) ?? []
  );
  let inflowError = withDepartmentInflowsResult.error;

  if (inflowError) {
    const legacyInflowsResult = await buildInflowSummaryQuery(false);
    inflowError = legacyInflowsResult.error;
    if (inflowError) {
      const composedMessage = [
        normalizeSupabaseErrorMessage(
          withDepartmentInflowsResult.error,
          "Department-aware treasury summary inflows query failed."
        ),
        normalizeSupabaseErrorMessage(
          legacyInflowsResult.error,
          "Legacy treasury summary inflows fallback query failed."
        ),
      ].join(" | ");
      throw new Error(composedMessage);
    }
    inflows = withNullableDepartmentId((legacyInflowsResult.data as unknown as Record<string, unknown>[] | null) ?? []);
  }

  if (outflowError) throw new Error(normalizeSupabaseErrorMessage(outflowError, "Failed to load treasury outflow summary."));
  if (fundsError) throw new Error(normalizeSupabaseErrorMessage(fundsError, "Failed to load treasury funds."));
  if (departmentsError) {
    throw new Error(normalizeSupabaseErrorMessage(departmentsError, "Failed to load church departments."));
  }

  const fundMap = Object.fromEntries((funds ?? []).map((f: any) => [f.id, f]));
  const deptMap = Object.fromEntries((departments ?? []).map((d: any) => [d.id, d.department_name]));

  const totalIn = sumAmount(inflows ?? []);
  const totalOut = sumAmount(outflows ?? []);
  const linkedInTotal = (inflows ?? [])
    .filter((row: any) => !row.is_anonymous && (row.member_id || row.department_id))
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const anonymousInTotal = (inflows ?? [])
    .filter((row: any) => row.is_anonymous)
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  const inflowByType = Object.entries(
    (inflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.inflow_type || "unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  )
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => a.type.localeCompare(b.type));

  const outflowByType = Object.entries(
    (outflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.outflow_type || "unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  )
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => a.type.localeCompare(b.type));

  const inflowByFund = Object.entries(
    (inflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const fund = fundMap[row.fund_id];
      const key = fund?.name || "Unknown Fund";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  )
    .map(([fund, amount]) => ({ fund, amount }))
    .sort((a, b) => a.fund.localeCompare(b.fund));

  const outflowByFund = Object.entries(
    (outflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const fund = row.fund_id ? fundMap[row.fund_id] : null;
      const key = fund?.name || "Unspecified Fund";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  )
    .map(([fund, amount]) => ({ fund, amount }))
    .sort((a, b) => a.fund.localeCompare(b.fund));

  const outflowByDepartment = Object.entries(
    (outflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.department_id ? (deptMap[row.department_id] || "Unknown Department") : "Unassigned Department";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  )
    .map(([department, amount]) => ({ department, amount }))
    .sort((a, b) => a.department.localeCompare(b.department));

  const outflowByProject = Object.entries(
    (outflows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.project_name || "No Project";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  )
    .map(([project, amount]) => ({ project, amount }))
    .sort((a, b) => a.project.localeCompare(b.project));

  const missionRemittanceTotal = (outflows ?? [])
    .filter((row: any) => row.outflow_type === "mission_remittance")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  let allocationPreview: TreasuryAllocationPreviewEntry[] = [];
  try {
    allocationPreview = await getAllocationPreviewRaw(
      supabase,
      ctx.churchId,
      (funds ?? []) as any[],
      500
    );
  } catch {
    allocationPreview = [];
  }

  const allocationSummary = summarizeAllocationPreview(allocationPreview);

  return {
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    totalIn,
    totalOut,
    netBalance: totalIn - totalOut,
    linkedInTotal,
    anonymousInTotal,
    inflowByType,
    outflowByType,
    inflowByFund,
    outflowByFund,
    outflowByDepartment,
    outflowByProject,
    missionRemittanceTotal,
    allocationCount: allocationSummary.allocationCount,
    missionRemittanceAllocated: allocationSummary.missionRemittanceAllocated,
    localRetainedAllocated: allocationSummary.localRetainedAllocated,
    pendingMissionRemittance: allocationSummary.pendingMissionRemittance,
    pendingLocalRetained: allocationSummary.pendingLocalRetained,
    inflowCount: inflows?.length ?? 0,
    outflowCount: outflows?.length ?? 0,
  };
}

export async function getTreasuryAuditLogs(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const q = pickSingle(rawFilters?.q);
  const entityType = pickSingle(rawFilters?.entityType);
  const actionType = pickSingle(rawFilters?.actionType);
  const changedBy = pickSingle(rawFilters?.changedBy);
  const dateFrom = pickSingle(rawFilters?.dateFrom);
  const dateTo = pickSingle(rawFilters?.dateTo);

  let query = supabase
    .from("treasury_audit_logs")
    .select(`
      id,
      church_id,
      entity_type,
      entity_id,
      action_type,
      changed_by_user_id,
      correction_note,
      before_snapshot,
      after_snapshot,
      created_at,
      changed_by:profiles!treasury_audit_logs_changed_by_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq("church_id", ctx.churchId);

  if (entityType) query = query.eq("entity_type", entityType);
  if (actionType) query = query.eq("action_type", actionType);
  if (changedBy) query = query.eq("changed_by_user_id", changedBy);
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

  if (q) {
    const safe = q.replace(/,/g, " ");
    query = query.or(
      [
        `correction_note.ilike.%${safe}%`,
        `entity_type.ilike.%${safe}%`,
        `action_type.ilike.%${safe}%`,
      ].join(",")
    );
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const actorIds = Array.from(
    new Set(
      (data ?? [])
        .map((item: any) => item.changed_by_user_id)
        .filter(Boolean)
    )
  );

  let actorOptions: Array<{ id: string; label: string }> = [];
  if (actorIds.length > 0) {
    const { data: actorRows, error: actorError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds);

    if (actorError) throw new Error(actorError.message);

    actorOptions = (actorRows ?? [])
      .map((row: any) => ({
        id: row.id,
        label: row.full_name || row.email || row.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return {
    rows: data ?? [],
    actorOptions,
  };
}

export async function getTreasuryWorkspaceBootstrap(churchSlug: string) {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();
  const linkedInflowsCountPromise = getLinkedInflowsCountForChurch(supabase, ctx.churchId);
  const recentInflowsPromise = getRecentInflowsForChurch(supabase, ctx.churchId, 10);

  const [
    { count: fundCount, error: fundCountError },

    { data: inflowSummaryRows, error: inflowSummaryError },
    { data: outflowSummaryRows, error: outflowSummaryError },

    { count: linkedInflowsCount, error: linkedInflowsCountError },
    { count: anonymousInflowsCount, error: anonymousInflowsCountError },

    { data: recentInflows, error: recentInflowsError },
    { data: recentOutflows, error: recentOutflowsError },

    { data: funds, error: fundsError },
    { data: departments, error: departmentsError },
    members,
  ] = await Promise.all([
    supabase
      .from("treasury_funds")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId),

    supabase
      .from("treasury_inflows")
      .select("amount, inflow_type")
      .eq("church_id", ctx.churchId),

    supabase
      .from("treasury_outflows")
      .select("amount, outflow_type")
      .eq("church_id", ctx.churchId),

    linkedInflowsCountPromise,

    supabase
      .from("treasury_inflows")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("is_anonymous", true),

    recentInflowsPromise,

    supabase
      .from("treasury_outflows")
      .select("id, outflow_type, amount, outflow_date, payee, purpose, project_name, reference_number, fund_id, department_id")
      .eq("church_id", ctx.churchId)
      .order("outflow_date", { ascending: false })
      .limit(10),

    supabase
      .from("treasury_funds")
      .select("id, code, name, fund_type")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase
      .from("church_departments")
      .select("id, department_name")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true)
      .order("department_name", { ascending: true }),
    getTreasuryMemberOptions(churchSlug),
  ]);

  if (fundCountError) throw new Error(normalizeSupabaseErrorMessage(fundCountError, "Failed to load fund count."));
  if (inflowSummaryError) {
    throw new Error(normalizeSupabaseErrorMessage(inflowSummaryError, "Failed to load inflow summary."));
  }
  if (outflowSummaryError) {
    throw new Error(normalizeSupabaseErrorMessage(outflowSummaryError, "Failed to load outflow summary."));
  }
  if (linkedInflowsCountError) {
    throw new Error(
      normalizeSupabaseErrorMessage(linkedInflowsCountError, "Failed to load linked inflows count.")
    );
  }
  if (anonymousInflowsCountError) {
    throw new Error(
      normalizeSupabaseErrorMessage(anonymousInflowsCountError, "Failed to load anonymous inflows count.")
    );
  }
  if (recentInflowsError) {
    throw new Error(normalizeSupabaseErrorMessage(recentInflowsError, "Failed to load recent inflows."));
  }
  if (recentOutflowsError) {
    throw new Error(normalizeSupabaseErrorMessage(recentOutflowsError, "Failed to load recent outflows."));
  }
  if (fundsError) throw new Error(normalizeSupabaseErrorMessage(fundsError, "Failed to load treasury funds."));
  if (departmentsError) {
    throw new Error(normalizeSupabaseErrorMessage(departmentsError, "Failed to load church departments."));
  }

  const totalIn = sumAmount(inflowSummaryRows ?? []);
  const totalOut = sumAmount(outflowSummaryRows ?? []);

  const inflowByType = Object.entries(
    (inflowSummaryRows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.inflow_type || "unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  ).map(([type, amount]) => ({ type, amount }));

  const outflowByType = Object.entries(
    (outflowSummaryRows ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.outflow_type || "unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {})
  ).map(([type, amount]) => ({ type, amount }));

  const financeSettings = await fetchTreasuryFinanceSettingsRaw(supabase, ctx.churchId);
  const allocationPreview = await getAllocationPreviewRaw(
    supabase,
    ctx.churchId,
    (funds ?? []) as any[],
    40
  );
  const allocationSummary = summarizeAllocationPreview(allocationPreview);

  return {
    dashboard: {
      fundCount: fundCount ?? 0,
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
      linkedInflowsCount: linkedInflowsCount ?? 0,
      anonymousInflowsCount: anonymousInflowsCount ?? 0,
      inflowByType,
      outflowByType,
      allocationCount: allocationSummary.allocationCount,
      pendingMissionRemittance: allocationSummary.pendingMissionRemittance,
      pendingLocalRetained: allocationSummary.pendingLocalRetained,
    },
    recentInflows: recentInflows ?? [],
    recentOutflows: recentOutflows ?? [],
    allocationPreview,
    financeSettings,
    formOptions: {
      churchId: ctx.churchId,
      funds: funds ?? [],
      members: members ?? [],
      departments: departments ?? [],
    },
  };
}


export async function getMembersAlreadyTithedThisWeek(
  churchSlug: string
): Promise<string[]> {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();

  const now = new Date();
  const day = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  const weekStart = startOfWeek.toISOString().split("T")[0];
  const weekEnd = endOfWeek.toISOString().split("T")[0];

  const { data } = await supabase
    .from("treasury_inflows")
    .select("member_id")
    .eq("church_id", ctx.churchId)
    .eq("inflow_type", "tithe")
    .gte("inflow_date", weekStart)
    .lte("inflow_date", weekEnd)
    .not("member_id", "is", null);

  return Array.from(
    new Set(
      (data ?? [])
        .map((r: any) => r.member_id as string | null)
        .filter((memberId): memberId is string => Boolean(memberId))
    )
  );
}

export async function getMemberFinancialProfile(churchSlug: string, memberId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("treasury_inflows")
    .select("id, inflow_type, amount, inflow_date, note, reference_number, fund_id, created_at")
    .eq("church_id", ctx.churchId)
    .eq("member_id", memberId)
    .order("inflow_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];

  const totalTithe = rows
    .filter((row: any) => row.inflow_type === "tithe")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  const totalOffering = rows
    .filter((row: any) => row.inflow_type === "offering")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  const totalGiving = rows.reduce(
    (sum: number, row: any) => sum + Number(row.amount || 0),
    0
  );

  return {
    totalTithe,
    totalOffering,
    totalGiving,
    recentContributions: rows.slice(0, 10),
  };
}
