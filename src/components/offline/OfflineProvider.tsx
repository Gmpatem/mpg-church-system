"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNetworkStatus, type SyncStatus } from "@/lib/offline/status";
import { startSyncListener, syncPendingMutations, countPendingSync, countFailedSync, type SyncResult } from "@/lib/offline/sync";

type OfflineContextValue = {
  networkStatus: "online" | "offline";
  syncStatus: SyncStatus;
  pendingCount: number;
  failedCount: number;
  lastSyncResult: SyncResult | null;
  triggerSync: () => Promise<SyncResult>;
};

const OfflineContext = createContext<OfflineContextValue>({
  networkStatus: "online",
  syncStatus: "idle",
  pendingCount: 0,
  failedCount: 0,
  lastSyncResult: null,
  triggerSync: async () => ({ processed: 0, succeeded: 0, failed: 0, errors: [] }),
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({
  children,
  churchSlug,
}: {
  children: React.ReactNode;
  churchSlug: string;
}) {
  const networkStatus = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshCounts = useCallback(async () => {
    const [pending, failed] = await Promise.all([
      countPendingSync(churchSlug),
      countFailedSync(churchSlug),
    ]);
    setPendingCount(pending);
    setFailedCount(failed);

    if (pending > 0 && networkStatus === "offline") {
      setSyncStatus("waiting");
    } else if (pending === 0 && failed === 0) {
      setSyncStatus("idle");
    } else if (pending === 0 && failed > 0) {
      setSyncStatus("failed");
    } else if (networkStatus === "online" && pending > 0) {
      setSyncStatus("syncing");
    }
  }, [churchSlug, networkStatus]);

  const triggerSync = useCallback(async () => {
    setSyncStatus("syncing");
    const result = await syncPendingMutations(churchSlug);
    setLastSyncResult(result);
    await refreshCounts();

    if (result.failed > 0 && result.succeeded === 0) {
      setSyncStatus("failed");
    } else if (result.failed > 0) {
      setSyncStatus("failed");
    } else if (result.succeeded > 0) {
      setSyncStatus("all-synced");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } else {
      setSyncStatus("idle");
    }

    return result;
  }, [churchSlug, refreshCounts]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const cleanup = startSyncListener(churchSlug, (result) => {
      setLastSyncResult(result);
      refreshCounts();
      if (result.processed > 0) {
        if (result.failed === 0) {
          setSyncStatus("all-synced");
          setTimeout(() => setSyncStatus("idle"), 3000);
        } else {
          setSyncStatus("failed");
        }
      }
    });
    return cleanup;
  }, [churchSlug, refreshCounts]);

  useEffect(() => {
    refreshCounts();
  }, [networkStatus, refreshCounts]);

  return (
    <OfflineContext.Provider
      value={{ networkStatus, syncStatus, pendingCount, failedCount, lastSyncResult, triggerSync }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
