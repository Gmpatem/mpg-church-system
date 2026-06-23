"use client";

import { AlertTriangle } from "lucide-react";
import { ChurchButton } from "../primitives/ChurchButton";

interface ChurchErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ChurchErrorState({ error, reset }: ChurchErrorStateProps) {
  return (
    <div className="church-workspace rounded-xl border border-destructive/25 bg-destructive/5 p-5 text-destructive">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Something went wrong</h2>
          <p className="mt-1 text-sm text-destructive/80">{error.message}</p>
          <ChurchButton
            type="button"
            variant="destructive"
            className="mt-4"
            onClick={reset}
          >
            Try again
          </ChurchButton>
        </div>
      </div>
    </div>
  );
}
