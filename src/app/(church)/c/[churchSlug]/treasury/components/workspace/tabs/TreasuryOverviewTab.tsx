"use client";

import { AlertTriangle, ArrowDown, ArrowUp, ClipboardList, Landmark } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TreasuryDialog, TreasuryReconciliationView, TreasuryTabKey } from "../types";
import { TreasuryAmount, TreasuryEmptyState, TreasuryPanel, TreasuryStatusBadge, TreasurySummaryStrip } from "../shared";
import { formatDate, formatTreasuryAmount, percent } from "../utils";

function buildTrend(rows: any[]) {
  const byDate = new Map<string, { date: string; in: number; out: number }>();
  for (const row of rows) {
    const date = row.date || "Unknown";
    const current = byDate.get(date) ?? { date, in: 0, out: 0 };
    if (row.direction === "inflow") current.in += Number(row.amount || 0);
    else current.out += Number(row.amount || 0);
    byDate.set(date, current);
  }
  return Array.from(byDate.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-8)
    .map((item) => ({
      date: formatDate(item.date).replace(", 2026", ""),
      inflows: item.in,
      outflows: item.out,
    }));
}

export function TreasuryOverviewTab({
  data,
  ledgerRows,
  periodMetrics,
  onOpenTab,
  onOpenDialog,
  onOpenReconciliation,
}: {
  data: any;
  ledgerRows: any[];
  periodMetrics: any;
  onOpenTab: (tab: TreasuryTabKey) => void;
  onOpenDialog: (dialog: TreasuryDialog) => void;
  onOpenReconciliation: (view: TreasuryReconciliationView) => void;
}) {
  const funds = data.workspace?.funds ?? [];
  const topFunds = [...funds].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0)).slice(0, 4);
  const trend = buildTrend(ledgerRows);
  const recent = ledgerRows.slice(0, 5);
  const exceptions = data.workspace?.exceptions ?? [];
  const totalBalance = Number(data.workspace?.summary?.combinedFundBalance ?? data.dashboard.netBalance ?? 0);

  return (
    <div className="min-w-0 space-y-4">
      <TreasurySummaryStrip
        items={[
          { label: "Money In", value: formatTreasuryAmount(periodMetrics.moneyIn), hint: `${periodMetrics.inflows} entries`, icon: <ArrowDown className="size-6" />, tone: "green" },
          { label: "Money Out", value: formatTreasuryAmount(periodMetrics.moneyOut), hint: `${periodMetrics.outflows} expenses`, icon: <ArrowUp className="size-6" />, tone: "red" },
          { label: "Net Movement", value: formatTreasuryAmount(periodMetrics.net), hint: "Income minus expenses", icon: <Landmark className="size-6" />, tone: periodMetrics.net >= 0 ? "green" : "red" },
          { label: "Open Exceptions", value: exceptions.length, hint: "Requires Treasury attention", icon: <AlertTriangle className="size-6" />, tone: exceptions.length ? "amber" : "green" },
        ]}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <TreasuryPanel title="Cash Flow Overview" contentClassName="p-5">
          {trend.length === 0 ? (
            <TreasuryEmptyState
              title="No Treasury activity yet"
              message="Record the first money-in or money-out entry to begin tracking church finances."
              action={<Button type="button" onClick={() => onOpenDialog({ type: "money-in" })}>Record Money In</Button>}
            />
          ) : (
            <div className="h-[280px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="treasuryIn" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="treasuryOut" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value) => formatTreasuryAmount(Number(value))} />
                  <Area type="monotone" dataKey="inflows" stroke="hsl(var(--primary))" fill="url(#treasuryIn)" strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="outflows" stroke="#dc2626" fill="url(#treasuryOut)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </TreasuryPanel>

        <TreasuryPanel title="Fund Balances" action={<Button type="button" variant="link" className="h-8 px-0" onClick={() => onOpenTab("funds")}>View all funds</Button>} contentClassName="p-5">
          {topFunds.length === 0 ? (
            <TreasuryEmptyState title="No Treasury funds have been configured." message="Create a fund to start classifying money-in and money-out records." />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Combined Balance</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">{formatTreasuryAmount(totalBalance)}</p>
              </div>
              {topFunds.map((fund) => {
                const width = percent(Math.max(0, Number(fund.balance || 0)), Math.max(1, Math.max(...topFunds.map((item) => Math.max(0, Number(item.balance || 0))))));
                return (
                  <button key={fund.fund_id} type="button" onClick={() => onOpenTab("funds")} className="w-full rounded-lg p-1 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{fund.fund_name}</p>
                        <p className="text-xs text-muted-foreground">{fund.fund_code || fund.fund_type}</p>
                      </div>
                      <TreasuryAmount value={fund.balance} direction={Number(fund.balance || 0) < 0 ? "outflow" : "inflow"} />
                    </div>
                    <Progress value={width} className="mt-2 h-2" />
                  </button>
                );
              })}
            </div>
          )}
        </TreasuryPanel>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <TreasuryPanel title="Recent Transactions" action={<Button type="button" variant="link" className="h-8 px-0" onClick={() => onOpenTab("transactions")}>View all</Button>} contentClassName="p-0">
          {recent.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No transactions match the current filters." message="Use Record Money In or Record Money Out to add Treasury activity." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((row) => (
                <div key={row.id} className="flex min-h-[64px] items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{row.source_label}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.fund_name} · {formatDate(row.date)}</p>
                  </div>
                  <TreasuryAmount value={row.amount} direction={row.direction} />
                </div>
              ))}
            </div>
          )}
        </TreasuryPanel>

        <TreasuryPanel title="Treasury Attention" action={<Button type="button" variant="link" className="h-8 px-0" onClick={() => { onOpenTab("reconciliation"); onOpenReconciliation("exceptions"); }}>Review</Button>} contentClassName="p-5">
          {exceptions.length === 0 ? (
            <TreasuryEmptyState title="All clear" message="No current Treasury exceptions require attention." />
          ) : (
            <div className="space-y-3">
              {exceptions.slice(0, 4).map((item: any) => (
                <button key={item.id} type="button" onClick={() => { onOpenTab("reconciliation"); onOpenReconciliation("exceptions"); }} className="flex w-full items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{item.entityLabel || item.entityType}</span>
                  </span>
                  <TreasuryStatusBadge status={item.severity} />
                </button>
              ))}
              <Button type="button" variant="outline" className="h-10 w-full rounded-lg" onClick={() => onOpenDialog({ type: "run-remittance" })}>
                <ClipboardList className="mr-2 size-4" aria-hidden="true" />
                Pending remittance: {formatTreasuryAmount(data.remittance.pendingAmount)}
              </Button>
            </div>
          )}
        </TreasuryPanel>
      </div>
    </div>
  );
}
