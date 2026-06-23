"use client";

import type { ReactNode } from "react";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ChurchButton } from "../primitives/ChurchButton";

interface ChurchSelectionAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
}

interface ChurchSelectionStateProps {
  selectedCount: number;
  label?: string;
  actions?: ChurchSelectionAction[];
  children?: ReactNode;
  className?: string;
}

export function ChurchSelectionState({
  selectedCount,
  label,
  actions = [],
  children,
  className,
}: ChurchSelectionStateProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 font-medium text-foreground">
        <CheckSquare
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span>{label ?? `${selectedCount} selected`}</span>
      </div>
      {children ? <div className="min-w-0 flex-1">{children}</div> : null}
      {actions.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions.map((action) => (
            <ChurchButton
              key={action.label}
              type="button"
              size="sm"
              variant={action.variant ?? "outline"}
              onClick={action.onClick}
            >
              {action.label}
            </ChurchButton>
          ))}
        </div>
      ) : null}
    </div>
  );
}
