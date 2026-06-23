"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { ChurchAsyncStatus } from "../types";
import { ChurchAsyncState } from "../feedback/ChurchAsyncState";

interface ChurchAsyncBoundaryProps {
  status: ChurchAsyncStatus;
  children: ReactNode;
  className?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  errorDescription?: ReactNode;
  onRetry?: () => void;
}

export function ChurchAsyncBoundary({
  status,
  children,
  className,
  emptyTitle,
  emptyDescription,
  errorDescription,
  onRetry,
}: ChurchAsyncBoundaryProps) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <ChurchAsyncState
        status={status}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        errorDescription={errorDescription}
        onRetry={onRetry}
      >
        {children}
      </ChurchAsyncState>
    </div>
  );
}
