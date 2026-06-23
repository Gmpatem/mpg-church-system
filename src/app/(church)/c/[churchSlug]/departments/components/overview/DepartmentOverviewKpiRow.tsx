"use client";

import {
  Building2,
  ChartNoAxesCombined,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { DepartmentsOverviewData } from "../types";
import {
  formatOverviewCurrency,
  formatOverviewNumber,
  formatOverviewPercent,
} from "./overview-utils";
import { DepartmentOverviewKpiCard } from "./DepartmentOverviewKpiCard";

export function DepartmentOverviewKpiRow({
  overview,
}: {
  overview: DepartmentsOverviewData;
}) {
  const activePercent =
    overview.totalDepartments > 0
      ? Math.round((overview.activeDepartments / overview.totalDepartments) * 100)
      : 0;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <DepartmentOverviewKpiCard
        label="Total Departments"
        value={formatOverviewNumber(overview.totalDepartments)}
        description="All departments in church"
        icon={Building2}
        tone="green"
      />
      <DepartmentOverviewKpiCard
        label="Active Departments"
        value={formatOverviewNumber(overview.activeDepartments)}
        description={`${activePercent}% of total departments`}
        icon={UsersRound}
        tone="emerald"
      />
      <DepartmentOverviewKpiCard
        label="Total Members"
        value={formatOverviewNumber(overview.uniqueDepartmentMembers)}
        description="Unique active Department members"
        icon={UserRound}
        tone="blue"
      />
      <DepartmentOverviewKpiCard
        label="Department Funds"
        value={formatOverviewCurrency(
          overview.finance.totalAmount,
          overview.finance.locale,
          overview.finance.currencyCode
        )}
        description="Combined current Department balance"
        icon={WalletCards}
        tone="amber"
      />
      <DepartmentOverviewKpiCard
        label="Budget Utilization"
        value={formatOverviewPercent(overview.finance.utilizationPercent)}
        description={
          overview.finance.utilizationPercent === null
            ? "Utilization unavailable"
            : `${formatOverviewCurrency(
                overview.finance.totalSpent,
                overview.finance.locale,
                overview.finance.currencyCode
              )} spent`
        }
        icon={ChartNoAxesCombined}
        tone="purple"
      />
    </div>
  );
}
