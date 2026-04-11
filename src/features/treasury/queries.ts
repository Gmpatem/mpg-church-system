import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function sumAmount(rows: any[]) {
  return (rows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
}

const TREASURY_ALLOWED_ROLES = ["church_admin", "treasurer", "pastor"] as const;

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
    supabase.from("treasury_inflows").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("is_anonymous", false).not("member_id", "is", null),
    supabase.from("treasury_inflows").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("is_anonymous", true),
  ]);

  if (fundError) throw new Error(fundError.message);
  if (inflowError) throw new Error(inflowError.message);
  if (outflowError) throw new Error(outflowError.message);
  if (linkedError) throw new Error(linkedError.message);
  if (anonymousError) throw new Error(anonymousError.message);

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

  const { data, error } = await supabase
    .from("treasury_inflows")
    .select("id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, fund_id")
    .eq("church_id", ctx.churchId)
    .order("inflow_date", { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);

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
  const dateFrom = pickSingle(rawFilters?.dateFrom);
  const dateTo = pickSingle(rawFilters?.dateTo);

  let query = supabase
    .from("treasury_inflows")
    .select("id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, fund_id, created_at")
    .eq("church_id", ctx.churchId);

  if (inflowType) query = query.eq("inflow_type", inflowType);
  if (fundId) query = query.eq("fund_id", fundId);
  if (memberId) query = query.eq("member_id", memberId);
  if (dateFrom) query = query.gte("inflow_date", dateFrom);
  if (dateTo) query = query.lte("inflow_date", dateTo);

  if (q) {
    const safe = q.replace(/,/g, " ");
    query = query.or([
      "note.ilike.%" + safe + "%",
      "reference_number.ilike.%" + safe + "%",
    ].join(","));
  }

  query = query.order("inflow_date", { ascending: false }).order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data ?? [];
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
const INFLOW_DETAIL_FIELDS = `
  id, church_id, member_id, fund_id, 
  inflow_type, amount, inflow_date, is_anonymous,
  note, reference_number, created_at, updated_at
`;

export async function getTreasuryInflowById(churchSlug: string, entryId: string) {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("treasury_inflows")
    .select(INFLOW_DETAIL_FIELDS)
    .eq("church_id", ctx.churchId)
    .eq("id", entryId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
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

  let inflowQuery = supabase
    .from("treasury_inflows")
    .select("id, amount, inflow_type, fund_id, member_id, is_anonymous, inflow_date")
    .eq("church_id", ctx.churchId);

  let outflowQuery = supabase
    .from("treasury_outflows")
    .select("id, amount, outflow_type, fund_id, department_id, project_name, outflow_date")
    .eq("church_id", ctx.churchId);

  if (dateFrom) {
    inflowQuery = inflowQuery.gte("inflow_date", dateFrom);
    outflowQuery = outflowQuery.gte("outflow_date", dateFrom);
  }
  if (dateTo) {
    inflowQuery = inflowQuery.lte("inflow_date", dateTo);
    outflowQuery = outflowQuery.lte("outflow_date", dateTo);
  }

  const [{ data: inflows, error: inflowError }, { data: outflows, error: outflowError }, { data: funds, error: fundsError }, { data: departments, error: departmentsError }] =
    await Promise.all([
      inflowQuery,
      outflowQuery,
      supabase.from("treasury_funds").select("id, code, name, fund_type").eq("church_id", ctx.churchId),
      supabase.from("church_departments").select("id, department_name").eq("church_id", ctx.churchId),
    ]);

  if (inflowError) throw new Error(inflowError.message);
  if (outflowError) throw new Error(outflowError.message);
  if (fundsError) throw new Error(fundsError.message);
  if (departmentsError) throw new Error(departmentsError.message);

  const fundMap = Object.fromEntries((funds ?? []).map((f: any) => [f.id, f]));
  const deptMap = Object.fromEntries((departments ?? []).map((d: any) => [d.id, d.department_name]));

  const totalIn = sumAmount(inflows ?? []);
  const totalOut = sumAmount(outflows ?? []);
  const linkedInTotal = (inflows ?? [])
    .filter((row: any) => !row.is_anonymous && row.member_id)
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

    supabase
      .from("treasury_inflows")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("is_anonymous", false)
      .not("member_id", "is", null),

    supabase
      .from("treasury_inflows")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("is_anonymous", true),

    supabase
      .from("treasury_inflows")
      .select("id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, fund_id")
      .eq("church_id", ctx.churchId)
      .order("inflow_date", { ascending: false })
      .limit(10),

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

  if (fundCountError) throw new Error(fundCountError.message);
  if (inflowSummaryError) throw new Error(inflowSummaryError.message);
  if (outflowSummaryError) throw new Error(outflowSummaryError.message);
  if (linkedInflowsCountError) throw new Error(linkedInflowsCountError.message);
  if (anonymousInflowsCountError) throw new Error(anonymousInflowsCountError.message);
  if (recentInflowsError) throw new Error(recentInflowsError.message);
  if (recentOutflowsError) throw new Error(recentOutflowsError.message);
  if (fundsError) throw new Error(fundsError.message);
  if (departmentsError) throw new Error(departmentsError.message);

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
    },
    recentInflows: recentInflows ?? [],
    recentOutflows: recentOutflows ?? [],
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
