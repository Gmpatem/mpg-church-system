import Link from "next/link";
import { CalendarDays, ChevronRight, Clock3, MapPin, ShieldAlert } from "lucide-react";
import {
  PlatformMobileAttentionStrip,
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformEventsSnapshot } from "@/features/platform/queries";

const EVENT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getEventStatusLabel(status: string | null | undefined) {
  if (!status) return "Planned";
  return EVENT_STATUS_LABELS[status] ?? "Planned";
}

function getEventStatusClass(status: string | null | undefined) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "border-slate-300 bg-slate-100 text-slate-600";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PlatformEventsPage() {
  const snapshot = await getPlatformEventsSnapshot();

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Events Workspace"
        title="Cross-Church Events"
        description="Track upcoming programs, monitor approval flow, and open event details from one mobile workspace."
        badge={snapshot.totals.upcomingEvents + " upcoming"}
        actions={[
          { href: "/platform", label: "Back to Dashboard" },
          { href: "/platform/calendar", label: "Open Calendar" },
        ]}
      />

      <PlatformMobileAttentionStrip>
        <p className="font-medium">
          {snapshot.totals.pendingApprovals > 0
            ? snapshot.totals.pendingApprovals + " events are waiting for approval."
            : "No events are waiting for approval."}
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Keep event status and workflow state current for accurate planning.
        </p>
      </PlatformMobileAttentionStrip>

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Total Events" value={snapshot.totals.totalEvents} hint="Across all churches" />
        <PlatformMobileStatCard label="Upcoming" value={snapshot.totals.upcomingEvents} hint="Future scheduled events" />
        <PlatformMobileStatCard label="Pending Approval" value={snapshot.totals.pendingApprovals} hint="Needs review" />
        <PlatformMobileStatCard label="Loaded Rows" value={snapshot.rows.length} hint="Current mobile list" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <span className="whitespace-nowrap rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
          All Events
        </span>
        <span className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Upcoming
        </span>
        <span className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Pending Approval
        </span>
      </div>

      <PlatformMobileSectionCard title="Event List">
        <div className="space-y-2">
          {snapshot.rows.length > 0 ? (
            snapshot.rows.map((event: any) => {
              const church = getChurch(event.churches);
              return (
                <Link
                  key={event.id}
                  href={"/platform/events/" + event.id}
                  className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="truncate text-xs text-slate-500">{church?.name ?? "Unassigned church"}</p>
                    </div>
                    <span
                      className={
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                        getEventStatusClass(event.status)
                      }
                    >
                      {getEventStatusLabel(event.status)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(event.start_datetime)}
                    </span>
                    {event.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {event.workflow_state === "pending_approval" ? "Pending approval" : "Workflow in progress"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      Open
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No events found in this workspace view.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Related Workspaces">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/platform/calendar"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Calendar
            <CalendarDays className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/approvals"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Approvals
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>
    </div>
  );
}
