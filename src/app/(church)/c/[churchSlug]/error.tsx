"use client";

import { ChurchErrorState } from "@/components/church-workspace";

export default function ChurchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ChurchErrorState error={error} reset={reset} />;
}
