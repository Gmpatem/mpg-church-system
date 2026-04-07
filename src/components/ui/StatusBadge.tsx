import { cn } from "@/lib/utils/cn";
import {
  getLabel,
  memberStatusLabels,
  inviteStatusLabels,
  approvalStageLabels,
  eventStatusLabels,
  workflowStateLabels,
} from "@/lib/display-maps";

type StatusContext = "member" | "invite" | "approval" | "event" | "workflow";

interface StatusBadgeProps {
  status: string | null | undefined;
  context?: StatusContext;
  className?: string;
}

const contextMap: Record<StatusContext, Record<string, string>> = {
  member: memberStatusLabels,
  invite: inviteStatusLabels,
  approval: approvalStageLabels,
  event: eventStatusLabels,
  workflow: workflowStateLabels,
};

function getColorClasses(status: string | null | undefined): string {
  switch (status) {
    case "active":
    case "approved":
    case "published":
    case "completed":
    case "claimed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "inactive":
    case "transferred":
    case "deceased":
    case "cancelled":
    case "expired":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "revoked":
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";

    case "pending":
    case "pending_approval":
    case "submitted":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "visitor":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "draft":
    case "office_review":
    case "leadership_review":
    case "treasury_review":
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function StatusBadge({ status, context = "member", className }: StatusBadgeProps) {
  const map = contextMap[context];
  const label = getLabel(map, status);
  const colorClasses = getColorClasses(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
}
