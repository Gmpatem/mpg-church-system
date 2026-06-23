"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ChurchFieldErrorItem } from "../types";

interface ChurchErrorSummaryProps {
  errors: ChurchFieldErrorItem[];
  title?: string;
  description?: string;
  focusOnMount?: boolean;
  className?: string;
}

export function ChurchErrorSummary({
  errors,
  title = "Review the highlighted fields",
  description = "Some information needs attention before this can be saved.",
  focusOnMount = true,
  className,
}: ChurchErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusOnMount && errors.length > 0) {
      summaryRef.current?.focus();
    }
  }, [errors.length, focusOnMount]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 className="font-semibold text-destructive">{title}</h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {errors.map((error) => (
              <li key={`${error.fieldId ?? error.label}-${error.message}`}>
                {error.fieldId ? (
                  <a
                    href={`#${error.fieldId}`}
                    className="font-medium text-destructive underline-offset-4 hover:underline"
                  >
                    {error.label}: {error.message}
                  </a>
                ) : (
                  <span>
                    <span className="font-medium">{error.label}:</span>{" "}
                    {error.message}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
