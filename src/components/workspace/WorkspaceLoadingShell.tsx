import { PageSpinner } from "@/components/feedback/PageSpinner";

/**
 * @deprecated WorkspaceLoadingShell is deprecated and will be removed in a future version.
 * Use `PageSpinner` from `@/components/feedback/PageSpinner` directly instead.
 * This component now delegates to PageSpinner for unified loading UI.
 */
export function WorkspaceLoadingShell({
  stats,
  tall,
}: {
  stats?: number;
  tall?: boolean;
}) {
  // Keep params for API compatibility but ignore them
  void stats;
  void tall;
  return <PageSpinner />;
}
