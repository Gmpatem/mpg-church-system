import { cn } from "@/lib/utils/cn";

interface ChurchLiveRegionProps {
  id?: string;
  message?: string;
  politeness?: "polite" | "assertive";
  className?: string;
}

export function ChurchLiveRegion({
  id = "church-workspace-live-region",
  message,
  politeness = "polite",
  className,
}: ChurchLiveRegionProps) {
  return (
    <div
      id={id}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}
