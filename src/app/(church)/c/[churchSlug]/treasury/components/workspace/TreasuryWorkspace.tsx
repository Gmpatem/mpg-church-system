"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChurchPageFrame } from "@/components/church-workspace/patterns/ChurchPageFrame";
import type { TreasuryDialog, TreasuryPeriodKey, TreasuryReconciliationView, TreasuryTabKey } from "./types";
import { TreasuryDialogsHost } from "./TreasuryDialogsHost";
import { TreasuryTabBar } from "./TreasuryTabBar";
import { TreasuryWorkspaceHeader } from "./TreasuryWorkspaceHeader";
import { TreasuryFundsTab } from "./tabs/TreasuryFundsTab";
import { TreasuryOverviewTab } from "./tabs/TreasuryOverviewTab";
import { TreasuryReconciliationTab } from "./tabs/TreasuryReconciliationTab";
import { TreasuryRequestsTab } from "./tabs/TreasuryRequestsTab";
import { TreasuryTransactionsTab } from "./tabs/TreasuryTransactionsTab";
import { TreasuryTransfersTab } from "./tabs/TreasuryTransfersTab";
import { isWithinPeriod } from "./utils";

const validTabs: TreasuryTabKey[] = ["overview", "transactions", "funds", "requests", "transfers", "reconciliation"];
const validPeriods: TreasuryPeriodKey[] = ["this-week", "this-month", "this-quarter", "this-year", "custom"];
const validViews: TreasuryReconciliationView[] = ["exceptions", "remittance", "allocations", "audit"];

function normalizeTab(value?: string): TreasuryTabKey {
  return validTabs.includes(value as TreasuryTabKey) ? (value as TreasuryTabKey) : "overview";
}

function normalizePeriod(value?: string): TreasuryPeriodKey {
  return validPeriods.includes(value as TreasuryPeriodKey) ? (value as TreasuryPeriodKey) : "this-month";
}

function normalizeView(value?: string): TreasuryReconciliationView {
  return validViews.includes(value as TreasuryReconciliationView)
    ? (value as TreasuryReconciliationView)
    : "exceptions";
}

export function TreasuryWorkspace({
  churchSlug,
  data,
  alreadyTithedIds,
  initialTab,
  initialView,
  initialPeriod,
  initialFrom,
  initialTo,
  initialEntityId,
  initialRequestSearch,
  initialRequestStatus,
  initialAuditSearch,
  initialAuditEntityType,
  initialAuditActionType,
  initialAuditChangedBy,
}: {
  churchSlug: string;
  data: any;
  alreadyTithedIds?: string[];
  initialTab?: string;
  initialView?: string;
  initialPeriod?: string;
  initialFrom?: string;
  initialTo?: string;
  initialEntityId?: string;
  initialRequestSearch?: string;
  initialRequestStatus?: string;
  initialAuditSearch?: string;
  initialAuditEntityType?: string;
  initialAuditActionType?: string;
  initialAuditChangedBy?: string;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<TreasuryTabKey>(() => normalizeTab(initialTab));
  const [reconciliationView, setReconciliationViewState] = useState<TreasuryReconciliationView>(() => normalizeView(initialView));
  const [period, setPeriod] = useState<TreasuryPeriodKey>(() => normalizePeriod(initialPeriod));
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");
  const [dialog, setDialog] = useState<TreasuryDialog>(null);

  function updateUrl(next: {
    tab?: TreasuryTabKey;
    view?: TreasuryReconciliationView;
    period?: TreasuryPeriodKey;
    from?: string;
    to?: string;
  }) {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextTab = next.tab ?? activeTab;
    const nextPeriod = next.period ?? period;
    const nextView = next.view ?? reconciliationView;

    if (nextTab === "overview") params.delete("tab");
    else params.set("tab", nextTab);

    if (nextTab === "reconciliation" && nextView !== "exceptions") params.set("view", nextView);
    else if (nextTab === "reconciliation" && nextView === "exceptions") params.set("view", "exceptions");
    else params.delete("view");

    if (nextPeriod === "this-month") params.delete("period");
    else params.set("period", nextPeriod);

    const nextFrom = next.from ?? from;
    const nextTo = next.to ?? to;
    if (nextPeriod === "custom") {
      if (nextFrom) params.set("from", nextFrom);
      else params.delete("from");
      if (nextTo) params.set("to", nextTo);
      else params.delete("to");
    } else {
      params.delete("from");
      params.delete("to");
    }

    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function setActiveTab(tab: TreasuryTabKey) {
    setActiveTabState(tab);
    updateUrl({ tab });
  }

  function setReconciliationView(view: TreasuryReconciliationView) {
    setReconciliationViewState(view);
    updateUrl({ tab: "reconciliation", view });
  }

  function setPeriodState(next: { period: TreasuryPeriodKey; from?: string; to?: string }) {
    setPeriod(next.period);
    if (next.from !== undefined) setFrom(next.from);
    if (next.to !== undefined) setTo(next.to);
    updateUrl(next);
  }

  const filteredLedgerRows = useMemo(
    () =>
      (data.workspace?.ledgerRows ?? []).filter((row: any) =>
        isWithinPeriod(row.date, period, from, to)
      ),
    [data.workspace?.ledgerRows, from, period, to]
  );

  const periodMetrics = useMemo(() => {
    const moneyIn = filteredLedgerRows
      .filter((row: any) => row.direction === "inflow")
      .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
    const moneyOut = filteredLedgerRows
      .filter((row: any) => row.direction === "outflow")
      .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
    return {
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
      transactions: filteredLedgerRows.length,
      inflows: filteredLedgerRows.filter((row: any) => row.direction === "inflow").length,
      outflows: filteredLedgerRows.filter((row: any) => row.direction === "outflow").length,
    };
  }, [filteredLedgerRows]);

  return (
    <ChurchPageFrame className="church-workspace min-w-0 space-y-4">
      <TreasuryWorkspaceHeader
        onDialogChange={setDialog}
        onTabChange={setActiveTab}
        onReconciliationViewChange={setReconciliationView}
      />
      <TreasuryTabBar
        activeTab={activeTab}
        period={period}
        from={from}
        to={to}
        onChange={setActiveTab}
        onPeriodChange={setPeriodState}
      />

      <section id="treasury-panel-overview" role="tabpanel" aria-labelledby="treasury-tab-overview" hidden={activeTab !== "overview"} className="min-w-0">
        {activeTab === "overview" ? (
          <TreasuryOverviewTab
            data={data}
            ledgerRows={filteredLedgerRows}
            periodMetrics={periodMetrics}
            onOpenTab={setActiveTab}
            onOpenDialog={setDialog}
            onOpenReconciliation={setReconciliationView}
          />
        ) : null}
      </section>
      <section id="treasury-panel-transactions" role="tabpanel" aria-labelledby="treasury-tab-transactions" hidden={activeTab !== "transactions"} className="min-w-0">
        {activeTab === "transactions" ? (
          <TreasuryTransactionsTab data={data} rows={filteredLedgerRows} periodMetrics={periodMetrics} onOpenDialog={setDialog} />
        ) : null}
      </section>
      <section id="treasury-panel-funds" role="tabpanel" aria-labelledby="treasury-tab-funds" hidden={activeTab !== "funds"} className="min-w-0">
        {activeTab === "funds" ? (
          <TreasuryFundsTab
            churchSlug={churchSlug}
            data={data}
            onOpenDialog={setDialog}
            onOpenTransactions={() => setActiveTab("transactions")}
          />
        ) : null}
      </section>
      <section id="treasury-panel-requests" role="tabpanel" aria-labelledby="treasury-tab-requests" hidden={activeTab !== "requests"} className="min-w-0">
        {activeTab === "requests" ? (
          <TreasuryRequestsTab
            churchSlug={churchSlug}
            data={data}
            initialSearch={initialRequestSearch}
            initialStatus={initialRequestStatus}
          />
        ) : null}
      </section>
      <section id="treasury-panel-transfers" role="tabpanel" aria-labelledby="treasury-tab-transfers" hidden={activeTab !== "transfers"} className="min-w-0">
        {activeTab === "transfers" ? <TreasuryTransfersTab data={data} onOpenDialog={setDialog} /> : null}
      </section>
      <section id="treasury-panel-reconciliation" role="tabpanel" aria-labelledby="treasury-tab-reconciliation" hidden={activeTab !== "reconciliation"} className="min-w-0">
        {activeTab === "reconciliation" ? (
          <TreasuryReconciliationTab
            churchSlug={churchSlug}
            data={data}
            view={reconciliationView}
            initialEntityId={initialEntityId}
            initialAuditSearch={initialAuditSearch}
            initialAuditEntityType={initialAuditEntityType}
            initialAuditActionType={initialAuditActionType}
            initialAuditChangedBy={initialAuditChangedBy}
            onViewChange={setReconciliationView}
            onOpenDialog={setDialog}
          />
        ) : null}
      </section>

      <TreasuryDialogsHost
        churchSlug={churchSlug}
        dialog={dialog}
        onDialogChange={setDialog}
        data={data}
        alreadyTithedIds={alreadyTithedIds ?? []}
      />
    </ChurchPageFrame>
  );
}
