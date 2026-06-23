import { CheckCircle2, Loader2, RotateCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChurchRefreshIndicatorProps {
  status?: "idle" | "refreshing" | "updated" | "offline";
  label?: string;
  updatedAt?: string;
  className?: string;
}

export function ChurchRefreshIndicator({
  status = "idle",
  label,
  updatedAt,
  className,
}: ChurchRefreshIndicatorProps) {
  const content = {
    idle: {
      icon: <RotateCw className="size-3.5" aria-hidden="true" />,
      text: label ?? (updatedAt ? `Updated ${updatedAt}` : "Up to date"),
      tone: "text-muted-foreground",
    },
    refreshing: {
      icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
      text: label ?? "Refreshing",
      tone: "text-muted-foreground",
    },
    updated: {
      icon: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
      text: label ?? "Updated",
      tone: "text-primary",
    },
    offline: {
      icon: <WifiOff className="size-3.5" aria-hidden="true" />,
      text: label ?? "Waiting for connection",
      tone: "text-muted-foreground",
    },
  }[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        content.tone,
        className
      )}
    >
      {content.icon}
      <span>{content.text}</span>
    </div>
  );
}
