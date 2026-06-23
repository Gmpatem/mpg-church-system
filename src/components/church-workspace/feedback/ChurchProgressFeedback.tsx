import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import type { ChurchProgressState } from "../types";

interface ChurchProgressFeedbackProps extends ChurchProgressState {
  className?: string;
}

export function ChurchProgressFeedback({
  value,
  label,
  description,
  indeterminate = false,
  className,
}: ChurchProgressFeedbackProps) {
  const clampedValue =
    typeof value === "number" ? Math.max(0, Math.min(100, value)) : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {!indeterminate && typeof clampedValue === "number" ? (
          <span className="shrink-0 text-muted-foreground">
            {Math.round(clampedValue)}%
          </span>
        ) : null}
      </div>
      <Progress
        value={indeterminate ? undefined : clampedValue}
        aria-label={label}
        aria-valuetext={indeterminate ? "In progress" : undefined}
      />
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
