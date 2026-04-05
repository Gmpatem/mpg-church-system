"use client";

import { useMemo, useState } from "react";
import { MoneyInForm } from "../in/new/MoneyInForm";
import { MoneyOutForm } from "../out/new/MoneyOutForm";
import { TitheEntryForm } from "./TitheEntryForm";
import { useTreasuryMembers } from "@/features/treasury/hooks";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";

type MainTab = "weekly_entry" | "money_out" | "review_ledger" | "funds";
type WeeklyTab = "tithe" | "offering" | "donation";
type OutflowTab = "expense" | "project" | "mission" | "department";

interface TreasuryWorkspaceProps {
  churchSlug: string;
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

const MAIN_TABS: WorkspaceTabItem[] = [
  { key: "weekly_entry", label: "Weekly Entry" },
  { key: "money_out", label: "Money Out" },
  { key: "review_ledger", label: "Review Ledger" },
  { key: "funds", label: "Funds" },
];

const WEEKLY_TABS: WorkspaceTabItem[] = [
  { key: "tithe", label: "Tithe" },
  { key: "offering", label: "Offering" },
  { key: "donation", label: "Gift / Donation", shortLabel: "Donation" },
];

const OUTFLOW_TABS: WorkspaceTabItem[] = [
  { key: "expense", label: "Expense" },
  { key: "project", label: "Project" },
  { key: "mission", label: "Mission / District", shortLabel: "Mission" },
  { key: "department", label: "Department" },
];

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
  return (
    <WorkspaceSectionCard title={title} description={description}>
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title={mode === "inflow" ? "No money-in records yet" : "No money-out records yet"}
          message={
            mode === "inflow"
              ? "Treasury inflows will appear here once tithe, offering, or donation entries are recorded."
              : "Treasury outflows will appear here once expense, project, mission, or department spending is recorded."
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
                  Amount: {formatAmount(Number(item.amount || 0))}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Date: {mode === "inflow" ? item.inflow_date : item.outflow_date}
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
  return (
    <WorkspaceSectionCard
      title="Treasury Funds"
      description="Active funds available for incoming and outgoing treasury activity."
    >
      {funds.length === 0 ? (
        <WorkspaceEmptyState
          title="No active funds found"
          message="Create or seed treasury funds so offerings, tithe, donations, and spending can be classified correctly."
          actionLabel="Open Reports"
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
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
      Loading member options for treasury entry...
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
  dashboard,
  recentInflows,
  recentOutflows,
  formOptions,
}: TreasuryWorkspaceProps) {
  const [mainTab, setMainTab] = useState<MainTab>("weekly_entry");
  const [weeklyTab, setWeeklyTab] = useState<WeeklyTab>("tithe");
  const [outflowTab, setOutflowTab] = useState<OutflowTab>("expense");

  const needsMembers = mainTab === "weekly_entry" || mainTab === "money_out";
  const memberLoader = useTreasuryMembers(churchSlug, needsMembers);

  const mergedFormOptions = useMemo(() => ({
    ...formOptions,
    members: memberLoader.loaded ? memberLoader.members : formOptions.members,
  }), [formOptions, memberLoader.loaded, memberLoader.members]);

  const moneyInDefaults = useMemo(() => {
    if (weeklyTab === "tithe") {
      return {
        inflowType: "tithe",
        fundCode: "tithe",
      };
    }

    if (weeklyTab === "offering") {
      return {
        inflowType: "offering",
        fundCode: "local_budget",
      };
    }

    return {
      inflowType: "donation",
      fundCode: "special_donation",
    };
  }, [weeklyTab]);

  const moneyOutDefaults = useMemo(() => {
    if (outflowTab === "project") return { outflowType: "project" };
    if (outflowTab === "mission") return { outflowType: "mission_remittance" };
    if (outflowTab === "department") return { outflowType: "department_expense" };
    return { outflowType: "operations" };
  }, [outflowTab]);

  const inflowTypeSummary = dashboard.inflowByType
    .map((item) => `${item.type}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  const outflowTypeSummary = dashboard.outflowByType
    .map((item) => `${item.type}: ${formatAmount(Number(item.amount || 0))}`)
    .slice(0, 3)
    .join(" • ");

  return (
    <div className="space-y-6">
      <WorkspaceHero
        eyebrow="Treasury Control Center"
        title="Treasury Workspace"
        description="One-page financial operations center for tithe, offerings, donations, disbursements, funds, and ledger review."
        badges={[
          `${dashboard.fundCount} funds`,
          `${dashboard.linkedInflowsCount} linked entries`,
          `${dashboard.anonymousInflowsCount} anonymous entries`,
        ]}
        actions={[
          { label: "Money In", href: `/c/${churchSlug}/treasury/in`, variant: "primary" },
          { label: "Money Out", href: `/c/${churchSlug}/treasury/out`, variant: "secondary" },
          { label: "Audit Trail", href: `/c/${churchSlug}/treasury/audit`, variant: "outline" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <WorkspaceStatCard label="Funds" value={dashboard.fundCount} hint="Active treasury funds" />
        <WorkspaceStatCard label="Total In" value={formatAmount(dashboard.totalIn)} hint={inflowTypeSummary || "No inflow activity yet"} />
        <WorkspaceStatCard label="Total Out" value={formatAmount(dashboard.totalOut)} hint={outflowTypeSummary || "No outflow activity yet"} />
        <WorkspaceStatCard label="Net Balance" value={formatAmount(dashboard.netBalance)} hint="Treasury inflow minus outflow" />
        <WorkspaceStatCard label="Linked Contributions" value={dashboard.linkedInflowsCount} hint="Member-linked entries" />
        <WorkspaceStatCard label="Anonymous Contributions" value={dashboard.anonymousInflowsCount} hint="Anonymous inflow entries" />
      </div>

      <WorkspaceControlRail
        title="Treasury Modes"
        description="Switch between weekly entry, spending, ledger review, and fund management without leaving the workspace."
      >
        <WorkspaceTabs
          items={MAIN_TABS}
          activeKey={mainTab}
          onChange={(key) => setMainTab(key as MainTab)}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </WorkspaceControlRail>

      {(mainTab === "weekly_entry" || mainTab === "money_out") && memberLoader.loading && !memberLoader.loaded ? (
        <MemberOptionsLoading />
      ) : null}

      {(mainTab === "weekly_entry" || mainTab === "money_out") && memberLoader.error ? (
        <MemberOptionsError message={memberLoader.error} />
      ) : null}

      {mainTab === "weekly_entry" ? (
        <div className="space-y-6">
          <WorkspaceControlRail
            title="Weekly Entry Types"
            description="Use fast tabs for tithe, offering, and gift or donation entry."
          >
            <WorkspaceTabs
              items={WEEKLY_TABS}
              activeKey={weeklyTab}
              onChange={(key) => setWeeklyTab(key as WeeklyTab)}
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </WorkspaceControlRail>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
            <div className="space-y-6">
              {weeklyTab === "tithe" ? (
                <TitheEntryForm churchSlug={churchSlug} options={mergedFormOptions} />
              ) : (
                <MoneyInForm
                  churchSlug={churchSlug}
                  options={mergedFormOptions}
                  defaults={moneyInDefaults}
                  modeLabel={weeklyTab === "offering" ? "Offering Entry" : "Gift / Donation Entry"}
                />
              )}
            </div>

            <div className="space-y-6">
              <LedgerList
                title="Recent Money In"
                description="Latest treasury inflow records for fast verification."
                rows={recentInflows}
                mode="inflow"
              />
              <LedgerList
                title="Recent Money Out"
                description="Latest treasury spending records for quick oversight."
                rows={recentOutflows}
                mode="outflow"
              />
            </div>
          </div>
        </div>
      ) : null}

      {mainTab === "money_out" ? (
        <div className="space-y-6">
          <WorkspaceControlRail
            title="Spending Modes"
            description="Switch between operating expense, project, mission, and department disbursement entry."
          >
            <WorkspaceTabs
              items={OUTFLOW_TABS}
              activeKey={outflowTab}
              onChange={(key) => setOutflowTab(key as OutflowTab)}
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </WorkspaceControlRail>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
            <div className="space-y-6">
              <MoneyOutForm
                churchSlug={churchSlug}
                options={mergedFormOptions}
                defaults={moneyOutDefaults}
                modeLabel={
                  outflowTab === "expense"
                    ? "Expense Entry"
                    : outflowTab === "project"
                      ? "Project Spending Entry"
                      : outflowTab === "mission"
                        ? "Mission / District Entry"
                        : "Department Expense Entry"
                }
              />
            </div>

            <div className="space-y-6">
              <LedgerList
                title="Recent Money In"
                description="Latest treasury inflow records for context while recording spending."
                rows={recentInflows}
                mode="inflow"
              />
              <LedgerList
                title="Recent Money Out"
                description="Latest treasury spending records for quick review."
                rows={recentOutflows}
                mode="outflow"
              />
            </div>
          </div>
        </div>
      ) : null}

      {mainTab === "review_ledger" ? (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <LedgerList
            title="Recent Inflows"
            description="Latest treasury receipts and money-in activity."
            rows={recentInflows}
            mode="inflow"
          />
          <LedgerList
            title="Recent Outflows"
            description="Latest treasury disbursements and money-out activity."
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
