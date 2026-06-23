import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type {
  TreasuryAllocationPreviewEntry,
  TreasuryFinanceSettings,
  TreasuryRemittanceSettings,
} from "@/features/treasury/types";
import {
  isMissingRelationError,
  normalizeSupabaseErrorMessage,
} from "@/lib/supabase/errors";

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function sumAmount(rows: any[]) {
  return (rows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
}

const TREASURY_ALLOWED_ROLES = ["church_admin", "treasurer", "pastor"] as const;
const TREASURY_TRANSFER_ALLOWED_ROLES = new Set([
  "church_admin",
  "treasurer",
  "pastor",
]);
const TREASURY_INFLOWS_DEPARTMENT_COLUMN = "department_id";
const TREASURY_DEPARTMENT_MIGRATION_REQUIRED_MESSAGE =
  "Department-linked treasury inflows require the department finance alignment migration (database/rls/20260419_department_finance_alignment_and_auto_setup.sql).";

const DEFAULT_TREASURY_FINANCE_SETTINGS: TreasuryFinanceSettings = {
  tithe_auto_allocate: false,
  offering_auto_allocate: false,
  require_reference_numbers: false,
  require_member_for_named_inflows: true,
  allow_tithe_outflow_only_for_remittance: true,
  updated_at: null,
};

const DEFAULT_TREASURY_REMITTANCE_SETTINGS: TreasuryRemittanceSettings = {
  is_enabled: false,
  is_live: false,
  tithe_enabled: true,
  tithe_percentage: 100,
  offering_enabled: false,
  offering_percentage: 100,
  source_type: "tithe",
  percentage: 100,
  fixed_amount: null,
  destination: "conference",
  frequency: "manual",
  mode: "auto_create",
  allow_override: true,
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

function toNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeRemittanceSourceType(value: unknown): TreasuryRemittanceSettings["source_type"] {
  const source = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (source === "tithe" || source === "offering" || source === "both") return source;
  return DEFAULT_TREASURY_REMITTANCE_SETTINGS.source_type;
}

function normalizeRemittanceDestination(value: unknown): TreasuryRemittanceSettings["destination"] {
  const destination = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (destination === "conference" || destination === "mission" || destination === "union") return destination;
  return DEFAULT_TREASURY_REMITTANCE_SETTINGS.destination;
}

function normalizeRemittanceFrequency(value: unknown): TreasuryRemittanceSettings["frequency"] {
  const frequency = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (frequency === "daily" || frequency === "weekly" || frequency === "monthly" || frequency === "manual") {
    return frequency;
  }
  return DEFAULT_TREASURY_REMITTANCE_SETTINGS.frequency;
}

function normalizeRemittanceMode(value: unknown): TreasuryRemittanceSettings["mode"] {
  const mode = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (mode === "auto_create" || mode === "auto_process") return mode;
  return DEFAULT_TREASURY_REMITTANCE_SETTINGS.mode;
}

function withNullableDepartmentId<T extends object>(
  rows: T[] | null | undefined
): Array<T & { department_id: string | null }> {
  return (rows ?? []).map((row) => ({
    ...row,
    department_id:
      Object.prototype.hasOwnProperty.call(row, TREASURY_INFLOWS_DEPARTMENT_COLUMN) &&
      (row as any)[TREASURY_INFLOWS_DEPARTMENT_COLUMN] !== undefined
        ? ((row as any)[TREASURY_INFLOWS_DEPARTMENT_COLUMN] as string | null)
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
      "id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, department_id, fund_id, recorded_by_user_id, created_at"
    )
    .eq("church_id", churchId)
    .order("inflow_date", { ascending: false })
    .order("created_at", { ascending: false })
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
      "id, inflow_type, amount, inflow_date, is_anonymous, note, reference_number, member_id, fund_id, recorded_by_user_id, created_at"
    )
    .eq("church_id", churchId)
    .order("inflow_date", { ascending: false })
    .order("created_at", { ascending: false })
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

function normalizeRemittanceSettings(
  row: Record<string, unknown> | null
): TreasuryRemittanceSettings {
  if (!row) return { ...DEFAULT_TREASURY_REMITTANCE_SETTINGS };

  const legacySourceType = normalizeRemittanceSourceType(row.source_type);
  const legacyPercentage = Math.max(
    0,
    Math.min(
      100,
      toNumber(row.percentage, DEFAULT_TREASURY_REMITTANCE_SETTINGS.percentage)
    )
  );

  return {
    is_enabled: toBoolean(
      row.is_enabled,
      DEFAULT_TREASURY_REMITTANCE_SETTINGS.is_enabled
    ),
    is_live: toBoolean(
      row.is_live,
      DEFAULT_TREASURY_REMITTANCE_SETTINGS.is_live
    ),
    tithe_enabled: toBoolean(
      row.tithe_enabled,
      legacySourceType === "tithe" || legacySourceType === "both"
    ),
    tithe_percentage: Math.max(
      0,
      Math.min(100, toNumber(row.tithe_percentage, legacyPercentage))
    ),
    offering_enabled: toBoolean(
      row.offering_enabled,
      legacySourceType === "offering" || legacySourceType === "both"
    ),
    offering_percentage: Math.max(
      0,
      Math.min(100, toNumber(row.offering_percentage, legacyPercentage))
    ),
    source_type: legacySourceType,
    percentage: legacyPercentage,
    fixed_amount:
      row.fixed_amount === null || row.fixed_amount === undefined
        ? null
        : Math.max(0, toNumber(row.fixed_amount, 0)),
    destination: normalizeRemittanceDestination(row.destination),
    frequency: normalizeRemittanceFrequency(row.frequency),
    mode: normalizeRemittanceMode(row.mode),
    allow_override: toBoolean(
      row.allow_override,
      DEFAULT_TREASURY_REMITTANCE_SETTINGS.allow_override
    ),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

type RemittanceSettingsLoadResult = {
  settings: TreasuryRemittanceSettings;
  migrationRequired: boolean;
};

async function fetchTreasuryRemittanceSettingsRaw(
  supabase: any,
  churchId: string
): Promise<RemittanceSettingsLoadResult> {
  try {
    const { data, error } = await supabase
      .from("treasury_remittance_settings")
      .select("*")
      .eq("church_id", churchId)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error, "treasury_remittance_settings")) {
        return {
          settings: { ...DEFAULT_TREASURY_REMITTANCE_SETTINGS },
          migrationRequired: true,
        };
      }
      return {
        settings: { ...DEFAULT_TREASURY_REMITTANCE_SETTINGS },
        migrationRequired: false,
      };
    }

    return {
      settings: normalizeRemittanceSettings(
        (data ?? null) as Record<string, unknown> | null
      ),
      migrationRequired: false,
    };
  } catch {
    return {
      settings: { ...DEFAULT_TREASURY_REMITTANCE_SETTINGS },
      migrationRequired: false,
    };
  }
}

function getNextExpectedRemittanceDate(
  frequency: TreasuryRemittanceSettings["frequency"],
  lastRunDate: string | null
) {
  if (frequency === "manual") return null;

  const base = lastRunDate ? new Date(`${lastRunDate}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  if (frequency === "daily") {
    base.setDate(base.getDate() + 1);
  } else if (frequency === "weekly") {
    base.setDate(base.getDate() + 7);
  } else if (frequency === "monthly") {
    base.setMonth(base.getMonth() + 1);
  }

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function getPendingRemittanceAmountRaw(
  supabase: any,
  churchId: string,
  settings: TreasuryRemittanceSettings
) {
  if (!settings.is_enabled) return 0;

  const activeRules = [
    {
      inflow_type: "tithe" as const,
      enabled: settings.tithe_enabled,
      percentage: settings.tithe_percentage,
    },
    {
      inflow_type: "offering" as const,
      enabled: settings.offering_enabled,
      percentage: settings.offering_percentage,
    },
  ]
    .filter((rule) => rule.enabled)
    .map((rule) => ({
      inflow_type: rule.inflow_type,
      percentage: Math.max(0, Math.min(100, Number(rule.percentage || 0))),
    }))
    .filter((rule) => rule.percentage > 0);

  if (activeRules.length === 0) return 0;

  const sourceTypes = activeRules.map((rule) => rule.inflow_type);
  const { data: inflowRows, error: inflowError } = await supabase
    .from("treasury_inflows")
    .select("id, fund_id, inflow_type, amount")
    .eq("church_id", churchId)
    .in("inflow_type", sourceTypes);

  if (inflowError || !Array.isArray(inflowRows) || inflowRows.length === 0) {
    return 0;
  }

  const inflowIds = inflowRows.map((row: any) => String(row.id || "")).filter(Boolean);
  const { data: remittedRows, error: remittedError } = await supabase
    .from("treasury_inflow_allocations")
    .select("source_inflow_id, amount, status")
    .eq("church_id", churchId)
    .eq("allocation_kind", "mission_remittance")
    .in("source_inflow_id", inflowIds);

  if (remittedError && !isMissingRelationError(remittedError, "treasury_inflow_allocations")) {
    return 0;
  }

  const remittedByInflowId = new Map<string, number>();
  for (const row of remittedRows ?? []) {
    const inflowId = String((row as any).source_inflow_id || "");
    if (!inflowId) continue;
    const status = String((row as any).status || "").toLowerCase();
    if (status === "failed" || status === "cancelled" || status === "voided") continue;
    const amount = Number((row as any).amount || 0);
    remittedByInflowId.set(
      inflowId,
      roundMoney((remittedByInflowId.get(inflowId) ?? 0) + amount)
    );
  }

  const percentageByType = new Map<"tithe" | "offering", number>(
    activeRules.map((rule) => [rule.inflow_type, rule.percentage] as const)
  );

  const inflowById = new Map<
    string,
    { fund_id: string; inflow_type: "tithe" | "offering"; amount: number }
  >();
  for (const row of inflowRows) {
    const inflowId = String((row as any).id || "");
    const inflowType = String((row as any).inflow_type || "");
    const fundId = String((row as any).fund_id || "");
    const amount = Number((row as any).amount || 0);
    if (!inflowId || !fundId) continue;
    if (inflowType !== "tithe" && inflowType !== "offering") continue;
    inflowById.set(inflowId, {
      fund_id: fundId,
      inflow_type: inflowType,
      amount,
    });
  }

  const trackedByFundId = new Map<string, number>();
  for (const [inflowId, remittedAmount] of remittedByInflowId.entries()) {
    const inflow = inflowById.get(inflowId);
    if (!inflow || remittedAmount <= 0) continue;
    trackedByFundId.set(
      inflow.fund_id,
      roundMoney((trackedByFundId.get(inflow.fund_id) ?? 0) + remittedAmount)
    );
  }

  const transferByFundId = new Map<string, number>();
  const { data: transferRows, error: transferError } = await supabase
    .from("treasury_fund_transfers")
    .select("source_fund_id, amount, reason, note")
    .eq("church_id", churchId)
    .order("transfer_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (!transferError && Array.isArray(transferRows)) {
    for (const row of transferRows) {
      const sourceFundId = String((row as any).source_fund_id || "");
      if (!sourceFundId) continue;
      const reason = String((row as any).reason || "").toLowerCase();
      const note = String((row as any).note || "").toLowerCase();
      const isRemittanceTransfer =
        reason.includes("automatic remittance") || note.includes("auto remittance run");
      if (!isRemittanceTransfer) continue;
      const amount = Number((row as any).amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      transferByFundId.set(
        sourceFundId,
        roundMoney((transferByFundId.get(sourceFundId) ?? 0) + amount)
      );
    }
  }

  return roundMoney(
    inflowRows.reduce((sum: number, row: any) => {
      const inflowId = String(row.id || "");
      const inflowType = String(row.inflow_type || "");
      if (inflowType !== "tithe" && inflowType !== "offering") return sum;
      const percentage = percentageByType.get(inflowType) ?? 0;
      if (percentage <= 0) return sum;
      const inflowAmount = Number(row.amount || 0);
      const targetAmount = roundMoney((inflowAmount * percentage) / 100);
      const trackedRemittedAmount = remittedByInflowId.get(inflowId) ?? 0;
      const fundId = String(row.fund_id || "");
      const trackedByFund = trackedByFundId.get(fundId) ?? 0;
      const transferredByFund = transferByFundId.get(fundId) ?? 0;
      const transferResidualByFund = Math.max(
        0,
        roundMoney(transferredByFund - trackedByFund)
      );
      const remittedAmount = roundMoney(
        trackedRemittedAmount +
          Math.min(transferResidualByFund, targetAmount - trackedRemittedAmount)
      );
      const pending = roundMoney(targetAmount - remittedAmount);
      if (pending <= 0) return sum;
      return sum + pending;
    }, 0)
  );
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

interface TreasuryFundOption {
  id: string;
  code: string;
  name: string;
  fund_type: string;
  department_id?: string | null;
}

interface TreasuryFundTransferRow {
  id: string;
  source_fund_id: string;
  destination_fund_id: string;
  amount: number;
  transfer_date: string;
  reason: string;
  reference_number: string | null;
  note: string | null;
  recorded_by_user_id: string;
  created_at: string;
}

interface TreasuryFundTransferHistory {
  id: string;
  transfer_date: string;
  amount: number;
  reason: string;
  reference_number: string | null;
  source_fund_id: string;
  source_fund_name: string;
  destination_fund_id: string;
  destination_fund_name: string;
  recorded_by_user_id: string;
  recorded_by_label: string;
}

interface TreasuryFundBalanceRow {
  fund_id: string;
  fund_code: string;
  fund_name: string;
  fund_type: string;
  inflows: number;
  outflows: number;
  transfers_in: number;
  transfers_out: number;
  balance: number;
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

async function getActiveTreasuryFundsForOptions(
  supabase: any,
  churchId: string
): Promise<{ data: TreasuryFundOption[] | null; error: Error | null }> {
  const withDepartment = await supabase
    .from("treasury_funds")
    .select("id, code, name, fund_type, department_id")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!withDepartment.error) {
    return {
      data: withNullableDepartmentId(
        (withDepartment.data ?? []) as unknown as TreasuryFundOption[]
      ),
      error: null,
    };
  }

  const withoutDepartment = await supabase
    .from("treasury_funds")
    .select("id, code, name, fund_type")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!withoutDepartment.error) {
    return {
      data: withNullableDepartmentId(
        (withoutDepartment.data ?? []) as unknown as TreasuryFundOption[]
      ),
      error: null,
    };
  }

  const composedMessage = [
    normalizeSupabaseErrorMessage(
      withDepartment.error,
      "Department-aware fund options query failed."
    ),
    normalizeSupabaseErrorMessage(
      withoutDepartment.error,
      "Legacy fund options fallback query failed."
    ),
  ].join(" | ");

  return {
    data: null,
    error: new Error(composedMessage),
  };
}

const getTreasuryFormOptionsBase = cache(async (churchSlug: string) => {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();

  const [{ data: funds, error: fundsError }, { data: departments, error: departmentsError }, members] = await Promise.all([
    getActiveTreasuryFundsForOptions(supabase, ctx.churchId),
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
          .select("id, code, name, fund_type, department_id")
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

  if (missingFunds.error) {
    if (String(missingFunds.error?.code || "").toLowerCase() === "42703") {
      const legacyMissingFunds = await supabase
        .from("treasury_funds")
        .select("id, code, name, fund_type")
        .eq("church_id", ctx.churchId)
        .in("id", missingFundIds);
      if (legacyMissingFunds.error) throw new Error(legacyMissingFunds.error.message);
      const mergedFunds = [...base.funds, ...withNullableDepartmentId((legacyMissingFunds.data ?? []) as any[])].sort((a, b) =>
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
    throw new Error(missingFunds.error.message);
  }
  if (missingDepartments.error) throw new Error(missingDepartments.error.message);

  const mergedFunds = [...base.funds, ...withNullableDepartmentId((missingFunds.data ?? []) as any[])].sort((a, b) =>
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
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
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
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
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
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
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

async function fetchAllTreasuryFundsForWorkspace(supabase: any, churchId: string) {
  const withDepartment = await supabase
    .from("treasury_funds")
    .select("id, code, name, fund_type, description, is_active, department_id, created_at, updated_at")
    .eq("church_id", churchId)
    .order("name", { ascending: true });

  if (!withDepartment.error) {
    return {
      rows: withNullableDepartmentId(
        (withDepartment.data ?? []) as unknown as Record<string, unknown>[]
      ),
      migrationRequired: false,
    };
  }

  const withoutDepartment = await supabase
    .from("treasury_funds")
    .select("id, code, name, fund_type, description, is_active, created_at, updated_at")
    .eq("church_id", churchId)
    .order("name", { ascending: true });

  if (withoutDepartment.error) {
    throw new Error(
      [
        normalizeSupabaseErrorMessage(
          withDepartment.error,
          "Department-aware treasury funds query failed."
        ),
        normalizeSupabaseErrorMessage(
          withoutDepartment.error,
          "Legacy treasury funds query failed."
        ),
      ].join(" | ")
    );
  }

  return {
    rows: withNullableDepartmentId(
      (withoutDepartment.data ?? []) as unknown as Record<string, unknown>[]
    ),
    migrationRequired: true,
  };
}

async function fetchDepartmentFundRequestsForTreasuryWorkspace(
  supabase: any,
  churchId: string
) {
  const { data, error } = await supabase
    .from("department_fund_requests")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(120);

  if (!error) {
    return { rows: data ?? [], migrationRequired: false };
  }

  if (isMissingRelationError(error, "department_fund_requests")) {
    return { rows: [], migrationRequired: true };
  }

  throw new Error(
    normalizeSupabaseErrorMessage(
      error,
      "Failed to load department fund requests for Treasury."
    )
  );
}

async function fetchTreasuryAuditRowsForWorkspace(supabase: any, churchId: string) {
  const { data, error } = await supabase
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
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(120);

  if (!error) {
    return { rows: data ?? [], migrationRequired: false };
  }

  if (isMissingRelationError(error, "treasury_audit_logs")) {
    return { rows: [], migrationRequired: true };
  }

  throw new Error(
    normalizeSupabaseErrorMessage(error, "Failed to load Treasury audit trail.")
  );
}

async function fetchTreasuryRemittanceLogsForWorkspace(supabase: any, churchId: string) {
  const { data, error } = await supabase
    .from("treasury_remittance_logs")
    .select(
      "id, run_date, source_type, source_amount, remitted_amount, destination, frequency, mode, status, outflow_reference, note, recorded_by_user_id, created_at"
    )
    .eq("church_id", churchId)
    .order("run_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (!error) {
    return { rows: data ?? [], migrationRequired: false };
  }

  if (isMissingRelationError(error, "treasury_remittance_logs")) {
    return { rows: [], migrationRequired: true };
  }

  throw new Error(
    normalizeSupabaseErrorMessage(error, "Failed to load Treasury remittance logs.")
  );
}

function summarizeTreasuryRequests(rows: any[]) {
  return rows.reduce(
    (summary, row) => {
      const status = String(row.status || "");
      if (status === "pending") summary.pending += 1;
      if (status === "approved") summary.approved += 1;
      if (status === "processed") summary.processed += 1;
      if (status === "rejected") summary.rejected += 1;
      if (status === "cancelled") summary.cancelled += 1;
      return summary;
    },
    { pending: 0, approved: 0, processed: 0, rejected: 0, cancelled: 0 }
  );
}

function profileLabel(row: any, fallback?: string | null) {
  if (!row) return fallback || "Unknown user";
  return row.full_name || row.email || fallback || "Unknown user";
}

function memberLabel(row: any, fallback?: string | null) {
  if (!row) return fallback || null;
  return (
    row.display_name ||
    [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
    row.member_code ||
    fallback ||
    null
  );
}

function toIsoDateTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export async function getTreasuryWorkspaceBootstrap(churchSlug: string) {
  const ctx = await requireChurchRole(churchSlug, [...TREASURY_ALLOWED_ROLES]);
  const supabase = await createClient();
  const canManageTransfers = ctx.roles.some((role) =>
    TREASURY_TRANSFER_ALLOWED_ROLES.has(String(role))
  );
  const canManageRemittance = ctx.roles.some((role) =>
    TREASURY_ALLOWED_ROLES.includes(role as (typeof TREASURY_ALLOWED_ROLES)[number])
  );
  const linkedInflowsCountPromise = getLinkedInflowsCountForChurch(supabase, ctx.churchId);
  const recentInflowsPromise = getRecentInflowsForChurch(supabase, ctx.churchId, 120);
  const financeSettingsPromise = fetchTreasuryFinanceSettingsRaw(supabase, ctx.churchId);
  const remittanceSettingsPromise = fetchTreasuryRemittanceSettingsRaw(
    supabase,
    ctx.churchId
  );

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
      .select("amount, inflow_type, fund_id")
      .eq("church_id", ctx.churchId),

    supabase
      .from("treasury_outflows")
      .select("amount, outflow_type, fund_id")
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
      .select("id, outflow_type, amount, outflow_date, payee, purpose, project_name, reference_number, note, fund_id, department_id, recorded_by_user_id, created_at")
      .eq("church_id", ctx.churchId)
      .order("outflow_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(120),

    getActiveTreasuryFundsForOptions(supabase, ctx.churchId),

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

  const [
    allFundsLoad,
    departmentRequestsLoad,
    auditRowsLoad,
    remittanceLogsLoad,
  ] = await Promise.all([
    fetchAllTreasuryFundsForWorkspace(supabase, ctx.churchId),
    fetchDepartmentFundRequestsForTreasuryWorkspace(supabase, ctx.churchId),
    fetchTreasuryAuditRowsForWorkspace(supabase, ctx.churchId),
    canManageRemittance
      ? fetchTreasuryRemittanceLogsForWorkspace(supabase, ctx.churchId)
      : Promise.resolve({ rows: [], migrationRequired: false }),
  ]);

  const allFundRows = allFundsLoad.rows;
  const departmentRows = departments ?? [];

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

  const [financeSettings, remittanceSettingsLoad, allocationPreview] = await Promise.all([
    financeSettingsPromise,
    remittanceSettingsPromise,
    getAllocationPreviewRaw(supabase, ctx.churchId, allFundRows as any[], 80),
  ]);
  const allocationSummary = summarizeAllocationPreview(allocationPreview);
  const pendingRemittanceAmount = await getPendingRemittanceAmountRaw(
    supabase,
    ctx.churchId,
    remittanceSettingsLoad.settings
  );

  let remittanceLogMissing = false;
  let lastRemittanceDate: string | null = null;
  let lastRemittanceAmount: number | null = null;
  if (canManageRemittance) {
    const { data: lastLog, error: remittanceLogError } = await supabase
      .from("treasury_remittance_logs")
      .select("run_date, remitted_amount, status, created_at")
      .eq("church_id", ctx.churchId)
      .order("run_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (remittanceLogError) {
      if (isMissingRelationError(remittanceLogError, "treasury_remittance_logs")) {
        remittanceLogMissing = true;
      } else {
        throw new Error(
          normalizeSupabaseErrorMessage(
            remittanceLogError,
            "Failed to load treasury remittance logs."
          )
        );
      }
    } else if (lastLog) {
      lastRemittanceDate = String((lastLog as any).run_date ?? "");
      lastRemittanceAmount = Number((lastLog as any).remitted_amount || 0);
    }
  }

  let transferMigrationRequired = false;
  let transferHistoryRows: TreasuryFundTransferRow[] = [];
  if (canManageTransfers) {
    const { data: rows, error: transferError } = await supabase
      .from("treasury_fund_transfers")
      .select(
        "id, source_fund_id, destination_fund_id, amount, transfer_date, reason, reference_number, note, recorded_by_user_id, created_at"
      )
      .eq("church_id", ctx.churchId)
      .order("transfer_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (transferError) {
      if (isMissingRelationError(transferError, "treasury_fund_transfers")) {
        transferMigrationRequired = true;
      } else {
        throw new Error(
          normalizeSupabaseErrorMessage(
            transferError,
            "Failed to load treasury fund transfers."
          )
        );
      }
    } else {
      transferHistoryRows = (rows ?? []) as TreasuryFundTransferRow[];
    }
  }

  const memberIds = Array.from(
    new Set(
      (recentInflows ?? [])
        .map((row: any) => row.member_id)
        .filter((value): value is string => Boolean(value))
    )
  );
  const profileIds = Array.from(
    new Set(
      [
        ...transferHistoryRows.map((row) => row.recorded_by_user_id),
        ...(recentInflows ?? []).map((row: any) => row.recorded_by_user_id),
        ...(recentOutflows ?? []).map((row: any) => row.recorded_by_user_id),
        ...departmentRequestsLoad.rows.flatMap((row: any) => [
          row.requested_by_user_id,
          row.treasury_reviewed_by_user_id,
          row.processed_by_user_id,
        ]),
        ...remittanceLogsLoad.rows.map((row: any) => row.recorded_by_user_id),
        ...auditRowsLoad.rows.map((row: any) => row.changed_by_user_id),
      ].filter((value): value is string => Boolean(value))
    )
  );

  const [memberRowsResult, profileRowsResult] = await Promise.all([
    memberIds.length > 0
      ? supabase
          .from("members")
          .select("id, display_name, first_name, last_name, member_code")
          .eq("church_id", ctx.churchId)
          .in("id", memberIds)
      : Promise.resolve({ data: [], error: null as any }),
    profileIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", profileIds)
      : Promise.resolve({ data: [], error: null as any }),
  ]);

  if (memberRowsResult.error) throw new Error(memberRowsResult.error.message);
  if (profileRowsResult.error) throw new Error(profileRowsResult.error.message);

  const memberLabelById = new Map(
    (memberRowsResult.data ?? []).map((row: any) => [String(row.id), memberLabel(row, row.id)])
  );
  const profileLabelById = new Map(
    (profileRowsResult.data ?? []).map((row: any) => [String(row.id), profileLabel(row, row.id)])
  );
  const departmentById = new Map(
    departmentRows.map((department: any) => [
      String(department.id),
      String(department.department_name ?? "Unknown department"),
    ])
  );
  const fundById = new Map(
    allFundRows.map((fund: any) => [String(fund.id), fund as TreasuryFundOption & Record<string, any>])
  );

  const transferHistory: TreasuryFundTransferHistory[] = transferHistoryRows.map((row) => ({
    id: row.id,
    transfer_date: row.transfer_date,
    amount: Number(row.amount || 0),
    reason: row.reason,
    reference_number: row.reference_number,
    source_fund_id: row.source_fund_id,
    source_fund_name:
      fundById.get(row.source_fund_id)?.name ?? "Unknown Source Fund",
    destination_fund_id: row.destination_fund_id,
    destination_fund_name:
      fundById.get(row.destination_fund_id)?.name ?? "Unknown Destination Fund",
    recorded_by_user_id: row.recorded_by_user_id,
    recorded_by_label:
      profileLabelById.get(row.recorded_by_user_id) ?? row.recorded_by_user_id,
  }));

  const inflowsByFundId = new Map<string, number>();
  for (const row of inflowSummaryRows ?? []) {
    const fundId = String((row as any).fund_id || "");
    if (!fundId) continue;
    inflowsByFundId.set(
      fundId,
      (inflowsByFundId.get(fundId) ?? 0) + Number((row as any).amount || 0)
    );
  }

  const outflowsByFundId = new Map<string, number>();
  for (const row of outflowSummaryRows ?? []) {
    const fundId = String((row as any).fund_id || "");
    if (!fundId) continue;
    outflowsByFundId.set(
      fundId,
      (outflowsByFundId.get(fundId) ?? 0) + Number((row as any).amount || 0)
    );
  }

  const transfersOutByFundId = new Map<string, number>();
  const transfersInByFundId = new Map<string, number>();
  for (const row of transferHistoryRows) {
    const amount = Number(row.amount || 0);
    transfersOutByFundId.set(
      row.source_fund_id,
      (transfersOutByFundId.get(row.source_fund_id) ?? 0) + amount
    );
    transfersInByFundId.set(
      row.destination_fund_id,
      (transfersInByFundId.get(row.destination_fund_id) ?? 0) + amount
    );
  }

  const fundBalances = allFundRows.map((fund: any) => {
    const fundId = String(fund.id);
    const inflows = inflowsByFundId.get(fundId) ?? 0;
    const outflows = outflowsByFundId.get(fundId) ?? 0;
    const transfersOut = transfersOutByFundId.get(fundId) ?? 0;
    const transfersIn = transfersInByFundId.get(fundId) ?? 0;
    return {
      fund_id: fundId,
      fund_code: String(fund.code ?? ""),
      fund_name: String(fund.name ?? ""),
      fund_type: String(fund.fund_type ?? ""),
      department_id: (fund as any).department_id ?? null,
      department_name: (fund as any).department_id
        ? departmentById.get(String((fund as any).department_id)) ?? null
        : null,
      description: (fund as any).description ?? null,
      is_active: (fund as any).is_active !== false,
      created_at: (fund as any).created_at ?? null,
      updated_at: (fund as any).updated_at ?? null,
      inflows,
      outflows,
      transfers_in: transfersIn,
      transfers_out: transfersOut,
      balance: inflows - outflows - transfersOut + transfersIn,
    };
  });

  const ledgerRows = [
    ...(recentInflows ?? []).map((row: any) => {
      const fund = fundById.get(String(row.fund_id || ""));
      const departmentId = row.department_id ? String(row.department_id) : null;
      const memberId = row.member_id ? String(row.member_id) : null;
      const sourceLabel = memberId
        ? memberLabelById.get(memberId) ?? "Member"
        : departmentId
          ? departmentById.get(departmentId) ?? "Department"
          : row.is_anonymous
            ? "Anonymous"
            : "Visitor / Non-member";

      return {
        id: `inflow:${row.id}`,
        raw_id: row.id,
        direction: "inflow",
        transaction_type: row.inflow_type ?? "inflow",
        amount: Number(row.amount || 0),
        date: row.inflow_date ?? null,
        created_at: row.created_at ?? null,
        source_label: sourceLabel,
        source_type: memberId ? "member" : departmentId ? "department" : row.is_anonymous ? "anonymous" : "visitor",
        member_id: memberId,
        department_id: departmentId,
        department_name: departmentId ? departmentById.get(departmentId) ?? null : null,
        fund_id: row.fund_id ?? null,
        fund_name: fund?.name ?? "Unknown fund",
        fund_code: fund?.code ?? "",
        fund_type: fund?.fund_type ?? "",
        reference_number: row.reference_number ?? null,
        note: row.note ?? null,
        recorded_by_user_id: row.recorded_by_user_id ?? null,
        recorded_by_label: row.recorded_by_user_id
          ? profileLabelById.get(String(row.recorded_by_user_id)) ?? "Unknown user"
          : "Unknown user",
        href: `/c/${churchSlug}/treasury/in/${row.id}/edit`,
      };
    }),
    ...(recentOutflows ?? []).map((row: any) => {
      const fund = fundById.get(String(row.fund_id || ""));
      const departmentId = row.department_id ? String(row.department_id) : null;

      return {
        id: `outflow:${row.id}`,
        raw_id: row.id,
        direction: "outflow",
        transaction_type: row.outflow_type ?? "outflow",
        amount: Number(row.amount || 0),
        date: row.outflow_date ?? null,
        created_at: row.created_at ?? null,
        source_label: row.payee || "Unspecified payee",
        source_type: "payee",
        member_id: null,
        department_id: departmentId,
        department_name: departmentId ? departmentById.get(departmentId) ?? null : null,
        fund_id: row.fund_id ?? null,
        fund_name: fund?.name ?? (row.fund_id ? "Unknown fund" : "No fund"),
        fund_code: fund?.code ?? "",
        fund_type: fund?.fund_type ?? "",
        reference_number: row.reference_number ?? null,
        note: row.note ?? row.purpose ?? null,
        purpose: row.purpose ?? null,
        project_name: row.project_name ?? null,
        recorded_by_user_id: row.recorded_by_user_id ?? null,
        recorded_by_label: row.recorded_by_user_id
          ? profileLabelById.get(String(row.recorded_by_user_id)) ?? "Unknown user"
          : "Unknown user",
        href: `/c/${churchSlug}/treasury/out/${row.id}/edit`,
      };
    }),
  ].sort((a, b) => {
    const dateDiff = toIsoDateTime(b.date) - toIsoDateTime(a.date);
    if (dateDiff !== 0) return dateDiff;
    return toIsoDateTime(b.created_at) - toIsoDateTime(a.created_at);
  });

  const requestRows = departmentRequestsLoad.rows.map((row: any) => {
    const fundId = row.fund_id || row.preferred_fund_id || null;
    const fund = fundId ? fundById.get(String(fundId)) : null;
    const departmentId = row.department_id ? String(row.department_id) : null;

    return {
      ...row,
      amount: Number(row.amount || 0),
      department_name: departmentId
        ? departmentById.get(departmentId) ?? "Unknown department"
        : "Unknown department",
      requested_by_label: row.requested_by_user_id
        ? profileLabelById.get(String(row.requested_by_user_id)) ?? "Unknown user"
        : "Unknown user",
      reviewed_by_label: row.treasury_reviewed_by_user_id
        ? profileLabelById.get(String(row.treasury_reviewed_by_user_id)) ?? "Unknown user"
        : null,
      processed_by_label: row.processed_by_user_id
        ? profileLabelById.get(String(row.processed_by_user_id)) ?? "Unknown user"
        : null,
      fund_label: fund?.name ?? (fundId ? "Unknown fund" : "No fund"),
      fund_code: fund?.code ?? "",
      outflow_date_effective: row.outflow_date || row.requested_date || null,
      outflow_href: row.processed_outflow_id
        ? `/c/${churchSlug}/treasury/out/${row.processed_outflow_id}/edit`
        : null,
    };
  });

  const requestSummary = summarizeTreasuryRequests(requestRows);
  const pendingAllocations = allocationPreview.filter(
    (row) => String(row.status || "").toLowerCase() === "allocated"
  );

  const remittanceHistory = remittanceLogsLoad.rows.map((row: any) => ({
    ...row,
    source_amount: Number(row.source_amount || 0),
    remitted_amount: Number(row.remitted_amount || 0),
    recorded_by_label: row.recorded_by_user_id
      ? profileLabelById.get(String(row.recorded_by_user_id)) ?? "Unknown user"
      : "Unknown user",
  }));

  const auditRows = auditRowsLoad.rows.map((row: any) => {
    const after = (row.after_snapshot ?? {}) as Record<string, any>;
    const before = (row.before_snapshot ?? {}) as Record<string, any>;
    const label =
      after.name ||
      before.name ||
      after.reference_number ||
      before.reference_number ||
      after.code ||
      before.code ||
      row.entity_id;

    return {
      ...row,
      changed_by_label: profileLabel(row.changed_by, row.changed_by_user_id),
      record_label: label,
      changed_field_count: Array.from(
        new Set([...Object.keys(before), ...Object.keys(after)])
      ).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).length,
    };
  });

  const exceptions: Array<{
    id: string;
    type: string;
    severity: "critical" | "warning" | "notice";
    title: string;
    description: string;
    entityType: string;
    entityId: string | null;
    entityLabel: string | null;
    amount: number | null;
    detectedLabel: string;
    status: "open";
    href: string | null;
    actionLabel: string | null;
    whyItMatters: string;
    suggestedResolution: string;
    details: Array<{ label: string; value: string }>;
  }> = [];

  for (const fund of fundBalances) {
    if (fund.balance < 0) {
      exceptions.push({
        id: `negative-fund-balance:${fund.fund_id}`,
        type: "negative_fund_balance",
        severity: "critical",
        title: "Negative Fund Balance",
        description: `${fund.fund_name} is below zero after inflows, outflows, and transfers.`,
        entityType: "Fund",
        entityId: fund.fund_id,
        entityLabel: fund.fund_name,
        amount: fund.balance,
        detectedLabel: "Current",
        status: "open",
        href: null,
        actionLabel: "Open Fund",
        whyItMatters: "A negative fund balance can indicate overspending, missing income, or an incorrect transfer.",
        suggestedResolution: "Review recent transactions and transfers for this fund before recording more money out.",
        details: [
          { label: "Fund", value: fund.fund_name },
          { label: "Code", value: fund.fund_code || "-" },
          { label: "Status", value: fund.is_active ? "Active" : "Inactive" },
        ],
      });
    }

    if (!fund.is_active && (fund.inflows > 0 || fund.outflows > 0 || fund.transfers_in > 0 || fund.transfers_out > 0)) {
      exceptions.push({
        id: `inactive-fund-in-use:${fund.fund_id}`,
        type: "inactive_fund_in_use",
        severity: "warning",
        title: "Inactive Fund With Activity",
        description: `${fund.fund_name} is inactive but still has Treasury activity.`,
        entityType: "Fund",
        entityId: fund.fund_id,
        entityLabel: fund.fund_name,
        amount: fund.balance,
        detectedLabel: "Current",
        status: "open",
        href: null,
        actionLabel: "Open Fund",
        whyItMatters: "Inactive funds with recent or active balances can confuse daily Treasury classification.",
        suggestedResolution: "Review whether the fund should be reactivated or all activity should remain historical.",
        details: [
          { label: "Money In", value: String(fund.inflows) },
          { label: "Money Out", value: String(fund.outflows) },
        ],
      });
    }
  }

  if (financeSettings.require_reference_numbers) {
    for (const row of ledgerRows) {
      if (row.reference_number && String(row.reference_number).trim()) continue;
      exceptions.push({
        id: `missing-reference:${row.id}`,
        type: "missing_reference",
        severity: "warning",
        title: "Missing Required Reference",
        description: "This Treasury entry does not have a reference number, while church finance policy requires references.",
        entityType: row.direction === "inflow" ? "Money In" : "Money Out",
        entityId: row.raw_id,
        entityLabel: row.source_label,
        amount: row.amount,
        detectedLabel: row.date || "Current",
        status: "open",
        href: row.href,
        actionLabel: "Edit Transaction",
        whyItMatters: "The transaction may be difficult to verify during reporting.",
        suggestedResolution: "Open the transaction and add the correct receipt, voucher, or payment reference.",
        details: [
          { label: "Fund", value: row.fund_name },
          { label: "Recorded By", value: row.recorded_by_label },
        ],
      });
    }
  }

  if (financeSettings.require_member_for_named_inflows) {
    for (const row of ledgerRows.filter((item) => item.direction === "inflow")) {
      if (row.source_type === "member" || row.source_type === "anonymous" || row.source_type === "department") continue;
      exceptions.push({
        id: `named-inflow-without-member:${row.raw_id}`,
        type: "named_inflow_without_member",
        severity: "warning",
        title: "Named Inflow Without Member",
        description: "A non-anonymous money-in entry is not linked to a member record.",
        entityType: "Money In",
        entityId: row.raw_id,
        entityLabel: row.source_label,
        amount: row.amount,
        detectedLabel: row.date || "Current",
        status: "open",
        href: row.href,
        actionLabel: "Edit Transaction",
        whyItMatters: "Member-linked giving can be missed in member financial history.",
        suggestedResolution: "Link the transaction to the correct member or mark it anonymous/visitor if appropriate.",
        details: [
          { label: "Fund", value: row.fund_name },
          { label: "Reference", value: row.reference_number || "-" },
        ],
      });
    }
  }

  for (const request of requestRows) {
    if (request.status === "approved" && !request.processed_outflow_id) {
      exceptions.push({
        id: `approved-request-unprocessed:${request.id}`,
        type: "approved_request_unprocessed",
        severity: "warning",
        title: "Approved Request Awaiting Processing",
        description: "A department fund request has been approved but not yet converted into a money-out entry.",
        entityType: "Fund Request",
        entityId: request.id,
        entityLabel: request.title,
        amount: Number(request.amount || 0),
        detectedLabel: request.updated_at || request.created_at || "Current",
        status: "open",
        href: `/c/${churchSlug}/treasury/out/new?requestId=${request.id}`,
        actionLabel: "Process Request",
        whyItMatters: "Approved ministry spending is not reflected in Treasury until it is processed.",
        suggestedResolution: "Process the request into a money-out entry or reject it if it should not be paid.",
        details: [
          { label: "Department", value: request.department_name },
          { label: "Requested By", value: request.requested_by_label },
        ],
      });
    }
  }

  if (pendingRemittanceAmount > 0) {
    exceptions.push({
      id: "pending-mission-remittance",
      type: "pending_mission_remittance",
      severity: "notice",
      title: "Pending Mission Remittance",
      description: "Mission remittance is available for the next remittance run.",
      entityType: "Remittance",
      entityId: null,
      entityLabel: remittanceSettingsLoad.settings.destination,
      amount: pendingRemittanceAmount,
      detectedLabel: "Current",
      status: "open",
      href: null,
      actionLabel: "Run Remittance",
      whyItMatters: "Mission remittance should be reviewed before period close.",
      suggestedResolution: "Open the remittance view and run remittance when ready.",
      details: [
        { label: "Frequency", value: remittanceSettingsLoad.settings.frequency },
        { label: "Mode", value: remittanceSettingsLoad.settings.mode },
      ],
    });
  }

  if (pendingAllocations.length > 0) {
    exceptions.push({
      id: "pending-allocations",
      type: "allocation_attention",
      severity: "notice",
      title: "Pending Allocations",
      description: "Some allocation records remain allocated and not yet remitted or voided.",
      entityType: "Allocation",
      entityId: null,
      entityLabel: "Treasury allocations",
      amount: pendingAllocations.reduce((sum, row) => sum + Number(row.allocated_amount || 0), 0),
      detectedLabel: "Current",
      status: "open",
      href: null,
      actionLabel: "Review Allocations",
      whyItMatters: "Allocated amounts should be reviewed before remittance reporting.",
      suggestedResolution: "Open the allocations view and confirm which records are awaiting remittance.",
      details: [{ label: "Records", value: String(pendingAllocations.length) }],
    });
  }

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
      pendingMissionRemittance: pendingRemittanceAmount,
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
    transfers: {
      canManage: canManageTransfers,
      migrationRequired: transferMigrationRequired,
      history: transferHistory,
      fundBalances,
    },
    remittance: {
      canManage: canManageRemittance,
      migrationRequired:
        remittanceSettingsLoad.migrationRequired ||
        remittanceLogMissing ||
        remittanceLogsLoad.migrationRequired,
      settings: remittanceSettingsLoad.settings,
      lastRunDate: lastRemittanceDate || null,
      lastAmount: lastRemittanceAmount,
      nextExpectedRun: getNextExpectedRemittanceDate(
        remittanceSettingsLoad.settings.frequency,
        lastRemittanceDate || null
      ),
      pendingAmount: pendingRemittanceAmount,
    },
    workspace: {
      permissions: {
        canManageTreasury: true,
        canManageTransfers,
        canManageRemittance,
        canCreateFund: true,
        canReviewRequests: true,
        canProcessRequests: true,
      },
      migrations: {
        fundDepartmentColumnRequired: allFundsLoad.migrationRequired,
        transfersRequired: transferMigrationRequired,
        requestsRequired: departmentRequestsLoad.migrationRequired,
        auditRequired: auditRowsLoad.migrationRequired,
        remittanceRequired:
          remittanceSettingsLoad.migrationRequired ||
          remittanceLogMissing ||
          remittanceLogsLoad.migrationRequired,
      },
      ledgerRows,
      funds: fundBalances,
      requests: {
        rows: requestRows,
        summary: requestSummary,
      },
      allocations: {
        rows: allocationPreview,
        pendingCount: pendingAllocations.length,
        pendingAmount: pendingAllocations.reduce(
          (sum, row) => sum + Number(row.allocated_amount || 0),
          0
        ),
      },
      audit: {
        rows: auditRows,
        actorOptions: Array.from(profileLabelById.entries()).map(([id, label]) => ({
          id,
          label,
        })),
      },
      exceptions,
      remittanceHistory,
      summary: {
        totalFunds: allFundRows.length,
        activeFunds: fundBalances.filter((fund) => fund.is_active).length,
        inactiveFunds: fundBalances.filter((fund) => !fund.is_active).length,
        combinedFundBalance: fundBalances.reduce(
          (sum, fund) => sum + Number(fund.balance || 0),
          0
        ),
        fundsRequiringAttention: fundBalances.filter((fund) => fund.balance < 0).length,
        transactionCount: ledgerRows.length,
        inflowCount: ledgerRows.filter((row) => row.direction === "inflow").length,
        outflowCount: ledgerRows.filter((row) => row.direction === "outflow").length,
        requestCount: requestRows.length,
        transferCount: transferHistory.length,
        auditCount: auditRows.length,
        openExceptionCount: exceptions.length,
      },
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
