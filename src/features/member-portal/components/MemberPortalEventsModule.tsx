import { CalendarPlus, MapPin } from "lucide-react";
import { WorkspaceEmptyState, WorkspaceSectionCard } from "@/components/workspace";
import { eventTypeLabels, getLabel } from "@/lib/display-maps";
import type { CalendarEvent } from "@/features/calendar/types";
import { MemberPortalChipRow } from "./MemberPortalChipRow";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatDateTime } from "./memberPortalUiUtils";

type MemberPortalEventsModuleProps = {
  events: CalendarEvent[];
};

export function MemberPortalEventsModule({ events }: MemberPortalEventsModuleProps) {
  const eventTypeChips = Array.from(
    new Set(events.map((event) => getLabel(eventTypeLabels, event.event_type)))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <MemberPortalModuleHero
        eyebrow="Events & RSVP"
        title="Upcoming Events"
        description="Track published church events and your upcoming schedule."
        badges={[`${events.length} upcoming`]}
      />

      <MemberPortalChipRow
        chips={[
          { label: "All Events", active: true },
          ...eventTypeChips.slice(0, 4).map((label) => ({ label })),
        ]}
      />

      <WorkspaceSectionCard
        title="Event List"
        description="Published events available in your member portal."
        contentClassName="space-y-3"
      >
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  {getLabel(eventTypeLabels, event.event_type)}
                </span>
                {event.is_all_day ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    All day
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-medium text-slate-900">{event.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDateTime(event.start)}
                {event.end ? ` - ${formatDateTime(event.end)}` : ""}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {event.location?.trim() ? event.location : "Location not set"}
              </p>
            </div>
          ))
        ) : (
          <WorkspaceEmptyState
            title="No published events"
            message="Events will appear here as soon as your church publishes them."
            className="min-h-[180px]"
          />
        )}
      </WorkspaceSectionCard>

      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
        <CalendarPlus className="h-3.5 w-3.5" />
        Updated when new events are published.
      </div>
    </div>
  );
}
