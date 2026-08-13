import { CalendarDays, Clock, Star } from "lucide-react";
import { WorkspaceEmptyState } from "@/components/workspace";
import { eventTypeLabels, getLabel } from "@/lib/display-maps";
import type { CalendarEvent } from "@/features/calendar/types";
import {
  formatClockTime,
  MemberPortalCard,
  MemberPortalDateBlock,
  MemberPortalSectionHeader,
  MemberPortalStatusPill,
} from "./MemberPortalAppPrimitives";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";

type MemberPortalEventsModuleProps = {
  events: CalendarEvent[];
  unreadNotificationCount?: number;
};

export function MemberPortalEventsModule({
  events,
  unreadNotificationCount = 0,
}: MemberPortalEventsModuleProps) {
  const displayEvents = events.map((event) => ({
    ...event,
    description: event.description?.trim()
      ? event.description
      : getLabel(eventTypeLabels, event.event_type),
  }));

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero
        title="Events"
        description="Published church events"
        unreadNotificationCount={unreadNotificationCount}
      />

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Upcoming Events" />
        {displayEvents.length > 0 ? (
          <div className="flex flex-col gap-4">
            {displayEvents.map((event, index) => (
            <MemberPortalCard key={event.id} className="overflow-hidden p-0">
              <div className="flex min-h-[156px]">
                <MemberPortalDateBlock value={event.start} />
                <div className="min-w-0 flex-1">
                  <div className="h-[86px] overflow-hidden rounded-tr-[22px] bg-emerald-950">
                    <div className="flex h-full items-center justify-center bg-emerald-900 text-white">
                      {index % 2 === 0 ? (
                        <UsersArtwork />
                      ) : (
                        <CalendarDays className="size-9 text-amber-200" />
                      )}
                    </div>
                  </div>
                  <div className="p-4 pt-3">
                    <p className="truncate font-semibold text-slate-950">{event.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <Clock className="size-4 text-slate-500" />
                      <span className="truncate">
                        {event.is_all_day ? "All day" : formatClockTime(event.start)}
                        {event.location?.trim() ? ` · ${event.location}` : ""}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">{event.description}</p>
                    <div className="mt-3">
                      <MemberPortalStatusPill tone="neutral">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5" />
                          Published
                        </span>
                      </MemberPortalStatusPill>
                    </div>
                  </div>
                </div>
              </div>
            </MemberPortalCard>
            ))}
          </div>
        ) : (
          <WorkspaceEmptyState
            title="No upcoming events"
            message="There are no upcoming published church events right now. New events will appear here after they are published."
            className="min-h-[220px] border-amber-100 bg-white"
          />
        )}
      </section>
    </div>
  );
}

function UsersArtwork() {
  return (
    <div className="flex items-end gap-1.5">
      {[0, 1, 2, 3].map((item) => (
        <span key={item} className="flex flex-col items-center gap-1">
          <span className="size-4 rounded-full bg-amber-100/90" />
          <span className="h-7 w-5 rounded-t-full bg-white/80" />
        </span>
      ))}
    </div>
  );
}
