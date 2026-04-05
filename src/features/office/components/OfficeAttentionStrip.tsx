import Link from "next/link";

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

function MiniPill({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
      {label}: <span className="text-slate-950">{value}</span>
    </div>
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

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-amber-950">Needs Attention</p>
            <p className="text-sm text-amber-800">
              Cross-module office signals needing review or coordination.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MiniPill label="Access" value={data.stats.pendingAccessRequests} />
            <MiniPill label="Leadership" value={data.stats.pendingLeadershipRequests} />
            <MiniPill label="Announcements" value={data.stats.announcementsNeedingPublish} />
            <MiniPill label="Event Reviews" value={data.stats.departmentEventsAwaitingApproval} />
            <MiniPill label="Today" value={data.stats.todaysEvents} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/c/${churchSlug}/office`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Open Office Desk
          </Link>
        </div>
      </div>

      {data.queue.length > 0 ? (
        <div className="mt-4 space-y-2">
          {data.queue.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {item.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
