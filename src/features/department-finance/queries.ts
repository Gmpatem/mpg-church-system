import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import {
  canSubmitDepartmentFundRequests,
  isDepartmentLeaderForUser,
  isTreasuryManagerContext,
} from "@/features/department-finance/helpers";
import type {
  DepartmentFinanceWorkspaceData,
  DepartmentFundRequestRecord,
  DepartmentFundRequestStatus,
} from "@/features/department-finance/types";

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

  const [isDepartmentLeader, inflowsResult, outflowsResult, requestsResult, fundsResult] =
    await Promise.all([
      isDepartmentLeaderForUser({
        supabase,
        churchId: ctx.churchId,
        userId: ctx.userId,
        departmentId,
      }),
      supabase
        .from("treasury_inflows")
        .select(
          "id, amount, inflow_type, inflow_date, reference_number, note, member_id, department_id, created_at"
        )
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .order("inflow_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("treasury_outflows")
        .select(
          "id, amount, outflow_type, outflow_date, payee, purpose, reference_number, note, department_id, created_at"
        )
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .order("outflow_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("department_fund_requests")
        .select("*")
        .eq("church_id", ctx.churchId)
        .eq("department_id", departmentId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("treasury_funds")
        .select("id, name, code, fund_type")
        .eq("church_id", ctx.churchId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  if (inflowsResult.error) throw new Error(inflowsResult.error.message);
  if (outflowsResult.error) throw new Error(outflowsResult.error.message);
  if (requestsResult.error) throw new Error(requestsResult.error.message);
  if (fundsResult.error) throw new Error(fundsResult.error.message);

  const inflows = inflowsResult.data ?? [];
  const outflows = outflowsResult.data ?? [];
  const requests = (requestsResult.data ?? []) as DepartmentFundRequestRecord[];
  const funds = fundsResult.data ?? [];

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
  const canSubmitRequests =
    isDepartmentLeader || canSubmitDepartmentFundRequests(ctx.roles, ctx.isPlatformAdmin);

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
      preferred_fund_label: row.preferred_fund_id
        ? fundById.get(row.preferred_fund_id)?.name ?? null
        : null,
    })),
    requestSummary: summarizeRequests(requests),
    financeOptions: {
      funds: funds.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        fund_type: row.fund_type,
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

  if (error) throw new Error(error.message);
  if (!data) return null;

  const request = data as DepartmentFundRequestRecord;
  const allowedStatuses: DepartmentFundRequestStatus[] = ["pending", "approved"];
  if (!allowedStatuses.includes(request.status)) return null;

  return request;
}
