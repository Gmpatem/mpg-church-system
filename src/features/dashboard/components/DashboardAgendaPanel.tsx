import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Translations } from "@/features/i18n/en";
import type { DashboardData, DashboardEvent } from "../types";
import { CompactEmptyState, DashboardPanel } from "./DashboardPanel";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

function formatDateKey(dateKey: string, locale: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatEventTime(value: string, locale: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { time: "--:--", suffix: "" };
  const formatted = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  const [time, suffix] = formatted.split(/\s+/);
  return { time: time ?? formatted, suffix: suffix ?? "" };
}

function statusLabel(event: DashboardEvent, labels: DashboardLabels) {
  if (event.workflowState === "pending_approval") return labels.pendingApproval;
  const normalized = event.status.toLowerCase();
  if (normalized === "completed") return labels.completed;
  if (normalized === "cancelled") return labels.cancelled;
  if (normalized === "scheduled") return labels.scheduled;
  if (normalized === "confirmed" || normalized === "approved" || normalized === "published") return labels.confirmed;
  return event.status.replace(/_/g, " ");
}

function statusClass(event: DashboardEvent) {
  if (event.workflowState === "pending_approval") return "border-amber-200 bg-amber-50 text-amber-700";
  const normalized = event.status.toLowerCase();
  if (normalized === "cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "completed") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function DashboardAgendaPanel({
  data,
  labels,
  locale,
}: {
  data: DashboardData;
  labels: DashboardLabels;
  locale: string;
}) {
  const groups = [
    { key: "today", label: labels.today },
    { key: "tomorrow", label: labels.tomorrow },
    { key: "later", label: labels.laterThisWeek },
  ] as const;
  const createHref = `/c/${data.church.slug}/events?tab=events&dialog=create`;

  return (
    <DashboardPanel
      title={labels.todayUpcoming}
      icon={CalendarDays}
      action={
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg border-[#DCD5C9] bg-[#FFFDF8] px-3 text-xs text-[#24332C] hover:bg-[#F4F0E7]"
        >
          <Link href={data.routes.calendar}>{labels.viewCalendar}</Link>
        </Button>
      }
    >
      {data.upcomingEvents.length === 0 ? (
        <CompactEmptyState
          icon={CalendarDays}
          title={labels.noUpcomingEvents}
          message={labels.scheduleEvents}
          action={
            data.capabilities.canCreateEvents ? (
              <Button asChild size="sm" className="rounded-lg bg-[#0F4D3A] hover:bg-[#145C44]">
                <Link href={createHref}>{labels.createEvent}</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => {
            const events = data.upcomingEvents.filter((event) => event.group === group.key);
            if (events.length === 0) return null;
            const dateLabel = formatDateKey(events[0]?.dateKey ?? data.todayKey, locale);

            return (
              <div key={group.key} className="min-w-0">
                <div className="flex items-center gap-2 border-b border-[#ECE7DC] pb-2 text-sm font-semibold text-[#18231D]">
                  <span className="uppercase text-[#13744F]">{group.label}</span>
                  <span className="text-[#818A84]" aria-hidden="true">
                    &middot;
                  </span>
                  <span>{dateLabel}</span>
                </div>
                <div className="divide-y divide-[#ECE7DC]">
                  {events.map((event) => {
                    const time = formatEventTime(event.startDatetime, locale, data.church.timezone);
                    const detail = event.departmentName || event.eventType || labels.eventTypeFallback;

                    return (
                      <Link
                        key={event.id}
                        href={event.href}
                        className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3 transition hover:bg-[#F9F6EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44]"
                      >
                        <span className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-[#E8F1E7] px-2 text-center font-semibold text-[#0F4D3A]">
                          <span className="text-sm leading-none">{time.time}</span>
                          {time.suffix ? <span className="mt-1 text-[11px] leading-none">{time.suffix}</span> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#18231D]">{event.title}</span>
                          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#66706A]">
                            <span className="max-w-full truncate">{detail}</span>
                            {event.location ? (
                              <>
                                <span aria-hidden="true">&middot;</span>
                                <span className="max-w-full truncate">{event.location}</span>
                              </>
                            ) : null}
                          </span>
                          <span
                            className={cn(
                              "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              statusClass(event)
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                            {statusLabel(event, labels)}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-lg border-[#DCD5C9] bg-[#FFFDF8] text-sm font-semibold text-[#145C44] hover:bg-[#F4F0E7]"
          >
            <Link href={data.routes.calendar}>
              <CalendarDays className="mr-2 size-4" aria-hidden="true" />
              {labels.goToCalendar}
            </Link>
          </Button>
        </div>
      )}
    </DashboardPanel>
  );
}
