"use client";

import type { ReactNode } from "react";
import { ChurchActionFeedback } from "./ChurchActionFeedback";

interface NoticeProps {
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function ChurchReadOnlyNotice({
  title = "Read-only access",
  description = "You can review this workspace, but changes require additional access.",
}: NoticeProps) {
  return (
    <ChurchActionFeedback
      variant="info"
      title={title}
      description={description}
    />
  );
}

export function ChurchPartialDataNotice({
  title = "Partial data shown",
  description = "Some related information could not be loaded. Existing records are still available.",
  actionLabel,
  onAction,
}: NoticeProps) {
  return (
    <ChurchActionFeedback
      variant="warning"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

export function ChurchMigrationNotice({
  title = "Migration in progress",
  description = "This workspace is using the current schema while older records are being normalized.",
}: NoticeProps) {
  return (
    <ChurchActionFeedback
      variant="info"
      title={title}
      description={description}
    />
  );
}
