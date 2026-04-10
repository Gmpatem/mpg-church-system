"use client";

import { cn } from "@/lib/utils/cn";

export interface WorkspaceTabItem {
  key: string;
  label: string;
  shortLabel?: string;
}

interface WorkspaceTabsProps {
  items: WorkspaceTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function WorkspaceTabs({
  items,
  activeKey,
  onChange,
  className,
}: WorkspaceTabsProps) {
  return (
    <div className={cn("mobile-fade-up rounded-2xl border border-slate-200 bg-white p-3 shadow-sm", className)}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-pressed={isActive}
              className={cn(
                "mobile-touch-feedback shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {item.shortLabel || item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
