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

function AttentionPill({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  if (value === 0) return null;
  
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-amber-50"
    >
      <span>{label}</span>
      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
        {value}
      </span>
    </Link>
  );
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

  const attentionItems = [
    { 
      label: "Access Requests", 
      value: data.stats.pendingAccessRequests, 
      href: `/c/${churchSlug}/approvals` 
    },
    { 
      label: "Leadership", 
      value: data.stats.pendingLeadershipRequests, 
      href: `/c/${churchSlug}/approvals` 
    },
    { 
      label: "Announcements", 
      value: data.stats.announcementsNeedingPublish, 
      href: `/c/${churchSlug}/announcements` 
    },
    { 
      label: "Event Reviews", 
      value: data.stats.departmentEventsAwaitingApproval, 
      href: `/c/${churchSlug}/approvals` 
    },
    { 
      label: "Today", 
      value: data.stats.todaysEvents, 
      href: `/c/${churchSlug}/events` 
    },
  ].filter(item => item.value > 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/30" />
      <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-orange-200/30" />
      
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-950">Attention Required</h3>
            <p className="text-xs text-amber-800">
              {totalAttention} item{totalAttention !== 1 ? 's' : ''} need{totalAttention === 1 ? 's' : ''} your review
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {attentionItems.map((item) => (
            <AttentionPill
              key={item.label}
              label={item.label}
              value={item.value}
              href={item.href}
            />
          ))}
          
          <Link
            href={`/c/${churchSlug}/office`}
            className="ml-2 flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open Office
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {data.queue.length > 0 ? (
        <div className="relative mt-4 space-y-2 border-t border-amber-200/50 pt-4">
          {data.queue.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-amber-50"
            >
              <span>{item.title}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
