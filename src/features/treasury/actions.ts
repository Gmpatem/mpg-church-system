"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";
import type { TreasuryFinanceSettings } from "@/features/treasury/types";

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
  revalidatePath(`/c/${churchSlug}/reports`);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : NaN;
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
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from("treasury_inflows")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (!error && data?.id) return { ok: true, id: data.id };

    const message = String(error?.message || "");
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

  const { data, error } = await supabase
    .from("treasury_funds")
    .select("id, code, fund_type")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
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

export async function createTreasuryInflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();
  const financeSettings = await getTreasuryFinanceSettings(supabase, ctx.churchId);

  const inflowType = getString(formData, "inflowType");
  const fundId = getString(formData, "fundId");
  const memberId = getString(formData, "memberId") || null;
  const amount = getNumber(formData, "amount");
  const inflowDate = getString(formData, "inflowDate");
  const isAnonymous = getString(formData, "isAnonymous") === "true";
  const note = getString(formData, "note") || null;
  const paymentMethod = getString(formData, "paymentMethod") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");

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

    if (!isAnonymous && !memberId && financeSettings.require_member_for_named_inflows) {
      return { ok: false, error: "Named inflows must be linked to a member." };
    }

    if (isAnonymous && memberId) {
      return { ok: false, error: "Anonymous inflows cannot have a linked member." };
    }

    const effectiveMemberId = isAnonymous ? null : memberId;
    const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, effectiveMemberId);
    if (!validMember) return { ok: false, error: "Selected member does not belong to this church." };

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
      fund_id: fundId,
      inflow_type: inflowType,
      amount,
      inflow_date: inflowDate,
      is_anonymous: isAnonymous,
      note: finalNote,
      reference_number: referenceNumber,
      recorded_by_user_id: ctx.userId,
      created_by_user_id: ctx.userId,
      entered_by_user_id: ctx.userId,
    });

    if (!insertResult.ok) {
      const normalized = insertResult.error.toLowerCase();
      if (
        normalized.includes("row-level security") &&
        normalized.includes("treasury_inflows")
      ) {
        return {
          ok: false,
          error:
            "Contribution entry is blocked by treasury_inflows RLS policy. Ensure insert policy allows active church treasury managers (church_admin, pastor, treasurer) for this church and accepts recorded_by_user_id/auth.uid().",
        };
      }
      return { ok: false, error: insertResult.error };
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

    revalidateTreasuryData(churchSlug);
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
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
  const paymentMethod = getString(formData, "paymentMethod") || null;

  if (!outflowType || !outflowDate || !purpose || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required money-out fields." };
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

    if (
      financeSettings.allow_tithe_outflow_only_for_remittance &&
      fund.fund_type === "tithe" &&
      outflowType !== "mission_remittance"
    ) {
      return { ok: false, error: "Tithe fund can only be used for mission remittance." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TOUT", outflowDate);
    const finalNote = mergePaymentMethodIntoNote(note, paymentMethod);

    const { error } = await supabase.from("treasury_outflows").insert({
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
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();
  const financeSettings = await getTreasuryFinanceSettings(supabase, ctx.churchId);

  const inflowType = getString(formData, "inflowType");
  const fundId = getString(formData, "fundId");
  const memberId = getString(formData, "memberId") || null;
  const amount = getNumber(formData, "amount");
  const inflowDate = getString(formData, "inflowDate");
  const isAnonymous = getString(formData, "isAnonymous") === "true";
  const note = getString(formData, "note") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const correctionNote = getString(formData, "correctionNote");

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

    if (!isAnonymous && !memberId && financeSettings.require_member_for_named_inflows) {
      return { ok: false, error: "Named inflows must be linked to a member." };
    }

    if (isAnonymous && memberId) {
      return { ok: false, error: "Anonymous inflows cannot have a linked member." };
    }

    const effectiveMemberId = isAnonymous ? null : memberId;
    const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, effectiveMemberId);
    if (!validMember) return { ok: false, error: "Selected member does not belong to this church." };

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
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
    revalidatePath(`/c/${churchSlug}/treasury/in/${entryId}/edit`);

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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
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
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
    revalidatePath(`/c/${churchSlug}/treasury/out/${entryId}/edit`);

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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
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
    const normalized = insertResult.error.toLowerCase();
    if (normalized.includes("row-level security")) {
      return {
        ok: false,
        error:
          "Fund creation is blocked by treasury_funds RLS policy. Apply the treasury_funds manager insert policy so church_admin, pastor, and treasurer can create funds for their church.",
      };
    }
    return { ok: false, error: insertResult.error };
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
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
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

  if (error) return { ok: false, error: error.message };

  revalidateTreasuryData(churchSlug);
  return { ok: true, message: nextState ? "Fund activated." : "Fund deactivated." };
}

export async function getTreasuryFinanceSettingsAction(
  churchSlug: string
): Promise<TreasuryFinanceSettings> {
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();
  return getTreasuryFinanceSettings(supabase, ctx.churchId);
}

export async function updateTreasuryFinanceSettingsAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
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
