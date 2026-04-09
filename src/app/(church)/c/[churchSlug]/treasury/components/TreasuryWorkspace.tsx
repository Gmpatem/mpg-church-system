"use client";

import { useMemo, useState } from "react";
import { MoneyInForm } from "../in/new/MoneyInForm";
import { MoneyOutForm } from "../out/new/MoneyOutForm";
import { TitheEntryForm } from "./TitheEntryForm";
import { useTreasuryMembers } from "@/features/treasury/hooks";
import { useI18n } from "@/features/i18n";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";

type MainTab = "record_income" | "record_expenses" | "ledger" | "funds";

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
  };
  recentInflows: any[];
  recentOutflows: any[];
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

function LedgerList({
  title,
  description,
  rows,
  mode,
}: {
  title: string;
  description: string;
  rows: any[];
  mode: "inflow" | "outflow";
}) {
  const { t } = useI18n();
  
  return (
    <WorkspaceSectionCard title={title} description={description}>
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title={mode === "inflow" ? t.pages.treasury.workspace.empty.noMoneyIn : t.pages.treasury.workspace.empty.noMoneyOut}
          message={
            mode === "inflow"
              ? t.pages.treasury.workspace.empty.noMoneyInDesc
              : t.pages.treasury.workspace.empty.noMoneyOutDesc
          }
          className="min-h-[180px]"
        />
      ) : (
        <div className="space-y-3">
          {rows.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold capitalize text-slate-950">
                  {mode === "inflow" ? item.inflow_type : item.outflow_type}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t.pages.treasury.forms.amount}: {formatAmount(Number(item.amount || 0))}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t.pages.treasury.forms.date}: {mode === "inflow" ? item.inflow_date : item.outflow_date}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === "inflow"
                    ? item.reference_number ?? item.note ?? "—"
                    : item.purpose ?? item.reference_number ?? item.note ?? "—"}
                </p>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                {mode === "inflow" ? "In" : "Out"}
              </span>
            </div>
          ))}
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
          actionLabel={t.pages.treasury.workspace.empty.openReports}
          actionHref={`/c/${churchSlug}/reports`}
        />
      ) : (
        <div className="space-y-3">
          {funds.map((fund) => (
            <div
              key={fund.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">{fund.name}</p>
                <p className="mt-1 text-xs text-slate-500">{fund.code}</p>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                {fund.fund_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </WorkspaceSectionCard>
  );
}

function MemberOptionsLoading() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
      {t.pages.treasury.workspace.loading}
    </div>
  );
}

function MemberOptionsError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

export function TreasuryWorkspace({
  churchSlug,
  alreadyTithedIds,
  dashboard,
  recentInflows,
  recentOutflows,
  formOptions,
}: TreasuryWorkspaceProps) {
  const { t } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>("record_income");

  const needsMembers = mainTab === "record_income" || mainTab === "record_expenses";
  const memberLoader = useTreasuryMembers(churchSlug, needsMembers);

  const mergedFormOptions = useMemo(() => ({
    ...formOptions,
    members: (memberLoader.loaded && memberLoader.members.length > 0)
      ? memberLoader.members
      : formOptions.members,
  }), [formOptions, memberLoader.loaded, memberLoader.members]);

  const inflowTypeSummary = dashboard.inflowByType
    .map((item) => `${item.type}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const outflowTypeSummary = dashboard.outflowByType
    .map((item) => `${item.type}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const MAIN_TABS: WorkspaceTabItem[] = [
    { key: "record_income", label: t.pages.treasury.workspace.tabs.recordIncome },
    { key: "record_expenses", label: t.pages.treasury.workspace.tabs.recordExpenses },
    { key: "ledger", label: t.pages.treasury.workspace.tabs.ledger },
    { key: "funds", label: t.pages.treasury.workspace.tabs.funds },
  ];

  return (
    <div className="space-y-6">
      <WorkspaceHero
        eyebrow={t.pages.treasury.workspace.eyebrow}
        title={t.pages.treasury.workspace.title}
        description={t.pages.treasury.workspace.description}
        badges={[
          `${dashboard.fundCount} ${t.pages.treasury.workspace.stats.funds.toLowerCase()}`,
          `${dashboard.linkedInflowsCount} ${t.pages.treasury.workspace.stats.linkedContributions.toLowerCase()}`,
          `${dashboard.anonymousInflowsCount} ${t.pages.treasury.workspace.stats.anonymousContributions.toLowerCase()}`,
        ]}
        actions={[
          { label: t.treasury.addIncome, href: `/c/${churchSlug}/treasury/in`, variant: "primary" },
          { label: t.treasury.addExpense, href: `/c/${churchSlug}/treasury/out`, variant: "secondary" },
          { label: t.navigation.reports, href: `/c/${churchSlug}/treasury/audit`, variant: "outline" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.funds} value={dashboard.fundCount} hint={t.pages.treasury.workspace.stats.fundsHint} />
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.totalIn} value={formatAmount(dashboard.totalIn)} hint={inflowTypeSummary || t.pages.treasury.workspace.stats.fundsHint} />
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.totalOut} value={formatAmount(dashboard.totalOut)} hint={outflowTypeSummary || t.pages.treasury.workspace.stats.fundsHint} />
        <WorkspaceStatCard
          label={t.pages.treasury.workspace.stats.netBalance}
          value={formatAmount(dashboard.netBalance)}
          hint={t.pages.treasury.workspace.stats.netBalanceHint}
          valueClassName={dashboard.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.linkedContributions} value={dashboard.linkedInflowsCount} hint={t.pages.treasury.workspace.stats.linkedContributionsHint} />
        <WorkspaceStatCard label={t.pages.treasury.workspace.stats.anonymousContributions} value={dashboard.anonymousInflowsCount} hint={t.pages.treasury.workspace.stats.anonymousContributionsHint} />
      </div>

      <WorkspaceControlRail
        title={t.pages.treasury.workspace.controlRail.title}
        description={t.pages.treasury.workspace.controlRail.description}
      >
        <WorkspaceTabs
          items={MAIN_TABS}
          activeKey={mainTab}
          onChange={(key) => setMainTab(key as MainTab)}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </WorkspaceControlRail>

      {(mainTab === "record_income" || mainTab === "record_expenses") && memberLoader.loading && !memberLoader.loaded ? (
        <MemberOptionsLoading />
      ) : null}

      {(mainTab === "record_income" || mainTab === "record_expenses") && memberLoader.error ? (
        <MemberOptionsError message={memberLoader.error} />
      ) : null}

      {mainTab === "record_income" ? (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <WorkspaceSectionCard title={t.pages.treasury.workspace.sections.tithe}>
              <TitheEntryForm churchSlug={churchSlug} options={mergedFormOptions} alreadyTithedIds={alreadyTithedIds ?? []} />
            </WorkspaceSectionCard>
            <WorkspaceSectionCard title={t.pages.treasury.workspace.sections.offering}>
              <MoneyInForm
                churchSlug={churchSlug}
                options={mergedFormOptions}
                modeLabel={t.pages.treasury.workspace.sections.offeringLabel}
              />
            </WorkspaceSectionCard>
          </div>

          <div className="space-y-6">
            <LedgerList
              title={t.pages.treasury.workspace.sections.recentMoneyIn}
              description={t.pages.treasury.workspace.sections.recentMoneyInDesc}
              rows={recentInflows}
              mode="inflow"
            />
            <LedgerList
              title={t.pages.treasury.workspace.sections.recentMoneyOut}
              description={t.pages.treasury.workspace.sections.recentMoneyOutDesc}
              rows={recentOutflows}
              mode="outflow"
            />
          </div>
        </div>
      ) : null}

      {mainTab === "record_expenses" ? (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <MoneyOutForm churchSlug={churchSlug} options={mergedFormOptions} />
          </div>

          <div className="space-y-6">
            <LedgerList
              title={t.pages.treasury.workspace.sections.recentMoneyIn}
              description={t.pages.treasury.workspace.sections.recentMoneyInDesc}
              rows={recentInflows}
              mode="inflow"
            />
            <LedgerList
              title={t.pages.treasury.workspace.sections.recentMoneyOut}
              description={t.pages.treasury.workspace.sections.recentMoneyOutDesc}
              rows={recentOutflows}
              mode="outflow"
            />
          </div>
        </div>
      ) : null}

      {mainTab === "ledger" ? (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <LedgerList
            title={t.pages.treasury.workspace.sections.recentInflows}
            description={t.pages.treasury.workspace.sections.recentInflowsDesc}
            rows={recentInflows}
            mode="inflow"
          />
          <LedgerList
            title={t.pages.treasury.workspace.sections.recentOutflows}
            description={t.pages.treasury.workspace.sections.recentOutflowsDesc}
            rows={recentOutflows}
            mode="outflow"
          />
        </div>
      ) : null}

      {mainTab === "funds" ? (
        <FundsPanel churchSlug={churchSlug} funds={formOptions.funds} />
      ) : null}
    </div>
  );
}
