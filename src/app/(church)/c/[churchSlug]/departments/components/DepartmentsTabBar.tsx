"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DepartmentOverviewReportingPeriod, DepartmentTabKey } from "./types";

const tabs: Array<{ key: DepartmentTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "action-plan", label: "Action Plan" },
  { key: "activities", label: "Activities" },
  { key: "people", label: "People" },
  { key: "budget", label: "Budget" },
  { key: "documents", label: "Documents" },
];

export function DepartmentsTabBar({
  activeTab,
  reportingPeriod,
  onChange,
}: {
  activeTab: DepartmentTabKey;
  reportingPeriod?: DepartmentOverviewReportingPeriod;
  onChange: (tab: DepartmentTabKey) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-border bg-transparent sm:flex-row sm:items-end sm:justify-between">
      <div
        role="tablist"
        aria-label="Department workspace sections"
        className="flex min-w-0 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              id={`departments-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`departments-panel-${tab.key}`}
              onClick={() => onChange(tab.key)}
              className={cn(
                "relative h-12 shrink-0 px-4 text-sm font-medium text-muted-foreground transition first:pl-0 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-5",
                isActive && "text-primary"
              )}
            >
              {tab.label}
              {isActive ? (
                <span
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary first:left-0 md:inset-x-5"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {reportingPeriod ? (
        <label className="mb-2 flex h-10 w-full shrink-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm sm:w-auto">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Department reporting period</span>
          <select
            aria-label="Department reporting period"
            value={reportingPeriod.value}
            disabled
            className="min-w-0 bg-transparent text-sm font-medium outline-none disabled:cursor-default disabled:opacity-100"
          >
            <option value={reportingPeriod.value}>{reportingPeriod.label}</option>
          </select>
        </label>
      ) : null}
    </div>
  );
}
