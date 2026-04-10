import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardCheck, ShieldAlert } from "lucide-react";
import {
  PlatformMobileAttentionStrip,
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformApprovalsSnapshot } from "@/features/platform/queries";

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
}

function getPriorityLabel(priority: string | null | undefined) {
  if (!priority) return "Standard";
  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Standard";
}

function getPriorityClass(priority: string | null | undefined) {
  if (priority === "urgent") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "high") return "border-amber-200 bg-amber-50 text-amber-700";
  if (priority === "medium") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-300 bg-slate-100 text-slate-600";
}

export default async function PlatformApprovalsPage() {
  const snapshot = await getPlatformApprovalsSnapshot();

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Approvals Workspace"
        title="Action Queue"
        description="Review pending event approvals and open support tickets without leaving the mobile workspace."
        badge={(snapshot.totals.pendingEvents + snapshot.totals.openTickets) + " items"}
        actions={[
          { href: "/platform/events", label: "Review Events" },
          { href: "/platform/support", label: "Open Support" },
        ]}
      />

      <PlatformMobileAttentionStrip>
        <p className="font-medium">
          {snapshot.totals.pendingEvents} pending event approvals and {snapshot.totals.openTickets} active support tickets.
        </p>
        <p className="mt-1 text-xs text-amber-800">Process the oldest requests first to keep church teams unblocked.</p>
      </PlatformMobileAttentionStrip>

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Pending Events" value={snapshot.totals.pendingEvents} hint="Awaiting approval" />
        <PlatformMobileStatCard label="Open Tickets" value={snapshot.totals.openTickets} hint="Support requests" />
        <PlatformMobileStatCard label="Loaded Events" value={snapshot.pendingEvents.length} hint="Current queue rows" />
        <PlatformMobileStatCard label="Loaded Tickets" value={snapshot.openTickets.length} hint="Current support rows" />
      </div>

      <PlatformMobileSectionCard title="Event Approvals" actionLabel="Open" actionHref="/platform/events">
        <div className="space-y-2">
          {snapshot.pendingEvents.length > 0 ? (
            snapshot.pendingEvents.map((event: any) => {
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
                      <p className="truncate text-xs text-slate-500">{church?.name ?? "Church workspace"}</p>
                    </div>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      Pending
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {event.start_datetime
                      ? new Date(event.start_datetime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Date pending"}
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No event approvals waiting right now.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Support Reviews" actionLabel="Open" actionHref="/platform/support">
        <div className="space-y-2">
          {snapshot.openTickets.length > 0 ? (
            snapshot.openTickets.map((ticket: any) => {
              const church = getChurch(ticket.churches);
              return (
                <Link
                  key={ticket.id}
                  href="/platform/support"
                  className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{ticket.subject}</p>
                      <p className="truncate text-xs text-slate-500">{church?.name ?? "Platform request"}</p>
                    </div>
                    <span
                      className={
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium " + getPriorityClass(ticket.priority)
                      }
                    >
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {ticket.created_at
                      ? new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Recently created"}
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No open support reviews right now.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          href="/platform/events"
          className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          Event Workspace
          <ClipboardCheck className="h-4 w-4 text-slate-400" />
        </Link>
        <Link
          href="/platform/support"
          className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          Support Workspace
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <ShieldAlert className="h-4 w-4 text-slate-500" />
        <CheckCircle2 className="h-4 w-4 text-slate-500" />
        Prioritize urgent tickets and pending approvals first.
      </div>
    </div>
  );
}
