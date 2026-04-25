"use client";

import { useActionState, useMemo, useState } from "react";
import { ContributionEntryForm } from "@/app/(church)/c/[churchSlug]/treasury/components/ContributionEntryForm";
import { FinancialRecordEntryForm } from "@/app/(church)/c/[churchSlug]/treasury/components/FinancialRecordEntryForm";
import { TreasuryTransfersTab } from "@/app/(church)/c/[churchSlug]/treasury/components/TreasuryTransfersTab";
import { FundCreateForm } from "@/app/(church)/c/[churchSlug]/treasury/funds/new/FundCreateForm";
import {
  runTreasuryRemittanceNowAction,
  updateTreasuryRemittanceSettingsAction,
} from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";
import { fundTypeLabels, getLabel, inflowTypeLabels, outflowTypeLabels } from "@/lib/display-maps";
import { formatAmount } from "@/lib/utils/format";
import type { TreasuryFinanceSettings } from "@/features/treasury/types";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { MobileCompactStatsStrip } from "@/components/mobile/MobileCompactStatsStrip";
import { MobilePageHeader } from "@/components/mobile/MobilePageHeader";

type MainTab =
  | "overview"
  | "contributions"
  | "expenses"
  | "transfers"
  | "fundSetup";

type LedgerRow = {
  id: string;
  direction: "inflow" | "outflow";
  typeLabel: string;
  amount: number;
  date: string;
  memberOrPayee: string;
  context: string;
  reference: string;
};

interface TreasuryWorkspaceProps {
  churchSlug: string;
  alreadyTithedIds?: string[];
  dashboard: {
    fundCount: number;
    totalIn: number;
    totalOut: number;
    netBalance: number;
    linkedInflowsCount: number;
    anonymousInflowsCount: number;
    inflowByType: Array<{ type: string; amount: number }>;
    outflowByType: Array<{ type: string; amount: number }>;
    allocationCount?: number;
    pendingMissionRemittance?: number;
    pendingLocalRetained?: number;
  };
  recentInflows: any[];
  recentOutflows: any[];
  financeSettings: TreasuryFinanceSettings;
  formOptions: {
    churchId?: string;
    funds: Array<{ id: string; code: string; name: string; fund_type: string; department_id?: string | null }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
    departments: Array<{ id: string; department_name: string }>;
  };
  transfers: {
    canManage: boolean;
    migrationRequired: boolean;
    history: Array<{
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
    }>;
    fundBalances: Array<{
      fund_id: string;
      fund_code: string;
      fund_name: string;
      fund_type: string;
      inflows: number;
      outflows: number;
      transfers_in: number;
      transfers_out: number;
      balance: number;
    }>;
  };
  remittance: {
    canManage: boolean;
    migrationRequired: boolean;
    settings: {
      is_enabled: boolean;
      is_live: boolean;
      tithe_enabled: boolean;
      tithe_percentage: number;
      offering_enabled: boolean;
      offering_percentage: number;
      source_type: "tithe" | "offering" | "both";
      percentage: number;
      fixed_amount: number | null;
      destination: "conference" | "mission" | "union";
      frequency: "daily" | "weekly" | "monthly" | "manual";
      mode: "auto_create" | "auto_process";
      allow_override: boolean;
    };
    lastRunDate: string | null;
    lastAmount: number | null;
    nextExpectedRun: string | null;
    pendingAmount: number;
  };
}

function LedgerTable({
  title,
  description,
  rows,
  emptyTitle,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: LedgerRow[];
  emptyTitle: string;
  emptyMessage: string;
}) {
  const { t } = useI18n();

  return (
    <WorkspaceSectionCard title={title} description={description} contentClassName="p-0">
      {rows.length === 0 ? (
        <div className="p-5">
          <WorkspaceEmptyState
            title={emptyTitle}
            message={emptyMessage}
            className="min-h-[180px]"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={
                      row.direction === "inflow"
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                        : "rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"
                    }
                  >
                    {row.direction === "inflow" ? "Money In" : "Money Out"}
                  </span>
                  <p className="text-sm font-semibold text-slate-900">{formatAmount(Number(row.amount || 0))}</p>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">{row.typeLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{row.date || "-"}</p>
                <p className="mt-2 text-xs text-slate-600">{row.memberOrPayee || "-"}</p>
                <p className="mt-1 text-xs text-slate-600">{row.context || "-"}</p>
                <p className="mt-1 text-xs text-slate-500">{row.reference || "-"}</p>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Direction</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.entryType}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.date}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.member} / {t.pages.treasury.forms.payee}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.purpose}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.reference}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3.5">
                      <span
                        className={
                          row.direction === "inflow"
                            ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                            : "rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"
                        }
                      >
                        {row.direction === "inflow" ? t.pages.treasury.workspace.ledger.in : t.pages.treasury.workspace.ledger.out}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium capitalize text-slate-900">{row.typeLabel}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.date || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.memberOrPayee || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.context || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">{row.reference || "-"}</td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">
                      {formatAmount(Number(row.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </WorkspaceSectionCard>
  );
}

function FundsPanel({
  churchSlug,
  funds,
}: {
  churchSlug: string;
  funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
}) {
  const { t } = useI18n();
  
  return (
    <WorkspaceSectionCard
      title={t.pages.treasury.workspace.sections.treasuryFunds}
      description={t.pages.treasury.workspace.sections.treasuryFundsDesc}
    >
      {funds.length === 0 ? (
        <WorkspaceEmptyState
          title={t.pages.treasury.workspace.empty.noFunds}
          message={t.pages.treasury.workspace.empty.noFundsDesc}
          actionLabel={t.pages.treasury.forms.openFundSetup}
          actionHref={`/c/${churchSlug}/treasury/funds/new`}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.fund}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.fundForm.code}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.entryType}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {funds.map((fund) => (
                <tr key={fund.id}>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">{fund.name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{fund.code}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                      {getLabel(fundTypeLabels, fund.fund_type)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WorkspaceSectionCard>
  );
}

function FundSetupPanel({
  churchSlug,
  funds,
  remittance,
}: {
  churchSlug: string;
  funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
  remittance: TreasuryWorkspaceProps["remittance"];
}) {
  const [saveState, saveAction, savePending] = useActionState(
    updateTreasuryRemittanceSettingsAction,
    null
  );
  const [runState, runAction, runPending] = useActionState(
    runTreasuryRemittanceNowAction,
    null
  );
  const remittanceSourceLabel = remittance.settings.tithe_enabled && remittance.settings.offering_enabled
    ? "Tithe + Sabbath Offering"
    : remittance.settings.tithe_enabled
      ? "Tithe"
      : remittance.settings.offering_enabled
        ? "Sabbath Offering"
        : "Not configured";
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,1fr)]">
        <div>
          <WorkspaceSectionCard
            title={t.pages.treasury.workspace.sections.fundSetup}
            description={t.pages.treasury.workspace.sections.fundSetupDesc}
          >
            <FundCreateForm churchSlug={churchSlug} embedded />
          </WorkspaceSectionCard>
        </div>
        <FundsPanel churchSlug={churchSlug} funds={funds} />
      </div>

      <WorkspaceSectionCard
        title="Automatic Remittance"
        description="Configure live remittance rules for tithe and sabbath offerings."
      >
        {remittance.migrationRequired ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Automatic remittance requires migration updates. Apply
            {" "}
            <code>database/rls/20260425_treasury_auto_remittance.sql</code>
            {" "}
            and
            {" "}
            <code>database/rls/20260426_treasury_auto_remittance_live_controls.sql</code>.
          </div>
        ) : (
          <div className="space-y-4">
            {saveState && !saveState.ok ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveState.error}
              </div>
            ) : null}
            {saveState && saveState.ok ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveState.message}
              </div>
            ) : null}
            {runState && !runState.ok ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {runState.error}
              </div>
            ) : null}
            {runState && runState.ok ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {runState.message}
              </div>
            ) : null}

            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 md:grid-cols-3">
              <div>
                <p className="font-medium text-slate-900">Last remittance</p>
                <p>{remittance.lastRunDate || "Never"}</p>
                <p className="text-slate-500">
                  Amount: {remittance.lastAmount === null ? "—" : formatAmount(remittance.lastAmount)}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Pending</p>
                <p>{formatAmount(remittance.pendingAmount)}</p>
                <p className="text-slate-500">Source: {remittanceSourceLabel}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Next expected run</p>
                <p>{remittance.nextExpectedRun || "Manual trigger"}</p>
                <p className="text-slate-500">Mode: {remittance.settings.mode}</p>
              </div>
            </div>

            <form action={saveAction} className="space-y-4">
              <input type="hidden" name="churchSlug" value={churchSlug} />
              <input type="hidden" name="is_enabled" value="true" />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="remittance-live" className="text-sm font-medium text-slate-800">
                    Activate Automatic Remittance
                  </label>
                  <select
                    id="remittance-live"
                    name="is_live"
                    defaultValue={remittance.settings.is_live ? "true" : "false"}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="false">Off</option>
                    <option value="true">On (Live)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="remittance-frequency" className="text-sm font-medium text-slate-800">
                    Frequency
                  </label>
                  <select
                    id="remittance-frequency"
                    name="frequency"
                    defaultValue={remittance.settings.frequency}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="manual">Manual</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tithe-enabled" className="text-sm font-medium text-slate-800">
                    Tithe Remittance
                  </label>
                  <div className="grid grid-cols-[minmax(120px,180px)_1fr] gap-2">
                    <select
                      id="tithe-enabled"
                      name="tithe_enabled"
                      defaultValue={remittance.settings.tithe_enabled ? "true" : "false"}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                        %
                      </span>
                      <input
                        name="tithe_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={remittance.settings.tithe_percentage}
                        className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="offering-enabled" className="text-sm font-medium text-slate-800">
                    Offering Remittance
                  </label>
                  <div className="grid grid-cols-[minmax(120px,180px)_1fr] gap-2">
                    <select
                      id="offering-enabled"
                      name="offering_enabled"
                      defaultValue={remittance.settings.offering_enabled ? "true" : "false"}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                        %
                      </span>
                      <input
                        name="offering_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={remittance.settings.offering_percentage}
                        className="w-full rounded-xl border border-slate-300 py-2 pl-8 pr-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="remittance-destination" className="text-sm font-medium text-slate-800">
                    Destination
                  </label>
                  <select
                    id="remittance-destination"
                    name="destination"
                    defaultValue={remittance.settings.destination}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="conference">Conference</option>
                    <option value="mission">Mission</option>
                    <option value="union">Union</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="remittance-mode" className="text-sm font-medium text-slate-800">
                    Mode
                  </label>
                  <select
                    id="remittance-mode"
                    name="mode"
                    defaultValue={remittance.settings.mode}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="auto_create">Prepare only</option>
                    <option value="auto_process">Auto process</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="remittance-override" className="text-sm font-medium text-slate-800">
                    Allow Manual Override
                  </label>
                  <select
                    id="remittance-override"
                    name="allow_override"
                    defaultValue={remittance.settings.allow_override ? "true" : "false"}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm md:max-w-[220px]"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                A dedicated <strong>Remittance Fund</strong> is created automatically when live remittance is activated.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={savePending}
                  className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savePending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>

            <form action={runAction}>
              <input type="hidden" name="churchSlug" value={churchSlug} />
              <input type="hidden" name="manualOverride" value="true" />
              <button
                type="submit"
                disabled={!remittance.canManage || runPending}
                className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runPending ? "Running..." : "Run Remittance Now"}
              </button>
            </form>
          </div>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}

export function TreasuryWorkspace({
  churchSlug,
  alreadyTithedIds,
  dashboard,
  recentInflows,
  recentOutflows,
  financeSettings,
  formOptions,
  transfers,
  remittance,
}: TreasuryWorkspaceProps) {
  const { t } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [moneyInSheetOpen, setMoneyInSheetOpen] = useState(false);
  const [moneyOutSheetOpen, setMoneyOutSheetOpen] = useState(false);
  const [remittanceRunState, remittanceRunAction, remittanceRunPending] = useActionState(
    runTreasuryRemittanceNowAction,
    null
  );

  const inflowTypeSummary = dashboard.inflowByType
    .map((item) => `${getLabel(inflowTypeLabels, item.type)}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const outflowTypeSummary = dashboard.outflowByType
    .map((item) => `${getLabel(outflowTypeLabels, item.type)}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const contributionRows = useMemo<LedgerRow[]>(
    () => {
      const departmentNameById = new Map(
        (formOptions.departments ?? []).map((dept: any) => [dept.id, dept.department_name])
      );

      return (recentInflows ?? []).map((item: any) => ({
        id: `in-${item.id}`,
        direction: "inflow",
        typeLabel: getLabel(inflowTypeLabels, item.inflow_type),
        amount: Number(item.amount || 0),
        date: item.inflow_date ?? "",
        memberOrPayee:
          item.member_name ??
          item.member_display_name ??
          (item.department_id
            ? departmentNameById.get(item.department_id) ??
              t.pages.treasury.forms.sourceModes.department
            : null) ??
          (item.member_id
            ? t.pages.treasury.forms.selectedMember
            : `${t.pages.treasury.forms.sourceModes.anonymous} / ${t.pages.treasury.forms.sourceModes.visitor}`),
        context: item.fund_name ?? item.fund_code ?? "-",
        reference: item.reference_number ?? item.note ?? "-",
      }));
    },
    [formOptions.departments, recentInflows, t.pages.treasury.forms.selectedMember, t.pages.treasury.forms.sourceModes.anonymous, t.pages.treasury.forms.sourceModes.department, t.pages.treasury.forms.sourceModes.visitor]
  );

  const expenseRows = useMemo<LedgerRow[]>(
    () =>
      (recentOutflows ?? []).map((item: any) => ({
        id: `out-${item.id}`,
        direction: "outflow",
        typeLabel: getLabel(outflowTypeLabels, item.outflow_type),
        amount: Number(item.amount || 0),
        date: item.outflow_date ?? "",
        memberOrPayee: item.payee ?? t.pages.treasury.forms.notSpecified,
        context: item.purpose ?? item.department_name ?? "-",
        reference: item.reference_number ?? item.note ?? "-",
      })),
    [recentOutflows, t.pages.treasury.forms.notSpecified]
  );

  const ledgerRows = useMemo<LedgerRow[]>(
    () =>
      [...contributionRows, ...expenseRows].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      }),
    [contributionRows, expenseRows]
  );

  const MAIN_TABS: WorkspaceTabItem[] = [
    { key: "overview", label: "Overview" },
    { key: "contributions", label: "Income" },
    { key: "expenses", label: "Expenses" },
    { key: "transfers", label: "Transfers" },
    { key: "fundSetup", label: "Settings" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3 md:hidden">
        <MobilePageHeader
          title="Treasury"
          subtitle={`Balance: ${formatAmount(dashboard.netBalance)}`}
          actionLabel="Add Payment"
          onActionClick={() => setMoneyInSheetOpen(true)}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMoneyInSheetOpen(true)}
            className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
          >
            Money In
          </button>
          <button
            type="button"
            onClick={() => setMoneyOutSheetOpen(true)}
            className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800"
          >
            Money Out
          </button>
        </div>

        <MobileCompactStatsStrip
          items={[
            {
              label: "Balance",
              value: formatAmount(dashboard.netBalance),
              tone: dashboard.netBalance >= 0 ? "success" : "danger",
            },
            { label: "Money In", value: formatAmount(dashboard.totalIn), tone: "success" },
            { label: "Money Out", value: formatAmount(dashboard.totalOut), tone: "danger" },
            { label: "Pending", value: formatAmount(dashboard.pendingMissionRemittance ?? 0), tone: "attention" },
          ]}
        />
      </div>

      <WorkspaceHero
        size="compact"
        mobileLayout="slim"
        eyebrow={t.pages.treasury.workspace.eyebrow}
        title={t.pages.treasury.workspace.title}
        description={t.pages.treasury.workspace.description}
        badges={[
          `${dashboard.fundCount} ${t.pages.treasury.workspace.stats.funds.toLowerCase()}`,
          `${dashboard.linkedInflowsCount} ${t.pages.treasury.workspace.stats.linkedContributions.toLowerCase()}`,
          `${dashboard.anonymousInflowsCount} ${t.pages.treasury.workspace.stats.anonymousContributions.toLowerCase()}`,
          `${dashboard.allocationCount ?? 0} ${t.pages.treasury.workspace.stats.allocationsBadge.toLowerCase()}`,
        ]}
        actions={[
          { label: t.treasury.addIncome, href: `/c/${churchSlug}/treasury/in`, variant: "primary" },
          { label: t.treasury.addExpense, href: `/c/${churchSlug}/treasury/out`, variant: "secondary" },
          { label: "Approvals", href: `/c/${churchSlug}/treasury/approvals`, variant: "outline" },
          { label: t.navigation.reports, href: `/c/${churchSlug}/treasury/audit`, variant: "outline" },
        ]}
        className="hidden md:block"
      />

      <div className="hidden md:grid grid-cols-2 gap-3 xl:grid-cols-5">
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.funds} value={dashboard.fundCount} hint={t.pages.treasury.workspace.stats.fundsHint} />
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.totalIn} value={formatAmount(dashboard.totalIn)} hint={inflowTypeSummary || t.pages.treasury.workspace.stats.fundsHint} />
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.totalOut} value={formatAmount(dashboard.totalOut)} hint={outflowTypeSummary || t.pages.treasury.workspace.stats.fundsHint} />
        <WorkspaceStatCard
          label={t.pages.treasury.workspace.stats.netBalance}
          value={formatAmount(dashboard.netBalance)}
          hint={t.pages.treasury.workspace.stats.netBalanceHint}
          valueClassName={dashboard.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <WorkspaceStatCard 
          label={t.pages.treasury.workspace.stats.pendingRemittance} 
          value={formatAmount(dashboard.pendingMissionRemittance ?? 0)} 
          hint={t.pages.treasury.workspace.stats.pendingRemittanceHint} 
        />
      </div>

      <WorkspaceControlRail
        title={t.pages.treasury.workspace.controlRail.title}
        description={t.pages.treasury.workspace.controlRail.description}
        className="hidden md:block"
      >
        <div className="space-y-3">
          <WorkspaceTabs
            items={MAIN_TABS}
            activeKey={mainTab}
            onChange={(key) => setMainTab(key as MainTab)}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </WorkspaceControlRail>

      <WorkspaceTabs
        items={MAIN_TABS}
        activeKey={mainTab}
        onChange={(key) => setMainTab(key as MainTab)}
        className="md:hidden"
      />

      {mainTab === "contributions" ? (
        <>
          <div className="hidden md:grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,1fr)]">
            <ContributionEntryForm
              churchSlug={churchSlug}
              options={formOptions}
              modeLabel={t.pages.treasury.forms.recordContribution}
              alreadyTithedIds={alreadyTithedIds ?? []}
              onCreateFundRequest={() => setMainTab("fundSetup")}
            />
            <LedgerTable
              title={t.pages.treasury.workspace.sections.recentMoneyIn}
              description={t.pages.treasury.workspace.sections.recentMoneyInDesc}
              rows={contributionRows}
              emptyTitle={t.pages.treasury.workspace.empty.noMoneyIn}
              emptyMessage={t.pages.treasury.workspace.empty.noMoneyInDesc}
            />
          </div>
          <div className="md:hidden">
            <LedgerTable
              title="Recent Money In"
              description={t.pages.treasury.workspace.sections.recentMoneyInDesc}
              rows={contributionRows}
              emptyTitle={t.pages.treasury.workspace.empty.noMoneyIn}
              emptyMessage="No payments yet. Tap 'Add Payment' to start."
            />
          </div>
        </>
      ) : null}

      {mainTab === "expenses" ? (
        <>
          <div className="hidden md:grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,1fr)]">
            <FinancialRecordEntryForm
              churchSlug={churchSlug}
              options={formOptions}
              modeLabel={t.pages.treasury.forms.recordExpenseDisbursement}
              financeSettings={financeSettings}
              onCreateFundRequest={() => setMainTab("fundSetup")}
            />
            <LedgerTable
              title={t.pages.treasury.workspace.sections.recentMoneyOut}
              description={t.pages.treasury.workspace.sections.recentMoneyOutDesc}
              rows={expenseRows}
              emptyTitle={t.pages.treasury.workspace.empty.noMoneyOut}
              emptyMessage={t.pages.treasury.workspace.empty.noMoneyOutDesc}
            />
          </div>
          <div className="md:hidden">
            <LedgerTable
              title="Recent Money Out"
              description={t.pages.treasury.workspace.sections.recentMoneyOutDesc}
              rows={expenseRows}
              emptyTitle={t.pages.treasury.workspace.empty.noMoneyOut}
              emptyMessage="No expenses yet. Tap 'Money Out' to add one."
            />
          </div>
        </>
      ) : null}

      {mainTab === "overview" ? (
        <div className="space-y-5">
          <WorkspaceSectionCard
            title="Remittance"
            description="Monitor automatic remittance and run it manually when needed."
          >
            {remittanceRunState && !remittanceRunState.ok ? (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {remittanceRunState.error}
              </div>
            ) : null}
            {remittanceRunState && remittanceRunState.ok ? (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {remittanceRunState.message}
              </div>
            ) : null}

            {remittance.migrationRequired ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Remittance migration is required. Apply
                {" "}
                <code>database/rls/20260425_treasury_auto_remittance.sql</code>
                {" "}
                to enable this feature.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Last remittance
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {remittance.lastRunDate || "Never"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Amount: {remittance.lastAmount === null ? "—" : formatAmount(remittance.lastAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Pending remittance
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatAmount(remittance.pendingAmount)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Source: {remittance.settings.tithe_enabled && remittance.settings.offering_enabled
                        ? "Tithe + Sabbath Offering"
                        : remittance.settings.tithe_enabled
                          ? "Tithe"
                          : remittance.settings.offering_enabled
                            ? "Sabbath Offering"
                            : "Not configured"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Next expected run
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {remittance.nextExpectedRun || "Manual trigger"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Mode: {remittance.settings.mode}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <form action={remittanceRunAction}>
                    <input type="hidden" name="churchSlug" value={churchSlug} />
                    <input type="hidden" name="manualOverride" value="true" />
                    <button
                      type="submit"
                      disabled={!remittance.canManage || remittanceRunPending}
                      className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {remittanceRunPending ? "Running..." : "Run Remittance"}
                    </button>
                  </form>
                  <a
                    href={`/c/${churchSlug}/settings`}
                    className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                  >
                    Open Settings
                  </a>
                </div>
              </div>
            )}
          </WorkspaceSectionCard>

          <LedgerTable
            title="Overview"
            description={t.pages.treasury.workspace.controlRail.description}
            rows={ledgerRows}
            emptyTitle={t.pages.treasury.workspace.empty.noMoneyIn}
            emptyMessage={t.pages.treasury.workspace.empty.noMoneyInDesc}
          />
        </div>
      ) : null}

      {mainTab === "transfers" ? (
        <TreasuryTransfersTab
          churchSlug={churchSlug}
          funds={formOptions.funds}
          history={transfers.history}
          fundBalances={transfers.fundBalances}
          canManage={transfers.canManage}
          migrationRequired={transfers.migrationRequired}
        />
      ) : null}

      {mainTab === "fundSetup" ? (
        <FundSetupPanel
          churchSlug={churchSlug}
          funds={formOptions.funds}
          remittance={remittance}
        />
      ) : null}

      <MobileBottomSheet
        open={moneyInSheetOpen}
        onOpenChange={setMoneyInSheetOpen}
        title="Add Payment"
      >
        <ContributionEntryForm
          churchSlug={churchSlug}
          options={formOptions}
          modeLabel="Money In"
          alreadyTithedIds={alreadyTithedIds ?? []}
          onCreateFundRequest={() => {
            setMoneyInSheetOpen(false);
            setMainTab("fundSetup");
          }}
          onSuccess={() => setMoneyInSheetOpen(false)}
        />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={moneyOutSheetOpen}
        onOpenChange={setMoneyOutSheetOpen}
        title="Add Expense"
      >
        <FinancialRecordEntryForm
          churchSlug={churchSlug}
          options={formOptions}
          modeLabel="Money Out"
          financeSettings={financeSettings}
          onCreateFundRequest={() => {
            setMoneyOutSheetOpen(false);
            setMainTab("fundSetup");
          }}
          onSuccess={() => setMoneyOutSheetOpen(false)}
        />
      </MobileBottomSheet>
    </div>
  );
}
