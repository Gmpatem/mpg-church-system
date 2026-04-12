"use client";

import { useMemo, useState } from "react";
import { ContributionEntryForm } from "@/app/(church)/c/[churchSlug]/treasury/components/ContributionEntryForm";
import { FinancialRecordEntryForm } from "@/app/(church)/c/[churchSlug]/treasury/components/FinancialRecordEntryForm";
import { FundCreateForm } from "@/app/(church)/c/[churchSlug]/treasury/funds/new/FundCreateForm";
import { useI18n } from "@/features/i18n";
import { allocationKindLabels, allocationStatusLabels, fundTypeLabels, getLabel, inflowTypeLabels, outflowTypeLabels } from "@/lib/display-maps";
import type { TreasuryAllocationPreviewEntry, TreasuryFinanceSettings } from "@/features/treasury/types";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";

type MainTab = "contributions" | "expenses" | "ledger" | "funds" | "fundSetup" | "allocations";

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
  allocationPreview: TreasuryAllocationPreviewEntry[];
  financeSettings: TreasuryFinanceSettings;
  formOptions: {
    churchId?: string;
    funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
    departments: Array<{ id: string; department_name: string }>;
  };
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
        <div className="overflow-x-auto">
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
}: {
  churchSlug: string;
  funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
}) {
  const { t } = useI18n();

  return (
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
  );
}

function AllocationsPanel({
  allocations,
  funds,
}: {
  allocations: TreasuryAllocationPreviewEntry[];
  funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
}) {
  const { t } = useI18n();
  const fundMap = useMemo(() => new Map(funds.map((f) => [f.id, f])), [funds]);

  const summary = useMemo(() => {
    let missionRemittance = 0;
    let localRetained = 0;
    let pendingCount = 0;

    for (const alloc of allocations) {
      if (alloc.allocation_kind === "mission_remittance") {
        missionRemittance += Number(alloc.allocated_amount || 0);
      } else {
        localRetained += Number(alloc.allocated_amount || 0);
      }
      if (alloc.status === "pending") {
        pendingCount++;
      }
    }

    return { missionRemittance, localRetained, pendingCount };
  }, [allocations]);

  return (
    <div className="space-y-5">
      <WorkspaceSectionCard
        title={t.pages.treasury.workspace.sections.allocationSummary}
        description={t.pages.treasury.workspace.sections.allocationSummaryDesc}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t.pages.treasury.workspace.stats.missionRemittance}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatAmount(summary.missionRemittance)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t.pages.treasury.workspace.stats.localRetained}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatAmount(summary.localRetained)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t.pages.treasury.workspace.stats.pendingAllocations}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{summary.pendingCount}</p>
          </div>
        </div>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title={t.pages.treasury.workspace.sections.allocationEntries}
        description={t.pages.treasury.workspace.sections.allocationEntriesDesc}
        contentClassName="p-0"
      >
        {allocations.length === 0 ? (
          <div className="p-5">
            <WorkspaceEmptyState
              title={t.pages.treasury.workspace.empty.noAllocations}
              message={t.pages.treasury.workspace.empty.noAllocationsDesc}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.date}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.forms.entryType}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.workspace.ledger.inflowAmount}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.workspace.stats.allocatedTo}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.workspace.stats.allocatedAmount}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.treasury.workspace.stats.allocationStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {allocations.map((alloc) => {
                  const targetFund = alloc.target_fund_id ? fundMap.get(alloc.target_fund_id) : null;
                  return (
                    <tr key={alloc.id}>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{alloc.inflow_date || "-"}</td>
                      <td className="px-4 py-3.5 text-sm font-medium capitalize text-slate-900">
                        {getLabel(inflowTypeLabels, alloc.inflow_type)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {alloc.inflow_amount ? formatAmount(alloc.inflow_amount) : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {targetFund ? targetFund.name : alloc.target_fund_id ? `Fund ${alloc.target_fund_id.slice(0, 8)}...` : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">
                        {formatAmount(Number(alloc.allocated_amount || 0))}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            alloc.status === "pending"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : alloc.status === "applied" || alloc.status === "posted"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {getLabel(allocationStatusLabels, alloc.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
  allocationPreview,
  financeSettings,
  formOptions,
}: TreasuryWorkspaceProps) {
  const { t } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>("contributions");

  const inflowTypeSummary = dashboard.inflowByType
    .map((item) => `${getLabel(inflowTypeLabels, item.type)}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const outflowTypeSummary = dashboard.outflowByType
    .map((item) => `${getLabel(outflowTypeLabels, item.type)}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const contributionRows = useMemo<LedgerRow[]>(
    () =>
      (recentInflows ?? []).map((item: any) => ({
        id: `in-${item.id}`,
        direction: "inflow",
        typeLabel: getLabel(inflowTypeLabels, item.inflow_type),
        amount: Number(item.amount || 0),
        date: item.inflow_date ?? "",
        memberOrPayee:
          item.member_name ??
          item.member_display_name ??
          (item.member_id
            ? t.pages.treasury.forms.selectedMember
            : `${t.pages.treasury.forms.sourceModes.anonymous} / ${t.pages.treasury.forms.sourceModes.visitor}`),
        context: item.fund_name ?? item.fund_code ?? "-",
        reference: item.reference_number ?? item.note ?? "-",
      })),
    [recentInflows]
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
    [recentOutflows]
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
    { key: "contributions", label: t.pages.treasury.workspace.tabs.contributions },
    { key: "expenses", label: t.pages.treasury.workspace.tabs.recordExpenses },
    { key: "ledger", label: t.pages.treasury.workspace.tabs.ledger },
    { key: "funds", label: t.pages.treasury.workspace.tabs.funds },
    { key: "fundSetup", label: t.pages.treasury.workspace.tabs.fundSetup },
    { key: "allocations", label: t.pages.treasury.workspace.tabs.allocations },
  ];

  return (
    <div className="space-y-6">
      <WorkspaceHero
        size="compact"
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
          { label: t.navigation.reports, href: `/c/${churchSlug}/treasury/audit`, variant: "outline" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
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
      >
        <div className="space-y-3">
          <WorkspaceTabs
            items={MAIN_TABS}
            activeKey={mainTab}
            onChange={(key) => setMainTab(key as MainTab)}
            className="border-0 bg-transparent p-0 shadow-none"
          />
          <div className="flex flex-wrap gap-2">
            <a
              href={`/c/${churchSlug}/treasury/in`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.treasury.addIncome}
            </a>
            <a
              href={`/c/${churchSlug}/treasury/out`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.treasury.addExpense}
            </a>
            <a
              href={`/c/${churchSlug}/treasury/audit`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.navigation.reports}
            </a>
          </div>
        </div>
      </WorkspaceControlRail>

      {mainTab === "contributions" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,1fr)]">
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
      ) : null}

      {mainTab === "expenses" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,1fr)]">
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
      ) : null}

      {mainTab === "ledger" ? (
        <LedgerTable
          title={t.pages.treasury.workspace.tabs.ledger}
          description={t.pages.treasury.workspace.controlRail.description}
          rows={ledgerRows}
          emptyTitle={t.pages.treasury.workspace.empty.noMoneyIn}
          emptyMessage={t.pages.treasury.workspace.empty.noMoneyInDesc}
        />
      ) : null}

      {mainTab === "funds" ? (
        <FundsPanel churchSlug={churchSlug} funds={formOptions.funds} />
      ) : null}

      {mainTab === "fundSetup" ? (
        <FundSetupPanel churchSlug={churchSlug} funds={formOptions.funds} />
      ) : null}

      {mainTab === "allocations" ? (
        <AllocationsPanel allocations={allocationPreview} funds={formOptions.funds} />
      ) : null}
    </div>
  );
}
