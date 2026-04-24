import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import {
  isDepartmentLeaderForUser,
  isTreasuryManagerContext,
} from "@/features/department-finance/helpers";
import { isMissingRelationError, normalizeSupabaseErrorMessage } from "@/lib/supabase/errors";
import type {
  DepartmentFinanceWorkspaceData,
  DepartmentFundRequestRecord,
  DepartmentFundRequestStatus,
} from "@/features/department-finance/types";

const INFLOW_FIELDS_WITH_DEPARTMENT =
  "id, amount, inflow_type, inflow_date, reference_number, note, member_id, department_id, fund_id, created_at";
const INFLOW_FIELDS_LEGACY =
  "id, amount, inflow_type, inflow_date, reference_number, note, member_id, fund_id, created_at";
const OUTFLOW_FIELDS_WITH_DEPARTMENT =
  "id, amount, outflow_type, outflow_date, payee, purpose, reference_number, note, department_id, fund_id, created_at";
const OUTFLOW_FIELDS_LEGACY =
  "id, amount, outflow_type, outflow_date, payee, purpose, reference_number, note, fund_id, created_at";

function isMissingColumnError(error: any, column: string) {
  const code = String(error?.code || "").toLowerCase();
  const combined = [error?.message, error?.details, error?.hint]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .join(" ");

  if (!combined.includes(column.toLowerCase())) return false;
  return (
    code === "42703" ||
    combined.includes("does not exist") ||
    combined.includes("could not find the") ||
    combined.includes("column")
  );
}

function withNullableDepartmentId<T extends Record<string, unknown>>(rows: T[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    ...row,
    department_id:
      Object.prototype.hasOwnProperty.call(row, "department_id") && row.department_id !== undefined
        ? (row.department_id as string | null)
        : null,
  }));
}

function sortByDateAndCreatedAt<T extends { created_at?: string | null }>(
  rows: T[],
  dateKey: string
) {
  return [...rows].sort((a: any, b: any) => {
    const aDate = a?.[dateKey] ? new Date(String(a[dateKey])).getTime() : 0;
    const bDate = b?.[dateKey] ? new Date(String(b[dateKey])).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;
    const aCreated = a?.created_at ? new Date(String(a.created_at)).getTime() : 0;
    const bCreated = b?.created_at ? new Date(String(b.created_at)).getTime() : 0;
    return bCreated - aCreated;
  });
}

function dedupeById<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!map.has(row.id)) map.set(row.id, row);
  }
  return Array.from(map.values());
}

function toMoney(value: unknown) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return 0;
  return num;
}

function pickProfileLabel(profile: { full_name?: string | null; email?: string | null } | null | undefined) {
  if (!profile) return "Unknown user";
  return profile.full_name || profile.email || "Unknown user";
}

function summarizeRequests(rows: DepartmentFundRequestRecord[]) {
  const summary = {
    pending: 0,
    approved: 0,
    rejected: 0,
    processed: 0,
    cancelled: 0,
  };

  for (const row of rows) {
    if (row.status === "pending") summary.pending += 1;
    if (row.status === "approved") summary.approved += 1;
    if (row.status === "rejected") summary.rejected += 1;
    if (row.status === "processed") summary.processed += 1;
    if (row.status === "cancelled") summary.cancelled += 1;
  }

  return summary;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

async function fetchDepartmentFundsForWorkspace(supabase: any, churchId: string) {
  const withDepartment = await supabase
    .from("treasury_funds")
    .select("id, name, code, fund_type, is_active, department_id")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!withDepartment.error) {
    return {
      rows: withNullableDepartmentId(withDepartment.data as unknown as Record<string, unknown>[]),
      hasDepartmentColumn: true,
    };
  }

  if (!isMissingColumnError(withDepartment.error, "department_id")) {
    throw new Error(
      normalizeSupabaseErrorMessage(
        withDepartment.error,
        "Failed to load treasury funds for department finance."
      )
    );
  }

  const legacy = await supabase
    .from("treasury_funds")
    .select("id, name, code, fund_type, is_active")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (legacy.error) {
    throw new Error(
      normalizeSupabaseErrorMessage(
        legacy.error,
        "Failed to load treasury funds for department finance."
      )
    );
  }

  return {
    rows: withNullableDepartmentId(legacy.data as unknown as Record<string, unknown>[]),
    hasDepartmentColumn: false,
  };
}

async function fetchDepartmentInflowsForWorkspace(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  departmentFundIds: string[];
}) {
  const { supabase, churchId, departmentId, departmentFundIds } = params;
  const rows: any[] = [];
  let hasDepartmentColumn = true;

  const byDepartment = await supabase
    .from("treasury_inflows")
    .select(INFLOW_FIELDS_WITH_DEPARTMENT)
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .order("inflow_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);

  if (!byDepartment.error) {
    rows.push(...withNullableDepartmentId(byDepartment.data as unknown as Record<string, unknown>[]));
  } else if (isMissingColumnError(byDepartment.error, "department_id")) {
    hasDepartmentColumn = false;
  } else {
    throw new Error(
      normalizeSupabaseErrorMessage(
        byDepartment.error,
        "Failed to load department-linked inflows."
      )
    );
  }

  if (departmentFundIds.length > 0) {
    const byFund = await supabase
      .from("treasury_inflows")
      .select(hasDepartmentColumn ? INFLOW_FIELDS_WITH_DEPARTMENT : INFLOW_FIELDS_LEGACY)
      .eq("church_id", churchId)
      .in("fund_id", departmentFundIds)
      .order("inflow_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80);

    if (!byFund.error) {
      rows.push(...withNullableDepartmentId(byFund.data as unknown as Record<string, unknown>[]));
    } else if (
      hasDepartmentColumn &&
      isMissingColumnError(byFund.error, "department_id")
    ) {
      const byFundLegacy = await supabase
        .from("treasury_inflows")
        .select(INFLOW_FIELDS_LEGACY)
        .eq("church_id", churchId)
        .in("fund_id", departmentFundIds)
        .order("inflow_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(80);

      if (byFundLegacy.error) {
        throw new Error(
          normalizeSupabaseErrorMessage(
            byFundLegacy.error,
            "Failed to load department-linked inflows."
          )
        );
      }
      rows.push(
        ...withNullableDepartmentId(byFundLegacy.data as unknown as Record<string, unknown>[])
      );
    } else {
      throw new Error(
        normalizeSupabaseErrorMessage(
          byFund.error,
          "Failed to load department-linked inflows."
        )
      );
    }
  }

  return sortByDateAndCreatedAt(dedupeById(rows), "inflow_date").slice(0, 50);
}

async function fetchDepartmentOutflowsForWorkspace(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  departmentFundIds: string[];
}) {
  const { supabase, churchId, departmentId, departmentFundIds } = params;
  const rows: any[] = [];
  let hasDepartmentColumn = true;

  const byDepartment = await supabase
    .from("treasury_outflows")
    .select(OUTFLOW_FIELDS_WITH_DEPARTMENT)
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .order("outflow_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);

  if (!byDepartment.error) {
    rows.push(...withNullableDepartmentId(byDepartment.data as unknown as Record<string, unknown>[]));
  } else if (isMissingColumnError(byDepartment.error, "department_id")) {
    hasDepartmentColumn = false;
  } else {
    throw new Error(
      normalizeSupabaseErrorMessage(
        byDepartment.error,
        "Failed to load department-linked outflows."
      )
    );
  }

  if (departmentFundIds.length > 0) {
    const byFund = await supabase
      .from("treasury_outflows")
      .select(hasDepartmentColumn ? OUTFLOW_FIELDS_WITH_DEPARTMENT : OUTFLOW_FIELDS_LEGACY)
      .eq("church_id", churchId)
      .in("fund_id", departmentFundIds)
      .order("outflow_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80);

    if (!byFund.error) {
      rows.push(...withNullableDepartmentId(byFund.data as unknown as Record<string, unknown>[]));
    } else if (
      hasDepartmentColumn &&
      isMissingColumnError(byFund.error, "department_id")
    ) {
      const byFundLegacy = await supabase
        .from("treasury_outflows")
        .select(OUTFLOW_FIELDS_LEGACY)
        .eq("church_id", churchId)
        .in("fund_id", departmentFundIds)
        .order("outflow_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(80);

      if (byFundLegacy.error) {
        throw new Error(
          normalizeSupabaseErrorMessage(
            byFundLegacy.error,
            "Failed to load department-linked outflows."
          )
        );
      }
      rows.push(
        ...withNullableDepartmentId(byFundLegacy.data as unknown as Record<string, unknown>[])
      );
    } else {
      throw new Error(
        normalizeSupabaseErrorMessage(
          byFund.error,
          "Failed to load department-linked outflows."
        )
      );
    }
  }

  return sortByDateAndCreatedAt(dedupeById(rows), "outflow_date").slice(0, 50);
}

async function fetchDepartmentFundRequestsForWorkspace(
  supabase: any,
  churchId: string,
  departmentId: string
) {
  const { data, error } = await supabase
    .from("department_fund_requests")
    .select("*")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!error) {
    return (data ?? []) as DepartmentFundRequestRecord[];
  }

  if (isMissingRelationError(error, "department_fund_requests")) {
    return [];
  }

  throw new Error(
    normalizeSupabaseErrorMessage(
      error,
      "Failed to load department fund requests."
    )
  );
}

export async function getDepartmentFinanceWorkspaceData(
  churchSlug: string,
  departmentId: string
): Promise<DepartmentFinanceWorkspaceData | null> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: department, error: departmentError } = await supabase
    .from("church_departments")
    .select("id, church_id, department_name, code, is_active")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (departmentError) throw new Error(departmentError.message);
  if (!department) return null;

  const [isDepartmentLeader, fundsResult] = await Promise.all([
    isDepartmentLeaderForUser({
      supabase,
      churchId: ctx.churchId,
      userId: ctx.userId,
      departmentId,
    }),
    fetchDepartmentFundsForWorkspace(supabase, ctx.churchId),
  ]);

  const funds = fundsResult.rows as Array<{
    id: string;
    name: string;
    code: string;
    fund_type: string;
    department_id: string | null;
    is_active?: boolean;
  }>;
  const departmentFundIds = funds
    .filter((row) => row.department_id === departmentId)
    .map((row) => row.id);
  const hasDepartmentDefaultFunds = departmentFundIds.length > 0;
  const requestEligibleFunds = hasDepartmentDefaultFunds
    ? funds.filter((row) => row.department_id === departmentId)
    : funds;

  const [inflows, outflows, requests] = await Promise.all([
    fetchDepartmentInflowsForWorkspace({
      supabase,
      churchId: ctx.churchId,
      departmentId,
      departmentFundIds,
    }),
    fetchDepartmentOutflowsForWorkspace({
      supabase,
      churchId: ctx.churchId,
      departmentId,
      departmentFundIds,
    }),
    fetchDepartmentFundRequestsForWorkspace(supabase, ctx.churchId, departmentId),
  ]);

  const memberIds = Array.from(
    new Set(inflows.map((row: any) => row.member_id).filter(Boolean))
  );
  const requestedByUserIds = Array.from(
    new Set(requests.map((row) => row.requested_by_user_id).filter(Boolean))
  );
  const reviewedByUserIds = Array.from(
    new Set(requests.map((row) => row.treasury_reviewed_by_user_id).filter(Boolean))
  );
  const profileIds = Array.from(new Set([...requestedByUserIds, ...reviewedByUserIds]));

  const [memberResult, profileResult] = await Promise.all([
    memberIds.length > 0
      ? supabase
          .from("members")
          .select("id, first_name, last_name, display_name")
          .eq("church_id", ctx.churchId)
          .in("id", memberIds)
      : Promise.resolve({ data: [], error: null as any }),
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null as any }),
  ]);

  if (memberResult.error) throw new Error(memberResult.error.message);
  if (profileResult.error) throw new Error(profileResult.error.message);

  const memberNameById = new Map(
    (memberResult.data ?? []).map((row: any) => {
      const name =
        row.display_name ||
        [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
        row.id;
      return [row.id, name];
    })
  );

  const profileById = new Map(
    (profileResult.data ?? []).map((row: any) => [row.id, row])
  );
  const fundById = new Map(funds.map((row: any) => [row.id, row]));

  const totalIncome = inflows.reduce((sum: number, row: any) => sum + toMoney(row.amount), 0);
  const totalExpenses = outflows.reduce((sum: number, row: any) => sum + toMoney(row.amount), 0);

  const transactions = [
    ...inflows.map((row: any) => ({
      id: `inflow-${row.id}`,
      kind: "inflow" as const,
      amount: toMoney(row.amount),
      date: String(row.inflow_date ?? ""),
      category: row.inflow_type ?? "inflow",
      referenceNumber: row.reference_number ?? null,
      note: row.note ?? null,
      memberName: row.member_id ? memberNameById.get(row.member_id) ?? null : null,
      payee: null,
      created_at: row.created_at ?? null,
    })),
    ...outflows.map((row: any) => ({
      id: `outflow-${row.id}`,
      kind: "outflow" as const,
      amount: toMoney(row.amount),
      date: String(row.outflow_date ?? ""),
      category: row.outflow_type ?? "outflow",
      referenceNumber: row.reference_number ?? null,
      note: row.note ?? row.purpose ?? null,
      memberName: null,
      payee: row.payee ?? null,
      created_at: row.created_at ?? null,
    })),
  ]
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 40)
    .map(({ created_at: _createdAt, ...rest }) => rest);

  const canReviewRequests = isTreasuryManagerContext(ctx.roles, ctx.isPlatformAdmin);
  const canSubmitRequests = isDepartmentLeader;

  return {
    department: {
      id: department.id,
      church_id: department.church_id,
      department_name: department.department_name,
      code: department.code,
      is_active: department.is_active,
    },
    totals: {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    },
    transactions,
    requests: requests.map((row) => ({
      ...row,
      amount: toMoney(row.amount),
      requested_by_label: pickProfileLabel(profileById.get(row.requested_by_user_id) ?? null),
      reviewed_by_label: row.treasury_reviewed_by_user_id
        ? pickProfileLabel(profileById.get(row.treasury_reviewed_by_user_id) ?? null)
        : null,
      preferred_fund_label: (row.fund_id || row.preferred_fund_id)
        ? fundById.get(row.fund_id || row.preferred_fund_id || "")?.name ?? null
        : null,
    })),
    requestSummary: summarizeRequests(requests),
    financeOptions: {
      funds: requestEligibleFunds.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        fund_type: row.fund_type,
        department_id: row.department_id ?? null,
        is_department_default: row.department_id === departmentId,
      })),
    },
    permissions: {
      canSubmitRequests,
      canReviewRequests,
      canProcessRequests: canReviewRequests,
      isDepartmentLeader,
    },
  };
}

export async function getDepartmentFundRequestForOutflowPrefill(
  churchSlug: string,
  requestId: string
) {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "treasurer"]);
  const hasTreasuryRole = ctx.roles.some((role) =>
    ["church_admin", "pastor", "treasurer"].includes(role)
  );
  if (!hasTreasuryRole) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("department_fund_requests")
    .select("*")
    .eq("church_id", ctx.churchId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error, "department_fund_requests")) return null;
    throw new Error(
      normalizeSupabaseErrorMessage(
        error,
        "Failed to load department fund request for treasury outflow prefill."
      )
    );
  }
  if (!data) return null;

  const request = data as DepartmentFundRequestRecord;
  const allowedStatuses: DepartmentFundRequestStatus[] = ["pending", "approved"];
  if (!allowedStatuses.includes(request.status)) return null;

  return request;
}

export async function getTreasuryDepartmentFundRequestsWorkspaceData(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "treasurer"]);
  const supabase = await createClient();

  const status = pickSingle(rawFilters?.status);
  const q = pickSingle(rawFilters?.q);

  let query = supabase
    .from("department_fund_requests")
    .select("*")
    .eq("church_id", ctx.churchId)
    .order("created_at", { ascending: false });

  if (status && ["pending", "approved", "rejected", "processed", "cancelled"].includes(status)) {
    query = query.eq("status", status);
  }

  if (q) {
    const safe = q.replace(/,/g, " ");
    query = query.or(
      [
        `title.ilike.%${safe}%`,
        `purpose.ilike.%${safe}%`,
        `payee.ilike.%${safe}%`,
        `reference_number.ilike.%${safe}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error, "department_fund_requests")) {
      return {
        rows: [],
        summary: {
          pending: 0,
          approved: 0,
          rejected: 0,
          processed: 0,
          cancelled: 0,
        },
      };
    }
    throw new Error(
      normalizeSupabaseErrorMessage(
        error,
        "Failed to load department finance requests for treasury."
      )
    );
  }

  const rows = (data ?? []) as DepartmentFundRequestRecord[];
  const summary = summarizeRequests(rows);

  const departmentIds = Array.from(new Set(rows.map((row) => row.department_id).filter(Boolean)));
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.requested_by_user_id, row.treasury_reviewed_by_user_id])
        .filter(Boolean)
    )
  );
  const fundIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.fund_id, row.preferred_fund_id])
        .filter(Boolean)
    )
  );

  const [departmentsResult, profilesResult, fundsResult] = await Promise.all([
    departmentIds.length > 0
      ? supabase
          .from("church_departments")
          .select("id, department_name")
          .eq("church_id", ctx.churchId)
          .in("id", departmentIds)
      : Promise.resolve({ data: [], error: null as any }),
    userIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [], error: null as any }),
    fundIds.length > 0
      ? supabase
          .from("treasury_funds")
          .select("id, name, code")
          .eq("church_id", ctx.churchId)
          .in("id", fundIds)
      : Promise.resolve({ data: [], error: null as any }),
  ]);

  if (departmentsResult.error) throw new Error(departmentsResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (fundsResult.error) throw new Error(fundsResult.error.message);

  const departmentNameById = new Map(
    (departmentsResult.data ?? []).map((row: any) => [row.id, row.department_name])
  );
  const profileById = new Map(
    (profilesResult.data ?? []).map((row: any) => [row.id, row])
  );
  const fundById = new Map((fundsResult.data ?? []).map((row: any) => [row.id, row]));

  return {
    rows: rows.map((row) => ({
      ...row,
      amount: toMoney(row.amount),
      department_name: departmentNameById.get(row.department_id) ?? "Unknown department",
      requested_by_label: pickProfileLabel(profileById.get(row.requested_by_user_id) ?? null),
      reviewed_by_label: row.treasury_reviewed_by_user_id
        ? pickProfileLabel(profileById.get(row.treasury_reviewed_by_user_id) ?? null)
        : null,
      fund_label: (() => {
        const fundId = row.fund_id || row.preferred_fund_id;
        if (!fundId) return "No fund";
        return fundById.get(fundId)?.name ?? "Unknown fund";
      })(),
      outflow_date_effective: row.outflow_date || row.requested_date,
    })),
    summary,
  };
}
