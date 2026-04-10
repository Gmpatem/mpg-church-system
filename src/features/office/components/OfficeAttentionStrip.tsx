import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface OfficeAttentionStripProps {
  churchSlug: string;
  data: {
    stats: {
      pendingAccessRequests: number;
      pendingLeadershipRequests: number;
      announcementsNeedingPublish: number;
      departmentEventsAwaitingApproval: number;
      todaysEvents: number;
    };
    queue: Array<{
      id: string;
      title: string;
      href: string;
    }>;
  };
}

export function OfficeAttentionStrip({
  churchSlug,
  data,
}: OfficeAttentionStripProps) {
  const totalAttention =
    data.stats.pendingAccessRequests +
    data.stats.pendingLeadershipRequests +
    data.stats.announcementsNeedingPublish +
    data.stats.departmentEventsAwaitingApproval +
    data.stats.todaysEvents;

  if (totalAttention === 0 && data.queue.length === 0) {
    return null;
  }

  const parts: string[] = [];
  if (data.stats.pendingAccessRequests > 0) {
    parts.push(`${data.stats.pendingAccessRequests} pending access request${data.stats.pendingAccessRequests === 1 ? "" : "s"}`);
  }
  if (data.stats.pendingLeadershipRequests > 0) {
    parts.push(`${data.stats.pendingLeadershipRequests} leadership request${data.stats.pendingLeadershipRequests === 1 ? "" : "s"}`);
  }
  if (data.stats.announcementsNeedingPublish > 0) {
    parts.push(`${data.stats.announcementsNeedingPublish} announcement${data.stats.announcementsNeedingPublish === 1 ? "" : "s"} to review`);
  }
  if (data.stats.departmentEventsAwaitingApproval > 0) {
    parts.push(`${data.stats.departmentEventsAwaitingApproval} event approval${data.stats.departmentEventsAwaitingApproval === 1 ? "" : "s"}`);
  }
  if (data.stats.todaysEvents > 0) {
    parts.push(`${data.stats.todaysEvents} event${data.stats.todaysEvents === 1 ? "" : "s"} today`);
  }

  return (
    <div className="mobile-fade-up rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">
            {parts.join(" · ")}
          </p>
        </div>
        <Link
          href={`/c/${churchSlug}/approvals`}
          className="mobile-touch-feedback inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
