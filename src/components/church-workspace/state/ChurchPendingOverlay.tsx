import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChurchPendingOverlayProps {
  pending?: boolean;
  label?: string;
  className?: string;
}

export function ChurchPendingOverlay({
  pending = false,
  label = "Working",
  className,
}: ChurchPendingOverlayProps) {
  if (!pending) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[1px]",
        className
      )}
    >
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
