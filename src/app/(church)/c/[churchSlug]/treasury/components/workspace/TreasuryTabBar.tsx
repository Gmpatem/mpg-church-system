"use client";

import { cn } from "@/lib/utils/cn";
import type { TreasuryPeriodKey, TreasuryTabKey } from "./types";
import { TREASURY_TABS } from "./types";
import { TreasuryDateRangeSelector } from "./TreasuryDateRangeSelector";

export function TreasuryTabBar({
  activeTab,
  period,
  from,
  to,
  onChange,
  onPeriodChange,
}: {
  activeTab: TreasuryTabKey;
  period: TreasuryPeriodKey;
  from: string;
  to: string;
  onChange: (tab: TreasuryTabKey) => void;
  onPeriodChange: (next: { period: TreasuryPeriodKey; from?: string; to?: string }) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <div className="flex min-w-0 flex-col gap-2 px-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Treasury workspace sections" className="flex min-w-0 overflow-x-auto">
          {TREASURY_TABS.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                id={`treasury-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`treasury-panel-${tab.key}`}
                onClick={() => onChange(tab.key)}
                className={cn(
                  "relative h-12 shrink-0 px-5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isActive && "text-primary"
                )}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="pb-3 md:pb-0">
          <TreasuryDateRangeSelector period={period} from={from} to={to} onChange={onPeriodChange} />
        </div>
      </div>
    </div>
  );
}

