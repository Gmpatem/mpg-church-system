"use client";

import { useEffect, useState } from "react";

export type NetworkStatus = "online" | "offline";
export type SyncStatus = "idle" | "syncing" | "waiting" | "failed" | "all-synced";

function getInitialNetworkStatus(): NetworkStatus {
  if (typeof navigator === "undefined") return "online";
  return navigator.onLine ? "online" : "offline";
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>("online");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatus(getInitialNetworkStatus());

    function handleOnline() {
      setStatus("online");
    }
    function handleOffline() {
      setStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Return stable "online" during SSR and initial hydration to prevent mismatch.
  // After mount, return the real status.
  if (!mounted) return "online";
  return status;
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
