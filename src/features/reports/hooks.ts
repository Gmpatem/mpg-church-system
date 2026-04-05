"use client";

import { useTransition } from "react";
import { createReportExport } from "./actions";

export function useReportExport(churchSlug: string, filters: any) {
  const [pending, startTransition] = useTransition();

  function triggerExport(format: "pdf" | "excel" | "print") {
    startTransition(async () => {
      try {
        await createReportExport({
          churchSlug,
          reportScope: "unified",
          format,
          filters,
        });
        alert("Report export queued");
      } catch (err: any) {
        alert(err.message || "Export failed");
      }
    });
  }

  return {
    pending,
    triggerExport,
  };
}
