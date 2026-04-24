"use client";

import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, CloudOff } from "lucide-react";
import { useOffline } from "./OfflineProvider";
import { cn } from "@/lib/utils/cn";
import { useEffect, useState } from "react";

export function OfflineStatusBar() {
  const { networkStatus, syncStatus, pendingCount, failedCount, triggerSync } = useOffline();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, render nothing to avoid mismatch.
  // After mount, render the real status.
  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 text-xs text-slate-400 md:inline-flex">
        <Wifi className="h-3 w-3" />
        <span>Loading…</span>
      </div>
    );
  }

  const isOffline = networkStatus === "offline";
  const isSyncing = syncStatus === "syncing";
  const hasFailed = failedCount > 0;
  const isWaiting = syncStatus === "waiting" || (isOffline && pendingCount > 0);

  // Online + idle + nothing pending → subtle indicator
  if (networkStatus === "online" && syncStatus === "idle" && pendingCount === 0 && failedCount === 0) {
    return (
      <div className="hidden items-center gap-1.5 px-3 text-xs text-emerald-700 md:inline-flex">
        <Wifi className="h-3 w-3" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!isOffline && (pendingCount > 0 || failedCount > 0)) {
          triggerSync();
        }
      }}
      disabled={isSyncing || isOffline}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
        isOffline
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : isSyncing
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : hasFailed
              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : isWaiting
                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
      title={
        isOffline
          ? "You are offline. Changes will sync when internet returns."
          : isSyncing
            ? "Syncing changes..."
            : hasFailed
              ? `${failedCount} change(s) failed to sync. Click to retry.`
              : pendingCount > 0
                ? `${pendingCount} change(s) waiting to sync. Click to send now.`
                : "All changes saved"
      }
    >
      {isOffline ? (
        <>
          <CloudOff className="h-3 w-3" />
          <span>Offline mode</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : hasFailed ? (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Sync failed</span>
        </>
      ) : isWaiting || pendingCount > 0 ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Changes waiting to sync</span>
          {pendingCount > 0 ? <span className="ml-0.5">({pendingCount})</span> : null}
        </>
      ) : syncStatus === "all-synced" ? (
        <>
          <CheckCircle className="h-3 w-3" />
          <span>All changes saved</span>
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </>
      )}
    </button>
  );
}
