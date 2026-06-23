import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ChurchSaveState } from "../types";

interface ChurchSaveStatusProps {
  state: ChurchSaveState;
  className?: string;
}

const saveStateContent: Record<
  ChurchSaveState,
  { label: string; icon: ReactNode; className: string }
> = {
  idle: {
    label: "No changes",
    icon: <Circle className="size-3" aria-hidden="true" />,
    className: "text-muted-foreground",
  },
  dirty: {
    label: "Unsaved changes",
    icon: <Circle className="size-3 fill-current" aria-hidden="true" />,
    className: "text-muted-foreground",
  },
  saving: {
    label: "Saving",
    icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
    className: "text-muted-foreground",
  },
  saved: {
    label: "Saved",
    icon: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
    className: "text-primary",
  },
  error: {
    label: "Save failed",
    icon: <AlertCircle className="size-3.5" aria-hidden="true" />,
    className: "text-destructive",
  },
};

export function ChurchSaveStatus({ state, className }: ChurchSaveStatusProps) {
  const content = saveStateContent[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        content.className,
        className
      )}
    >
      {content.icon}
      <span>{content.label}</span>
    </div>
  );
}
