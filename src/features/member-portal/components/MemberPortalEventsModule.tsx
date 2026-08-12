import { CalendarDays, Clock, Star } from "lucide-react";
import { eventTypeLabels, getLabel } from "@/lib/display-maps";
import type { CalendarEvent } from "@/features/calendar/types";
import {
  formatClockTime,
  MemberPortalCard,
  MemberPortalDateBlock,
  MemberPortalSectionHeader,
  MemberPortalSegmentedControl,
  MemberPortalStatusPill,
} from "./MemberPortalAppPrimitives";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";

type MemberPortalEventsModuleProps = {
  events: CalendarEvent[];
};

type DisplayEvent = CalendarEvent & {
  description?: string;
  responseLabel?: string;
  responseTone?: "success" | "gold";
};

const fallbackEvents: DisplayEvent[] = [
  {
    id: "fallback-youth-bible-study",
    title: "Youth Bible Study",
    start: "2026-05-25T16:00:00",
    end: "2026-05-25T17:30:00",
    event_type: "study",
    department_id: null,
    location: "Room 3",
    is_all_day: false,
    description: "Study · Fellowship · Prayer",
    responseLabel: "You're going",
    responseTone: "success",
  },
  {
    id: "fallback-choir-rehearsal",
    title: "Choir Rehearsal",
    start: "2026-05-31T17:00:00",
    end: "2026-05-31T18:30:00",
    event_type: "music",
    department_id: null,
    location: "Music Room",
    is_all_day: false,
    description: "All voices welcome!",
    responseLabel: "Interested",
    responseTone: "gold",
  },
  {
    id: "fallback-community-outreach",
    title: "Community Outreach",
    start: "2026-06-07T09:00:00",
    end: "2026-06-07T12:00:00",
    event_type: "outreach",
    department_id: null,
    location: "City Center",
    is_all_day: false,
    description: "Let's serve our community",
    responseLabel: "Interested",
    responseTone: "gold",
  },
];

export function MemberPortalEventsModule({ events }: MemberPortalEventsModuleProps) {
  const displayEvents: DisplayEvent[] = events.length > 0
    ? events.map((event) => ({
        ...event,
        description: getLabel(eventTypeLabels, event.event_type),
        responseLabel: "Interested",
        responseTone: "gold",
      }))
    : fallbackEvents;

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero title="Events" description="Stay connected" />

      <MemberPortalSegmentedControl
        items={[
          { label: "Upcoming", active: true },
          { label: "My Events" },
          { label: "Calendar" },
        ]}
      />

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Upcoming Events" />
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
                      <MemberPortalStatusPill tone={event.responseTone ?? "gold"}>
                        <span className="inline-flex items-center gap-1">
                          {event.responseTone === "gold" ? <Star className="size-3.5" /> : null}
                          {event.responseLabel ?? "Interested"}
                        </span>
                      </MemberPortalStatusPill>
                    </div>
                  </div>
                </div>
              </div>
            </MemberPortalCard>
          ))}
        </div>
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
