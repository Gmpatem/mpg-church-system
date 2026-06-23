"use client";

import { ChurchActionFeedback } from "./ChurchActionFeedback";

interface ChurchErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ChurchErrorState({ error, reset }: ChurchErrorStateProps) {
  return (
    <ChurchActionFeedback
      variant="error"
      title="Something went wrong"
      description={error.message}
      actionLabel="Try again"
      onAction={reset}
      className="church-workspace"
    />
  );
}
