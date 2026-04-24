"use client";

import { HardDrive } from "lucide-react";
import { useNetworkStatus } from "@/lib/offline/status";

interface OfflineDataBannerProps {
  cachedAt?: Date | string | null;
}

export function OfflineDataBanner({ cachedAt }: OfflineDataBannerProps) {
  const networkStatus = useNetworkStatus();

  if (networkStatus === "online") return null;

  const timeLabel = cachedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(cachedAt))
    : "earlier";

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <HardDrive className="h-3.5 w-3.5 shrink-0" />
      <span>
        Showing saved data from this device (saved {timeLabel}). Some information may be outdated.
      </span>
    </div>
  );
}
