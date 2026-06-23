"use client";

import type { ChurchOfflineActionStatus } from "../types";
import { ChurchActionFeedback } from "./ChurchActionFeedback";

interface ChurchOfflineActionStateProps {
  status: ChurchOfflineActionStatus;
  onRetry?: () => void;
}

const copy: Record<
  ChurchOfflineActionStatus,
  {
    title: string;
    description: string;
    variant: "success" | "info" | "offline" | "progress" | "error";
  }
> = {
  online: {
    title: "Online",
    description: "Workspace actions are syncing normally.",
    variant: "success",
  },
  offline: {
    title: "Offline",
    description: "New actions will be held locally until the connection returns.",
    variant: "offline",
  },
  queued: {
    title: "Queued",
    description: "This action is saved locally and waiting to sync.",
    variant: "info",
  },
  syncing: {
    title: "Syncing",
    description: "Queued church workspace actions are being sent now.",
    variant: "progress",
  },
  synced: {
    title: "Synced",
    description: "Queued church workspace actions are up to date.",
    variant: "success",
  },
  failed: {
    title: "Sync failed",
    description: "The action is still queued. Check the connection and retry.",
    variant: "error",
  },
};

export function ChurchOfflineActionState({
  status,
  onRetry,
}: ChurchOfflineActionStateProps) {
  const state = copy[status];

  return (
    <ChurchActionFeedback
      variant={state.variant}
      title={state.title}
      description={state.description}
      actionLabel={status === "failed" && onRetry ? "Retry" : undefined}
      onAction={status === "failed" ? onRetry : undefined}
    />
  );
}
