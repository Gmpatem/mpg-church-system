"use client";

import { ChurchActionFeedback } from "./ChurchActionFeedback";

interface ChurchRetryStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry: () => void;
}

export function ChurchRetryState({
  title = "Unable to load this workspace",
  description = "The page can be retried without losing your place.",
  retryLabel = "Try again",
  onRetry,
}: ChurchRetryStateProps) {
  return (
    <ChurchActionFeedback
      variant="error"
      title={title}
      description={description}
      actionLabel={retryLabel}
      onAction={onRetry}
    />
  );
}
