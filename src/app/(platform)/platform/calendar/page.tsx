import Link from "next/link";
import { CalendarCheck2, ChevronRight, Clock3, MapPin } from "lucide-react";
import {
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformCalendarSnapshot } from "@/features/platform/queries";

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

export default async function PlatformCalendarPage() {
  const rows = await getPlatformCalendarSnapshot();
  const todayKey = new Date().toDateString();
  const todayCount = rows.filter((row: any) => new Date(row.start_datetime).toDateString() === todayKey).length;

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Calendar Workspace"
        title="Upcoming Schedule"
        description="See upcoming church events in one timeline and jump straight to the event workspace."
        badge={rows.length + " upcoming"}
        actions={[
          { href: "/platform/events", label: "Open Events" },
          { href: "/platform/approvals", label: "Review Approvals" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Upcoming Events" value={rows.length} hint="Loaded calendar rows" />
        <PlatformMobileStatCard label="Today" value={todayCount} hint="Events happening today" />
        <PlatformMobileStatCard label="This Week" value={Math.min(rows.length, 7)} hint="Next seven listed events" />
        <PlatformMobileStatCard label="Workspaces" value={new Set(rows.map((row: any) => row.church_id)).size} hint="Churches represented" />
      </div>

      <PlatformMobileSectionCard title="Calendar Timeline">
        <div className="space-y-2">
          {rows.length > 0 ? (
            rows.map((row: any) => {
              const church = getChurch(row.churches);
              return (
                <Link
                  key={row.id}
                  href={"/platform/events/" + row.id}
                  className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.title}</p>
                      <p className="truncate text-xs text-slate-500">{church?.name ?? "Church workspace"}</p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      {row.status === "cancelled" ? "Cancelled" : "Scheduled"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(row.start_datetime)}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {row.location ?? "Location pending"}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No upcoming events in the platform calendar.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Related Workspaces">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/platform/events"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Events
            <CalendarCheck2 className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Dashboard
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>
    </div>
  );
}
