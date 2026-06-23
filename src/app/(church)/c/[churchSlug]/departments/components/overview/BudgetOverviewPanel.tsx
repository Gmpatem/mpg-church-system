"use client";

import { ReceiptText } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import type { DepartmentsOverviewData } from "../types";
import {
  financePalette,
  formatOverviewCurrency,
  formatOverviewPercent,
} from "./overview-utils";

export function BudgetOverviewPanel({
  overview,
}: {
  overview: DepartmentsOverviewData;
}) {
  const finance = overview.finance;
  const chartData = finance.departmentBreakdown
    .filter((row) => (row.primaryAmount ?? 0) !== 0 || (row.spentAmount ?? 0) > 0)
    .map((row, index) => ({
      ...row,
      name: row.departmentName,
      value: Math.max(Math.abs(row.primaryAmount ?? 0), row.spentAmount ?? 0, 1),
      color: financePalette[index % financePalette.length],
    }));

  const hasFinanceData = chartData.length > 0;

  return (
    <section className="flex min-h-[318px] min-w-0 flex-col rounded-xl border border-border bg-background shadow-sm">
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold text-foreground">Budget Overview</h2>
      </div>

      {hasFinanceData ? (
        <div className="grid min-h-0 flex-1 gap-5 px-5 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative mx-auto size-[210px] max-w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.departmentId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(_value, _name, item) =>
                    formatOverviewCurrency(
                      item.payload.primaryAmount,
                      finance.locale,
                      finance.currencyCode
                    )
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="max-w-[126px] text-lg font-semibold leading-tight text-foreground">
                {formatOverviewCurrency(finance.totalAmount, finance.locale, finance.currencyCode)}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {finance.currencyCode}
              </p>
              <p className="text-xs text-muted-foreground">Department Funds</p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(96px,0.75fr)_minmax(88px,0.7fr)_72px] gap-3 px-1 text-xs font-semibold text-foreground">
              <span />
              <span className="text-right">Current Balance</span>
              <span className="text-right">Expenses</span>
              <span className="text-right">Activity</span>
            </div>
            <div className="mt-3 grid gap-3">
              {chartData.map((row) => (
                <div
                  key={row.departmentId}
                  className="grid min-w-0 grid-cols-[minmax(0,1.45fr)_minmax(96px,0.75fr)_minmax(88px,0.7fr)_72px] items-center gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-foreground">{row.departmentName}</span>
                  </div>
                  <span className="text-right text-foreground">
                    {formatOverviewCurrency(row.primaryAmount, finance.locale, finance.currencyCode)}
                  </span>
                  <span className="text-right text-foreground">
                    {formatOverviewCurrency(row.spentAmount, finance.locale, finance.currencyCode)}
                  </span>
                  <span className="justify-self-end rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {formatOverviewPercent(row.utilizationPercent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-5 py-6">
          <div className="max-w-md text-center">
            <h3 className="text-sm font-semibold text-foreground">No Department finance activity yet</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Department fund balances and expenses will appear here when Treasury records are added.
            </p>
          </div>
        </div>
      )}

      <Separator />
      <div className="flex min-h-11 flex-col items-start gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex min-w-0 items-center gap-2 text-foreground">
          <ReceiptText className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Department fund activity for {overview.reportingPeriod.label}</span>
        </p>
        <span className="shrink-0 font-semibold text-primary">
          {finance.totalSpent === null
            ? "No expenses recorded"
            : `${formatOverviewCurrency(finance.totalSpent, finance.locale, finance.currencyCode)} spent`}
        </span>
      </div>
    </section>
  );
}
