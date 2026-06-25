"use client";

import { cn } from "@/lib/utils/cn";
import type { EventsCanonicalTab } from "@/features/events/types";

const tabs: Array<{ key: EventsCanonicalTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "events", label: "Events" },
  { key: "calendar", label: "Calendar" },
];

export function EventsTabBar({
  activeTab,
  onChange,
}: {
  activeTab: EventsCanonicalTab;
  onChange: (tab: EventsCanonicalTab) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <div role="tablist" aria-label="Events workspace sections" className="flex min-w-0 overflow-x-auto px-3">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              id={`events-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`events-panel-${tab.key}`}
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
    </div>
  );
}
