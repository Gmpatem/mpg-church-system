"use client";

import { useEffect } from "react";
import { ChurchActionFeedback } from "@/components/church-workspace/feedback";
import { ChurchPageFrame } from "@/components/church-workspace/patterns/ChurchPageFrame";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ChurchPageFrame className="church-workspace min-w-0 py-6">
      <ChurchActionFeedback
        variant="error"
        title="Events could not be loaded"
        description={error.message || "An unexpected error occurred loading this page."}
        actionLabel="Try again"
        onAction={reset}
      />
    </ChurchPageFrame>
  );
}
