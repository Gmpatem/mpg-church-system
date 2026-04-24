"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";
import type { TreasuryFinanceSettings } from "@/features/treasury/types";
import { TREASURY_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { getNumber, getString } from "@/lib/domain/validation";
import { isMissingColumnError, isMissingRelationError } from "@/lib/supabase/errors";
import {
  formatCurrencyLabel,
  getDepartmentLeaderProfileIds,
  getDepartmentMemberProfileIds,
  getMemberProfileId,
  insertChurchNotifications,
} from "@/features/department-finance/helpers";

/**
 * Helper to revalidate treasury-related caches for a church.
 * Uses path-based invalidation for comprehensive cache clearing.
 * Note: Tag-based invalidation can be added when upgrading to Next.js 15+ with full unstable_cache support.
 */
function revalidateTreasuryData(churchSlug: string) {
  // Path-based revalidation (existing behavior)
  revalidatePath(`/c/${churchSlug}/treasury`);
  revalidatePath(`/c/${churchSlug}/treasury/in`);
  revalidatePath(`/c/${churchSlug}/treasury/out`);
  revalidatePath(`/c/${churchSlug}/treasury/approvals`);
  revalidatePath(`/c/${churchSlug}/reports`);
}

function buildTreasuryReference(prefix: string, txDate: string) {
  const safeDate = (txDate || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const suffix = Date.now().toString().slice(-6);
  return `${prefix}-${safeDate}-${suffix}`;
}

function getPaymentMethodLabel(value: string | null) {
  if (!value) return null;
  if (value === "cash") return "Cash";
  if (value === "bank_transfer") return "Bank Transfer";
  if (value === "mobile_money") return "Mobile Money";
  if (value === "check") return "Check";
  if (value === "other") return "Other";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function mergePaymentMethodIntoNote(note: string | null, paymentMethod: string | null) {
  const paymentLabel = getPaymentMethodLabel(paymentMethod);
  if (!paymentLabel) return note;
  const paymentLine = `Payment Method: ${paymentLabel}`;
  return [paymentLine, note].filter(Boolean).join("\n");
}

function mapTreasuryWriteErrorMessage(rawMessage: string, sourceTable: "treasury_inflows" | "treasury_outflows" | "treasury_funds") {
  const message = rawMessage || "Treasury write failed.";
  const normalized = message.toLowerCase();

  if (normalized.includes("row-level security") && normalized.includes("treasury_audit_logs")) {
    return "Treasury write is blocked by treasury_audit_logs RLS. This flow relies on server-managed audit logging after the base write, so treasury_audit_logs must allow trigger-driven inserts for authorized treasury managers in the same church.";
  }

  if (normalized.includes("row-level security") && normalized.includes(sourceTable)) {
    if (sourceTable === "treasury_inflows") {
      return "Contribution entry is blocked by treasury_inflows RLS policy. Ensure insert/update policies allow active church treasury managers (church_admin, pastor, treasurer) for this church and accept recorded_by_user_id/auth.uid().";
    }
    if (sourceTable === "treasury_outflows") {
      return "Expense entry is blocked by treasury_outflows RLS policy. Ensure insert/update policies allow active church treasury managers (church_admin, pastor, treasurer) for this church and keep church_id scoped to the active church.";
    }
    return "Fund write is blocked by treasury_funds RLS policy. Ensure insert/update policies allow active church treasury managers (church_admin, pastor, treasurer) only within their church.";
  }

  return message;
}

type InflowSourceType = "member" | "department" | "anonymous" | "visitor";

function normalizeInflowSourceType(sourceTypeRaw: string, hasMember: boolean, hasDepartment: boolean, isAnonymous: boolean): InflowSourceType {
  if (sourceTypeRaw === "member" || sourceTypeRaw === "department" || sourceTypeRaw === "anonymous" || sourceTypeRaw === "visitor") {
    return sourceTypeRaw;
  }

  if (hasDepartment) return "department";
  if (hasMember && !isAnonymous) return "member";
  if (isAnonymous) return "anonymous";
  return "visitor";
}

function normalizeJoinedRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const DEFAULT_TREASURY_FINANCE_SETTINGS: TreasuryFinanceSettings = {
  tithe_auto_allocate: false,
  offering_auto_allocate: false,
  require_reference_numbers: false,
  require_member_for_named_inflows: true,
  allow_tithe_outflow_only_for_remittance: true,
  updated_at: null,
};

function boolFromUnknown(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
  }
  return fallback;
}

function parseRuleString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseRuleNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normalizePercentage(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  if (value > 0 && value <= 1) return value;
  if (value > 1 && value <= 100) return value / 100;
  return null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function getTreasuryFinanceSettings(
  supabase: any,
  churchId: string
): Promise<TreasuryFinanceSettings> {
  try {
    const { data, error } = await supabase
      .from("treasury_finance_settings")
      .select("*")
      .eq("church_id", churchId)
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_TREASURY_FINANCE_SETTINGS };
    }

    const row = data as Record<string, unknown>;
    return {
      tithe_auto_allocate: boolFromUnknown(
        row.tithe_auto_allocate,
        DEFAULT_TREASURY_FINANCE_SETTINGS.tithe_auto_allocate
      ),
      offering_auto_allocate: boolFromUnknown(
        row.offering_auto_allocate,
        DEFAULT_TREASURY_FINANCE_SETTINGS.offering_auto_allocate
      ),
      require_reference_numbers: boolFromUnknown(
        row.require_reference_numbers,
        DEFAULT_TREASURY_FINANCE_SETTINGS.require_reference_numbers
      ),
      require_member_for_named_inflows: boolFromUnknown(
        row.require_member_for_named_inflows,
        DEFAULT_TREASURY_FINANCE_SETTINGS.require_member_for_named_inflows
      ),
      allow_tithe_outflow_only_for_remittance: boolFromUnknown(
        row.allow_tithe_outflow_only_for_remittance,
        DEFAULT_TREASURY_FINANCE_SETTINGS.allow_tithe_outflow_only_for_remittance
      ),
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    };
  } catch {
    return { ...DEFAULT_TREASURY_FINANCE_SETTINGS };
  }
}

type AllocationRule = {
  id: string | null;
  source_inflow_type: "tithe" | "offering";
  allocation_kind: string;
  target_fund_id: string | null;
  allocation_ratio: number;
  priority: number;
  is_active: boolean;
  rule_name: string | null;
};

async function getAllocationRulesForInflow(
  supabase: any,
  churchId: string,
  inflowType: string
): Promise<AllocationRule[]> {
  if (inflowType !== "tithe" && inflowType !== "offering") return [];

  try {
    const { data, error } = await supabase
      .from("treasury_allocation_rules")
      .select("*")
      .eq("church_id", churchId)
      .eq("source_inflow_type", inflowType);

    if (error || !Array.isArray(data)) return [];

    const normalized = data
      .map((raw: any) => {
        const row = (raw ?? {}) as Record<string, unknown>;

        const source = parseRuleString(row, ["source_inflow_type", "inflow_type"]);
        if (source !== "tithe" && source !== "offering") return null;

        const allocation_kind =
          parseRuleString(row, ["allocation_kind", "kind"]) ?? "local_retained";
        const percentage = normalizePercentage(
          parseRuleNumber(row, [
            "allocation_percentage",
            "allocation_percent",
            "percentage",
            "ratio",
            "allocation_ratio",
            "percent",
          ])
        );

        if (!percentage) return null;

        return {
          id: parseRuleString(row, ["id", "rule_id"]),
          source_inflow_type: source,
          allocation_kind,
          target_fund_id: parseRuleString(row, [
            "target_fund_id",
            "fund_id",
            "destination_fund_id",
          ]),
          allocation_ratio: percentage,
          priority: parseRuleNumber(row, ["priority", "order_index", "sort_order"]) ?? 0,
          is_active: boolFromUnknown(row.is_active, true),
          rule_name: parseRuleString(row, ["rule_name", "name", "title", "code"]),
        } satisfies AllocationRule;
      })
      .filter((item): item is AllocationRule => Boolean(item))
      .filter((item) => item.is_active);

    normalized.sort((a, b) => a.priority - b.priority);
    return normalized;
  } catch {
    return [];
  }
}

function buildAllocationCandidates(args: {
  churchId: string;
  inflowId: string;
  userId: string;
  inflowType: string;
  rule: AllocationRule;
  allocatedAmount: number;
  allocationPercent: number;
}) {
  const { churchId, inflowId, userId, inflowType, rule, allocatedAmount, allocationPercent } = args;

  return {
    church_id: churchId,
    inflow_id: inflowId,
    treasury_inflow_id: inflowId,
    inflow_entry_id: inflowId,
    allocation_rule_id: rule.id,
    rule_id: rule.id,
    treasury_allocation_rule_id: rule.id,
    source_inflow_type: inflowType,
    allocation_kind: rule.allocation_kind,
    target_fund_id: rule.target_fund_id,
    fund_id: rule.target_fund_id,
    destination_fund_id: rule.target_fund_id,
    allocated_amount: allocatedAmount,
    allocation_amount: allocatedAmount,
    amount: allocatedAmount,
    allocation_percent: allocationPercent,
    percentage: allocationPercent,
    status: "pending",
    allocation_status: "pending",
    created_by_user_id: userId,
    recorded_by_user_id: userId,
    rule_name: rule.rule_name,
  } as Record<string, unknown>;
}

function omitEmptyFields(value: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === "") continue;
    next[key] = entry;
  }
  return next;
}

async function insertAllocationEntryWithFallback(
  supabase: any,
  candidateRow: Record<string, unknown>
) {
  const payload = { ...omitEmptyFields(candidateRow) };
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { error } = await supabase.from("treasury_inflow_allocations").insert(payload);
    if (!error) return true;

    const message = String(error.message || "");
    const missingColumnMatch =
      message.match(/column ["']([^"']+)["']/i) ||
      message.match(/Could not find the ['"]([^'"]+)['"] column/i);

    if (missingColumnMatch) {
      const column = missingColumnMatch[1];
      if (column && Object.prototype.hasOwnProperty.call(payload, column)) {
        delete payload[column];
        continue;
      }
    }

    const notNullMatch = message.match(/null value in column ["']([^"']+)["']/i);
    if (notNullMatch) {
      const column = notNullMatch[1];
      if (column === "amount" && payload.allocated_amount !== undefined) {
        payload.amount = payload.allocated_amount;
        continue;
      }
      if (column === "allocation_amount" && payload.allocated_amount !== undefined) {
        payload.allocation_amount = payload.allocated_amount;
        continue;
      }
      if (column === "status" && payload.allocation_status !== undefined) {
        payload.status = payload.allocation_status;
        continue;
      }
      if (column === "allocation_status" && payload.status !== undefined) {
        payload.allocation_status = payload.status;
        continue;
      }
    }

    console.warn("Treasury allocation insert skipped:", message);
    return false;
  }

  return false;
}

async function insertTreasuryFundWithFallback(
  supabase: any,
  candidateRow: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = { ...omitEmptyFields(candidateRow) };
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { error } = await supabase.from("treasury_funds").insert(payload);
    if (!error) return { ok: true };

    const message = String(error.message || "");
    const missingColumnMatch =
      message.match(/column ["']([^"']+)["']/i) ||
      message.match(/Could not find the ['"]([^'"]+)['"] column/i);

    if (missingColumnMatch) {
      const column = missingColumnMatch[1];
      if (column && Object.prototype.hasOwnProperty.call(payload, column)) {
        delete payload[column];
        continue;
      }
    }

    return { ok: false, error: message || "Failed to create treasury fund." };
  }

  return { ok: false, error: "Failed to create treasury fund." };
}

async function insertTreasuryInflowWithFallback(
  supabase: any,
  candidateRow: Record<string, unknown>
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const payload = { ...omitEmptyFields(candidateRow) };
  if (typeof payload.id !== "string" || payload.id.trim().length === 0) {
    payload.id = randomUUID();
  }
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { error } = await supabase.from("treasury_inflows").insert(payload);

    if (!error && typeof payload.id === "string") {
      return { ok: true, id: payload.id };
    }

    const message = String(error?.message || "");
    const missingColumnMatch =
      message.match(/column ["']([^"']+)["']/i) ||
      message.match(/Could not find the ['"]([^'"]+)['"] column/i);

    if (missingColumnMatch) {
      const column = missingColumnMatch[1];
      if (
        column === "department_id" &&
        candidateRow.department_id !== undefined &&
        candidateRow.department_id !== null &&
        String(candidateRow.department_id).trim().length > 0
      ) {
        return {
          ok: false,
          error:
            "Department-linked inflow requires treasury_inflows.department_id. Apply department finance migration before retrying.",
        };
      }
      if (column && column !== "id" && Object.prototype.hasOwnProperty.call(payload, column)) {
        delete payload[column];
        continue;
      }
    }

    return { ok: false, error: message || "Failed to create treasury inflow record." };
  }

  return { ok: false, error: "Failed to create treasury inflow record." };
}

async function createInflowAllocationsIfEnabled(args: {
  supabase: any;
  churchId: string;
  userId: string;
  inflowId: string;
  inflowType: string;
  amount: number;
  financeSettings: TreasuryFinanceSettings;
}) {
  const { supabase, churchId, userId, inflowId, inflowType, amount, financeSettings } = args;

  const shouldAllocate =
    (inflowType === "tithe" && financeSettings.tithe_auto_allocate) ||
    (inflowType === "offering" && financeSettings.offering_auto_allocate);

  if (!shouldAllocate) return;

  const rules = await getAllocationRulesForInflow(supabase, churchId, inflowType);
  if (rules.length === 0) return;

  let remaining = roundMoney(amount);

  for (const [index, rule] of rules.entries()) {
    if (remaining <= 0) break;

    let computed = roundMoney(amount * rule.allocation_ratio);
    if (index === rules.length - 1 && computed > remaining) {
      computed = remaining;
    }
    computed = Math.min(computed, remaining);

    if (computed <= 0) continue;

    const payload = buildAllocationCandidates({
      churchId,
      inflowId,
      userId,
      inflowType,
      rule,
      allocatedAmount: computed,
      allocationPercent: roundMoney(rule.allocation_ratio * 100),
    });

    await insertAllocationEntryWithFallback(supabase, payload);
    remaining = roundMoney(remaining - computed);
  }
}

async function ensureFundBelongsToChurch(supabase: any, churchId: string, fundId: string | null) {
  if (!fundId) return true;

  const { data, error } = await supabase
    .from("treasury_funds")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function getFundMeta(supabase: any, churchId: string, fundId: string | null) {
  if (!fundId) return null;

  const withDepartment = await supabase
    .from("treasury_funds")
    .select("id, code, fund_type, department_id")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (!withDepartment.error) return withDepartment.data ?? null;
  if (!isMissingColumnError(withDepartment.error, "department_id")) {
    throw new Error(withDepartment.error.message);
  }

  const legacy = await supabase
    .from("treasury_funds")
    .select("id, code, fund_type")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (legacy.error) throw new Error(legacy.error.message);
  if (!legacy.data) return null;
  return { ...legacy.data, department_id: null };
}

async function ensureDepartmentFundConsistency(params: {
  departmentId: string | null;
  fund: {
    id: string;
    fund_type: string;
    code?: string | null;
    department_id?: string | null;
  } | null;
  context: "inflow" | "outflow";
}) {
  const { departmentId, fund, context } = params;
  if (!departmentId) return { ok: true as const };
  if (!fund) {
    return {
      ok: false as const,
      error: "Selected fund was not found for this department-linked transaction.",
    };
  }

  if (fund.department_id === undefined) {
    return { ok: true as const };
  }

  if (!fund.department_id) {
    return {
      ok: false as const,
      error:
        context === "inflow"
          ? "Department-linked contributions must use a department fund."
          : "Department-linked expenses must use a department fund.",
    };
  }

  if (fund.department_id !== departmentId) {
    return {
      ok: false as const,
      error:
        context === "inflow"
          ? "Selected fund does not belong to the selected department."
          : "Selected expense fund does not belong to the selected department.",
    };
  }

  return { ok: true as const };
}

async function ensureMemberBelongsToChurch(supabase: any, churchId: string, memberId: string | null) {
  if (!memberId) return true;

  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function ensureDepartmentBelongsToChurch(supabase: any, churchId: string, departmentId: string | null) {
  if (!departmentId) return true;

  const { data, error } = await supabase
    .from("church_departments")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function getTreasuryManagerAccessDiagnostics(
  supabase: any,
  churchId: string,
  userId: string
): Promise<{ membershipOk: boolean; managerRoleOk: boolean }> {
  const { data: membership, error: membershipError } = await supabase
    .from("church_users")
    .select("id")
    .eq("church_id", churchId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("church_role_assignments")
    .select("start_date, end_date, role_definitions(code)")
    .eq("church_id", churchId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const today = new Date().toISOString().slice(0, 10);
  const managerRoleOk = (roleRows ?? []).some((row: any) => {
    const role = normalizeJoinedRow<{ code: string | null }>(row.role_definitions);
    const code = role?.code ?? null;
    if (!code || !["church_admin", "pastor", "treasurer"].includes(code)) return false;

    const startsOn = typeof row.start_date === "string" ? row.start_date : null;
    const endsOn = typeof row.end_date === "string" ? row.end_date : null;
    const startsOk = !startsOn || startsOn <= today;
    const endsOk = !endsOn || endsOn >= today;
    return startsOk && endsOk;
  });

  return {
    membershipOk: Boolean(membership),
    managerRoleOk,
  };
}

function mapInflowTypeLabel(value: string) {
  if (value === "tithe") return "Tithe";
  if (value === "offering") return "Offering";
  if (value === "donation") return "Donation";
  if (value === "special_contribution") return "Special Contribution";
  return value;
}

function mapOutflowTypeLabel(value: string) {
  if (value === "department_expense") return "Department Expense";
  if (value === "mission_remittance") return "Mission Remittance";
  if (value === "project") return "Project";
  if (value === "evangelism") return "Evangelism";
  if (value === "operations") return "Operations";
  if (value === "welfare") return "Welfare";
  if (value === "equipment") return "Equipment";
  if (value === "other") return "Other";
  return value;
}

async function notifyMemberContributionRecorded(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  inflowId: string;
  memberId: string | null;
  inflowType: string;
  amount: number;
}) {
  const { supabase, churchId, churchSlug, inflowId, memberId, inflowType, amount } = params;
  const memberProfileId = await getMemberProfileId(supabase, churchId, memberId);
  if (!memberProfileId) return;

  await insertChurchNotifications(supabase, [
    {
      church_id: churchId,
      target_user_id: memberProfileId,
      event_type: "report",
      entity_type: "treasury_inflow",
      entity_id: inflowId,
      title: "Contribution recorded",
      message: `${mapInflowTypeLabel(inflowType)} of ${formatCurrencyLabel(amount)} was recorded under your name.`,
      href: `/my/${churchSlug}?tab=giving`,
      is_read: false,
    },
  ]);
}

async function notifyDepartmentInflowRecorded(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  inflowId: string;
  departmentId: string | null;
  inflowType: string;
  amount: number;
}) {
  const { supabase, churchId, churchSlug, inflowId, departmentId, inflowType, amount } = params;
  if (!departmentId) return;

  const [memberProfileIds, leaderProfileIds] = await Promise.all([
    getDepartmentMemberProfileIds(supabase, churchId, departmentId),
    getDepartmentLeaderProfileIds(supabase, churchId, departmentId),
  ]);

  const recipients = Array.from(new Set([...memberProfileIds, ...leaderProfileIds]));
  if (recipients.length === 0) return;

  await insertChurchNotifications(
    supabase,
    recipients.map((userId) => ({
      church_id: churchId,
      target_user_id: userId,
      event_type: "report",
      entity_type: "treasury_inflow",
      entity_id: inflowId,
      title: "Department income recorded",
      message: `${mapInflowTypeLabel(inflowType)} income of ${formatCurrencyLabel(amount)} was recorded for your department.`,
      href: `/c/${churchSlug}/departments/${departmentId}?tab=finance`,
      is_read: false,
    }))
  );
}

async function notifyDepartmentOutflowRecorded(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  outflowId: string;
  departmentId: string | null;
  outflowType: string;
  amount: number;
}) {
  const { supabase, churchId, churchSlug, outflowId, departmentId, outflowType, amount } = params;
  if (!departmentId) return;

  const [memberProfileIds, leaderProfileIds] = await Promise.all([
    getDepartmentMemberProfileIds(supabase, churchId, departmentId),
    getDepartmentLeaderProfileIds(supabase, churchId, departmentId),
  ]);

  const recipients = Array.from(new Set([...memberProfileIds, ...leaderProfileIds]));
  if (recipients.length === 0) return;

  await insertChurchNotifications(
    supabase,
    recipients.map((userId) => ({
      church_id: churchId,
      target_user_id: userId,
      event_type: "report",
      entity_type: "treasury_outflow",
      entity_id: outflowId,
      title: "Department expense recorded",
      message: `${mapOutflowTypeLabel(outflowType)} expense of ${formatCurrencyLabel(amount)} was recorded for your department.`,
      href: `/c/${churchSlug}/departments/${departmentId}?tab=finance`,
      is_read: false,
    }))
  );
}

async function markDepartmentFundRequestProcessedAfterOutflow(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  requestId: string;
  outflowId: string;
  actorUserId: string;
}) {
  const { supabase, churchId, churchSlug, requestId, outflowId, actorUserId } = params;

  const { data: requestRow, error: requestError } = await supabase
    .from("department_fund_requests")
    .select("*")
    .eq("church_id", churchId)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    if (isMissingRelationError(requestError, "department_fund_requests")) {
      throw new Error(
        "Department finance requests table is missing. Apply department finance migrations before processing requests."
      );
    }
    throw new Error(requestError.message);
  }
  if (!requestRow) throw new Error("Department fund request was not found for processing.");

  const status = String(requestRow.status ?? "");
  if (!["pending", "approved"].includes(status)) {
    throw new Error("Only pending or approved requests can be processed into outflows.");
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("department_fund_requests")
    .update({
      status: "processed",
      processed_outflow_id: outflowId,
      processed_by_user_id: actorUserId,
      processed_at: nowIso,
      treasury_reviewed_by_user_id: actorUserId,
      treasury_reviewed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("church_id", churchId)
    .eq("id", requestId);

  if (updateError) throw new Error(updateError.message);

  const [memberProfileIds, leaderProfileIds] = await Promise.all([
    getDepartmentMemberProfileIds(supabase, churchId, requestRow.department_id),
    getDepartmentLeaderProfileIds(supabase, churchId, requestRow.department_id),
  ]);

  const recipients = Array.from(
    new Set(
      [
        requestRow.requested_by_user_id,
        ...memberProfileIds,
        ...leaderProfileIds,
      ].filter(Boolean)
    )
  );

  if (recipients.length === 0) return;

  await insertChurchNotifications(
    supabase,
    recipients.map((userId) => ({
      church_id: churchId,
      target_user_id: userId,
      event_type: "approval",
      entity_type: "department_fund_request",
      entity_id: requestId,
      title: "Department request processed",
      message: `${requestRow.title} has been processed into a treasury outflow.`,
      href: `/c/${churchSlug}/departments/${requestRow.department_id}?tab=finance&requestId=${requestId}`,
      is_read: false,
    }))
  );
}

export async function createTreasuryInflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();
  const financeSettings = await getTreasuryFinanceSettings(supabase, ctx.churchId);

  const inflowType = getString(formData, "inflowType");
  const fundId = getString(formData, "fundId");
  const memberIdRaw = getString(formData, "memberId") || null;
  const departmentIdRaw = getString(formData, "departmentId") || null;
  const sourceTypeRaw = getString(formData, "sourceType");
  const amount = getNumber(formData, "amount");
  const inflowDate = getString(formData, "inflowDate");
  const isAnonymousRaw = getString(formData, "isAnonymous") === "true";
  const note = getString(formData, "note") || null;
  const paymentMethod = getString(formData, "paymentMethod") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const sourceType = normalizeInflowSourceType(
    sourceTypeRaw,
    Boolean(memberIdRaw),
    Boolean(departmentIdRaw),
    isAnonymousRaw
  );
  const isAnonymous = sourceType === "anonymous" || sourceType === "visitor";
  const effectiveMemberId = sourceType === "member" ? memberIdRaw : null;
  const effectiveDepartmentId = sourceType === "department" ? departmentIdRaw : null;

  if (!inflowType || !fundId || !inflowDate || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required money-in fields." };
  }

  if (financeSettings.require_reference_numbers && !referenceNumberInput) {
    return { ok: false, error: "Reference number is required by treasury settings." };
  }

  try {
    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    if (sourceType === "member" && !memberIdRaw) {
      return { ok: false, error: "Please select a member for member-linked contributions." };
    }

    if (sourceType === "department" && !departmentIdRaw) {
      return { ok: false, error: "Please select a department for department-linked contributions." };
    }

    if (sourceType === "member" && financeSettings.require_member_for_named_inflows && !memberIdRaw) {
      return { ok: false, error: "Named inflows must be linked to a member." };
    }

    if (isAnonymousRaw && (memberIdRaw || departmentIdRaw)) {
      return { ok: false, error: "Anonymous inflows cannot have linked member or department records." };
    }

    if (!isAnonymous && !effectiveMemberId && !effectiveDepartmentId && financeSettings.require_member_for_named_inflows) {
      return { ok: false, error: "Named inflows must be linked to a member or department." };
    }

    if (effectiveMemberId && effectiveDepartmentId) {
      return { ok: false, error: "Contribution cannot be linked to both member and department in one entry." };
    }

    if (isAnonymous && (memberIdRaw || departmentIdRaw)) {
      return { ok: false, error: "Anonymous inflows cannot have a linked member or department." };
    }

    const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, effectiveMemberId);
    if (!validMember) return { ok: false, error: "Selected member does not belong to this church." };
    const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, effectiveDepartmentId);
    if (!validDepartment) return { ok: false, error: "Selected department does not belong to this church." };
    const departmentFundConsistency = await ensureDepartmentFundConsistency({
      departmentId: effectiveDepartmentId,
      fund,
      context: "inflow",
    });
    if (!departmentFundConsistency.ok) {
      return { ok: false, error: departmentFundConsistency.error };
    }

    const accessDiagnostics = await getTreasuryManagerAccessDiagnostics(
      supabase,
      ctx.churchId,
      ctx.userId
    );
    if (!accessDiagnostics.membershipOk || !accessDiagnostics.managerRoleOk) {
      return {
        ok: false,
        error: `Treasury inflow insert preflight failed (membership_ok=${accessDiagnostics.membershipOk}, manager_role_ok=${accessDiagnostics.managerRoleOk}). Ensure the acting user has active church_users membership and active church role code in church_admin, pastor, or treasurer for this church.`,
      };
    }

    if (inflowType === "tithe" && fund.fund_type !== "tithe") {
      return { ok: false, error: "Tithe must be recorded into a tithe fund." };
    }

    if (inflowType === "offering" && fund.fund_type === "tithe") {
      return { ok: false, error: "Offering cannot be recorded into a tithe fund." };
    }

    if (inflowType === "donation" && fund.fund_type === "tithe") {
      return { ok: false, error: "Donation cannot be recorded into a tithe fund." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TIN", inflowDate);
    const finalNote = mergePaymentMethodIntoNote(note, paymentMethod);

    const insertResult = await insertTreasuryInflowWithFallback(supabase, {
      church_id: ctx.churchId,
      member_id: effectiveMemberId,
      department_id: effectiveDepartmentId,
      fund_id: fundId,
      inflow_type: inflowType,
      amount,
      inflow_date: inflowDate,
      is_anonymous: isAnonymous,
      note: finalNote,
      reference_number: referenceNumber,
      recorded_by_user_id: ctx.userId,
    });

    if (!insertResult.ok) {
      return {
        ok: false,
        error: mapTreasuryWriteErrorMessage(insertResult.error, "treasury_inflows"),
      };
    }

    await createInflowAllocationsIfEnabled({
      supabase,
      churchId: ctx.churchId,
      userId: ctx.userId,
      inflowId: insertResult.id,
      inflowType,
      amount,
      financeSettings,
    });

    await Promise.all([
      notifyMemberContributionRecorded({
        supabase,
        churchId: ctx.churchId,
        churchSlug,
        inflowId: insertResult.id,
        memberId: effectiveMemberId,
        inflowType,
        amount,
      }),
      notifyDepartmentInflowRecorded({
        supabase,
        churchId: ctx.churchId,
        churchSlug,
        inflowId: insertResult.id,
        departmentId: effectiveDepartmentId,
        inflowType,
        amount,
      }),
    ]);

    revalidateTreasuryData(churchSlug);
    if (effectiveDepartmentId) {
      revalidatePath(`/c/${churchSlug}/departments/${effectiveDepartmentId}`);
    }
    return { ok: true, message: "Money-in entry recorded successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to record money-in entry.",
    };
  }
}

export async function createTreasuryOutflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();
  const financeSettings = await getTreasuryFinanceSettings(supabase, ctx.churchId);

  const outflowTypeInput = getString(formData, "outflowType");
  const fundIdInput = getString(formData, "fundId") || null;
  const departmentIdInput = getString(formData, "departmentId") || null;
  const departmentFundRequestId = getString(formData, "departmentFundRequestId") || null;
  const amountInput = getNumber(formData, "amount");
  const outflowDateInput = getString(formData, "outflowDate");
  const payeeInput = getString(formData, "payee") || null;
  const purposeInput = getString(formData, "purpose");
  const projectNameInput = getString(formData, "projectName") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const noteInput = getString(formData, "note") || null;
  const paymentMethod = getString(formData, "paymentMethod") || null;

  try {
    let requestTemplate: Record<string, any> | null = null;
    if (departmentFundRequestId) {
      const { data: requestRow, error: requestError } = await supabase
        .from("department_fund_requests")
        .select("*")
        .eq("church_id", ctx.churchId)
        .eq("id", departmentFundRequestId)
        .maybeSingle();

      if (requestError) {
        if (isMissingRelationError(requestError, "department_fund_requests")) {
          return {
            ok: false,
            error:
              "Department finance requests are not enabled yet. Apply department finance migrations and retry.",
          };
        }
        return { ok: false, error: requestError.message };
      }

      if (!requestRow) {
        return { ok: false, error: "Department fund request was not found." };
      }

      if (!["pending", "approved"].includes(String(requestRow.status))) {
        return {
          ok: false,
          error: "Only pending or approved requests can be processed into outflows.",
        };
      }

      requestTemplate = requestRow as Record<string, any>;
    }

    const outflowType = String(requestTemplate?.outflow_type || outflowTypeInput || "");
    const fundId = String(
      requestTemplate?.fund_id ||
        requestTemplate?.preferred_fund_id ||
        fundIdInput ||
        ""
    ) || null;
    const departmentId = String(
      requestTemplate?.department_id || departmentIdInput || ""
    ) || null;
    const outflowDate = String(
      requestTemplate?.outflow_date || requestTemplate?.requested_date || outflowDateInput || ""
    );
    const purpose = String(requestTemplate?.purpose || purposeInput || "");
    const payee = payeeInput || requestTemplate?.payee || null;
    const projectName = projectNameInput || requestTemplate?.project_name || null;
    const note = noteInput || requestTemplate?.note || null;
    const amount = Number.isFinite(amountInput) && amountInput > 0
      ? amountInput
      : Number(requestTemplate?.amount || NaN);

    if (!outflowType || !outflowDate || !purpose || !Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Please complete all required money-out fields." };
    }

    if (!fundId) {
      return { ok: false, error: "Money-out entries must have a fund source." };
    }

    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
    if (!validDepartment) return { ok: false, error: "Selected department does not belong to this church." };
    const departmentFundConsistency = await ensureDepartmentFundConsistency({
      departmentId,
      fund,
      context: "outflow",
    });
    if (!departmentFundConsistency.ok) {
      return { ok: false, error: departmentFundConsistency.error };
    }

    const accessDiagnostics = await getTreasuryManagerAccessDiagnostics(
      supabase,
      ctx.churchId,
      ctx.userId
    );
    if (!accessDiagnostics.membershipOk || !accessDiagnostics.managerRoleOk) {
      return {
        ok: false,
        error: `Treasury outflow insert preflight failed (membership_ok=${accessDiagnostics.membershipOk}, manager_role_ok=${accessDiagnostics.managerRoleOk}). Ensure the acting user has active church_users membership and active church role code in church_admin, pastor, or treasurer for this church.`,
      };
    }

    if (
      financeSettings.allow_tithe_outflow_only_for_remittance &&
      fund.fund_type === "tithe" &&
      outflowType !== "mission_remittance"
    ) {
      return { ok: false, error: "Tithe fund can only be used for mission remittance." };
    }

    if (departmentFundRequestId && requestTemplate) {
      if (requestTemplate.department_id && requestTemplate.department_id !== departmentId) {
        return {
          ok: false,
          error: "Outflow department must match the selected department request.",
        };
      }
    }

    const requestReference = requestTemplate?.reference_number
      ? String(requestTemplate.reference_number)
      : "";
    const referenceNumber =
      referenceNumberInput || requestReference || buildTreasuryReference("TOUT", outflowDate);
    const finalNote = mergePaymentMethodIntoNote(note, paymentMethod);

    const { data: outflowRow, error } = await supabase
      .from("treasury_outflows")
      .insert({
        church_id: ctx.churchId,
        fund_id: fundId,
        department_id: departmentId,
        outflow_type: outflowType,
        amount,
        outflow_date: outflowDate,
        payee,
        purpose,
        project_name: projectName,
        reference_number: referenceNumber,
        note: finalNote,
        recorded_by_user_id: ctx.userId,
      })
      .select("id")
      .single();

    if (error || !outflowRow?.id) {
      return {
        ok: false,
        error: mapTreasuryWriteErrorMessage(error?.message ?? "Failed to create outflow record.", "treasury_outflows"),
      };
    }

    if (departmentFundRequestId) {
      await markDepartmentFundRequestProcessedAfterOutflow({
        supabase,
        churchId: ctx.churchId,
        churchSlug,
        requestId: departmentFundRequestId,
        outflowId: outflowRow.id,
        actorUserId: ctx.userId,
      });
    }

    await notifyDepartmentOutflowRecorded({
      supabase,
      churchId: ctx.churchId,
      churchSlug,
      outflowId: outflowRow.id,
      departmentId,
      outflowType,
      amount,
    });

    revalidateTreasuryData(churchSlug);
    if (departmentId) {
      revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
    }
    return { ok: true, message: "Money-out entry recorded successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to record money-out entry.",
    };
  }
}

export async function updateTreasuryInflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const entryId = getString(formData, "entryId");
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();
  const financeSettings = await getTreasuryFinanceSettings(supabase, ctx.churchId);

  const inflowType = getString(formData, "inflowType");
  const fundId = getString(formData, "fundId");
  const memberIdRaw = getString(formData, "memberId") || null;
  const departmentIdRaw = getString(formData, "departmentId") || null;
  const sourceTypeRaw = getString(formData, "sourceType");
  const amount = getNumber(formData, "amount");
  const inflowDate = getString(formData, "inflowDate");
  const isAnonymousRaw = getString(formData, "isAnonymous") === "true";
  const note = getString(formData, "note") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const correctionNote = getString(formData, "correctionNote");
  const sourceType = normalizeInflowSourceType(
    sourceTypeRaw,
    Boolean(memberIdRaw),
    Boolean(departmentIdRaw),
    isAnonymousRaw
  );
  const isAnonymous = sourceType === "anonymous" || sourceType === "visitor";
  const effectiveMemberId = sourceType === "member" ? memberIdRaw : null;
  const effectiveDepartmentId = sourceType === "department" ? departmentIdRaw : null;

  if (!entryId || !inflowType || !fundId || !inflowDate || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required fields." };
  }

  if (financeSettings.require_reference_numbers && !referenceNumberInput) {
    return { ok: false, error: "Reference number is required by treasury settings." };
  }

  if (!correctionNote) {
    return { ok: false, error: "Correction note is required when editing a treasury entry." };
  }

  try {
    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    if (sourceType === "member" && !memberIdRaw) {
      return { ok: false, error: "Please select a member for member-linked contributions." };
    }

    if (sourceType === "department" && !departmentIdRaw) {
      return { ok: false, error: "Please select a department for department-linked contributions." };
    }

    if (!isAnonymous && !effectiveMemberId && !effectiveDepartmentId && financeSettings.require_member_for_named_inflows) {
      return { ok: false, error: "Named inflows must be linked to a member or department." };
    }

    if (effectiveMemberId && effectiveDepartmentId) {
      return { ok: false, error: "Contribution cannot be linked to both member and department in one entry." };
    }

    if (isAnonymous && (memberIdRaw || departmentIdRaw)) {
      return { ok: false, error: "Anonymous inflows cannot have a linked member or department." };
    }

    const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, effectiveMemberId);
    if (!validMember) return { ok: false, error: "Selected member does not belong to this church." };
    const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, effectiveDepartmentId);
    if (!validDepartment) return { ok: false, error: "Selected department does not belong to this church." };
    const departmentFundConsistency = await ensureDepartmentFundConsistency({
      departmentId: effectiveDepartmentId,
      fund,
      context: "inflow",
    });
    if (!departmentFundConsistency.ok) {
      return { ok: false, error: departmentFundConsistency.error };
    }

    const accessDiagnostics = await getTreasuryManagerAccessDiagnostics(
      supabase,
      ctx.churchId,
      ctx.userId
    );
    if (!accessDiagnostics.membershipOk || !accessDiagnostics.managerRoleOk) {
      return {
        ok: false,
        error: `Treasury inflow update preflight failed (membership_ok=${accessDiagnostics.membershipOk}, manager_role_ok=${accessDiagnostics.managerRoleOk}). Ensure the acting user has active church_users membership and active church role code in church_admin, pastor, or treasurer for this church.`,
      };
    }

    if (inflowType === "tithe" && fund.fund_type !== "tithe") {
      return { ok: false, error: "Tithe must be recorded into a tithe fund." };
    }

    if (inflowType === "offering" && fund.fund_type === "tithe") {
      return { ok: false, error: "Offering cannot be recorded into a tithe fund." };
    }

    if (inflowType === "donation" && fund.fund_type === "tithe") {
      return { ok: false, error: "Donation cannot be recorded into a tithe fund." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TIN", inflowDate);
    const fullNote = [note, `Correction: ${correctionNote}`].filter(Boolean).join("\n\n");

    const { error } = await supabase
      .from("treasury_inflows")
      .update({
        inflow_type: inflowType,
        fund_id: fundId,
        member_id: effectiveMemberId,
        department_id: effectiveDepartmentId,
        amount,
        inflow_date: inflowDate,
        is_anonymous: isAnonymous,
        note: fullNote,
        reference_number: referenceNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("id", entryId);

    if (error) {
      return {
        ok: false,
        error: mapTreasuryWriteErrorMessage(error.message, "treasury_inflows"),
      };
    }

    revalidateTreasuryData(churchSlug);
    revalidatePath(`/c/${churchSlug}/treasury/in/${entryId}/edit`);
    if (effectiveDepartmentId) {
      revalidatePath(`/c/${churchSlug}/departments/${effectiveDepartmentId}`);
    }

    return { ok: true, message: "Money-in entry updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update money-in entry.",
    };
  }
}

export async function updateTreasuryOutflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const entryId = getString(formData, "entryId");
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();
  const financeSettings = await getTreasuryFinanceSettings(supabase, ctx.churchId);

  const outflowType = getString(formData, "outflowType");
  const fundId = getString(formData, "fundId") || null;
  const departmentId = getString(formData, "departmentId") || null;
  const amount = getNumber(formData, "amount");
  const outflowDate = getString(formData, "outflowDate");
  const payee = getString(formData, "payee") || null;
  const purpose = getString(formData, "purpose");
  const projectName = getString(formData, "projectName") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const note = getString(formData, "note") || null;
  const correctionNote = getString(formData, "correctionNote");

  if (!entryId || !outflowType || !outflowDate || !purpose || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required fields." };
  }

  if (!correctionNote) {
    return { ok: false, error: "Correction note is required when editing a treasury entry." };
  }

  try {
    if (!fundId) {
      return { ok: false, error: "Money-out entries must have a fund source." };
    }

    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
    if (!validDepartment) return { ok: false, error: "Selected department does not belong to this church." };
    const departmentFundConsistency = await ensureDepartmentFundConsistency({
      departmentId,
      fund,
      context: "outflow",
    });
    if (!departmentFundConsistency.ok) {
      return { ok: false, error: departmentFundConsistency.error };
    }

    const accessDiagnostics = await getTreasuryManagerAccessDiagnostics(
      supabase,
      ctx.churchId,
      ctx.userId
    );
    if (!accessDiagnostics.membershipOk || !accessDiagnostics.managerRoleOk) {
      return {
        ok: false,
        error: `Treasury outflow update preflight failed (membership_ok=${accessDiagnostics.membershipOk}, manager_role_ok=${accessDiagnostics.managerRoleOk}). Ensure the acting user has active church_users membership and active church role code in church_admin, pastor, or treasurer for this church.`,
      };
    }

    if (
      financeSettings.allow_tithe_outflow_only_for_remittance &&
      fund.fund_type === "tithe" &&
      outflowType !== "mission_remittance"
    ) {
      return { ok: false, error: "Tithe fund can only be used for mission remittance." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TOUT", outflowDate);
    const fullNote = [note, `Correction: ${correctionNote}`].filter(Boolean).join("\n\n");

    const { error } = await supabase
      .from("treasury_outflows")
      .update({
        outflow_type: outflowType,
        fund_id: fundId,
        department_id: departmentId,
        amount,
        outflow_date: outflowDate,
        payee,
        purpose,
        project_name: projectName,
        reference_number: referenceNumber,
        note: fullNote,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("id", entryId);

    if (error) {
      return {
        ok: false,
        error: mapTreasuryWriteErrorMessage(error.message, "treasury_outflows"),
      };
    }

    revalidateTreasuryData(churchSlug);
    revalidatePath(`/c/${churchSlug}/treasury/out/${entryId}/edit`);
    if (departmentId) {
      revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
    }

    return { ok: true, message: "Money-out entry updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update money-out entry.",
    };
  }
}

export async function createTreasuryFundAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const code = getString(formData, "code").toLowerCase();
  const name = getString(formData, "name");
  const fundType = getString(formData, "fundType");
  const description = getString(formData, "description") || null;

  if (!code || !name || !fundType) {
    return { ok: false, error: "Code, name, and fund type are required." };
  }

  const insertResult = await insertTreasuryFundWithFallback(supabase, {
    church_id: ctx.churchId,
    code,
    name,
    fund_type: fundType,
    description,
    is_active: true,
  });

  if (!insertResult.ok) {
    return {
      ok: false,
      error: mapTreasuryWriteErrorMessage(insertResult.error, "treasury_funds"),
    };
  }

  revalidateTreasuryData(churchSlug);
  return { ok: true, message: "Treasury fund created successfully." };
}

export async function toggleTreasuryFundAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const fundId = getString(formData, "fundId");
  const nextState = getString(formData, "nextState") === "true";
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!fundId) {
    return { ok: false, error: "Fund ID is required." };
  }

  const protectedCodes = ["tithe", "local_budget"];
  const { data: fund, error: fundError } = await supabase
    .from("treasury_funds")
    .select("id, code")
    .eq("church_id", ctx.churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (fundError) return { ok: false, error: fundError.message };
  if (!fund) return { ok: false, error: "Fund not found." };

  if (protectedCodes.includes(fund.code) && nextState === false) {
    return { ok: false, error: "Core funds like tithe, offering, and local_budget cannot be deactivated." };
  }

  const { error } = await supabase
    .from("treasury_funds")
    .update({
      is_active: nextState,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", fundId);

  if (error) {
    return {
      ok: false,
      error: mapTreasuryWriteErrorMessage(error.message, "treasury_funds"),
    };
  }

  revalidateTreasuryData(churchSlug);
  return { ok: true, message: nextState ? "Fund activated." : "Fund deactivated." };
}

export async function getTreasuryFinanceSettingsAction(
  churchSlug: string
): Promise<TreasuryFinanceSettings> {
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();
  return getTreasuryFinanceSettings(supabase, ctx.churchId);
}

export async function updateTreasuryFinanceSettingsAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, TREASURY_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const titheAutoAllocate = getString(formData, "tithe_auto_allocate") === "true";
  const offeringAutoAllocate = getString(formData, "offering_auto_allocate") === "true";
  const requireReferenceNumbers = getString(formData, "require_reference_numbers") === "true";
  const requireMemberForNamedInflows = getString(formData, "require_member_for_named_inflows") === "true";
  const allowTitheOutflowOnlyForRemittance = getString(formData, "allow_tithe_outflow_only_for_remittance") === "true";

  try {
    // Try to update existing record first
    const { error: updateError } = await supabase
      .from("treasury_finance_settings")
      .update({
        tithe_auto_allocate: titheAutoAllocate,
        offering_auto_allocate: offeringAutoAllocate,
        require_reference_numbers: requireReferenceNumbers,
        require_member_for_named_inflows: requireMemberForNamedInflows,
        allow_tithe_outflow_only_for_remittance: allowTitheOutflowOnlyForRemittance,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId);

    if (updateError) {
      // If update fails (no record exists), try to insert
      const { error: insertError } = await supabase
        .from("treasury_finance_settings")
        .insert({
          church_id: ctx.churchId,
          tithe_auto_allocate: titheAutoAllocate,
          offering_auto_allocate: offeringAutoAllocate,
          require_reference_numbers: requireReferenceNumbers,
          require_member_for_named_inflows: requireMemberForNamedInflows,
          allow_tithe_outflow_only_for_remittance: allowTitheOutflowOnlyForRemittance,
        });

      if (insertError) {
        return { ok: false, error: insertError.message };
      }
    }

    revalidatePath(`/c/${churchSlug}/settings`);
    revalidatePath(`/c/${churchSlug}/treasury`);
    return { ok: true, message: "Finance settings updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update finance settings.",
    };
  }
}
