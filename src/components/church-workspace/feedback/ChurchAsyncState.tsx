"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { ChurchAsyncStatus } from "../types";
import { ChurchWorkspaceSkeleton } from "../skeletons/ChurchWorkspaceSkeleton";
import { ChurchActionFeedback } from "./ChurchActionFeedback";

interface ChurchAsyncStateProps {
  status: ChurchAsyncStatus;
  children: ReactNode;
  loadingLabel?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  errorTitle?: ReactNode;
  errorDescription?: ReactNode;
  offlineTitle?: ReactNode;
  offlineDescription?: ReactNode;
  partialDescription?: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export function ChurchAsyncState({
  status,
  children,
  loadingLabel = "Loading workspace",
  emptyTitle = "No records yet",
  emptyDescription,
  errorTitle = "Something went wrong",
  errorDescription,
  offlineTitle = "Offline mode",
  offlineDescription = "Changes will wait until the connection is restored.",
  partialDescription,
  onRetry,
  className,
}: ChurchAsyncStateProps) {
  if (status === "loading") {
    return (
      <ChurchWorkspaceSkeleton
        ariaLabel={loadingLabel}
        className={className}
      />
    );
  }

  if (status === "empty") {
    return (
      <ChurchActionFeedback
        variant="info"
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  if (status === "error") {
    return (
      <ChurchActionFeedback
        variant="error"
        title={errorTitle}
        description={errorDescription}
        actionLabel={onRetry ? "Try again" : undefined}
        onAction={onRetry}
        className={className}
      />
    );
  }

  if (status === "offline") {
    return (
      <ChurchActionFeedback
        variant="offline"
        title={offlineTitle}
        description={offlineDescription}
        actionLabel={onRetry ? "Retry" : undefined}
        onAction={onRetry}
        className={className}
      />
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      {status === "partial" && partialDescription ? (
        <ChurchActionFeedback
          variant="warning"
          title="Partial data"
          description={partialDescription}
          className="mb-4"
        />
      ) : null}
      {children}
    </div>
  );
}
