import { getChurchCalendarData } from "@/features/calendar/queries";
import { WorkspaceHero } from "@/components/workspace";
import { CalendarView } from "@/components/shared/CalendarView";

interface ChurchCalendarPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function ChurchCalendarPage({ params }: ChurchCalendarPageProps) {
  const { churchSlug } = await params;
  const data = await getChurchCalendarData(churchSlug);

  const events = data.events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    event_type: event.eventType,
    location: event.location ?? null,
    is_all_day: event.allDay,
  }));

  return (
    <div className="space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Calendar"
        title="Calendar"
        description="Upcoming approved events for the whole church."
      />
      <CalendarView
        events={events}
        showViewToggle={true}
        emptyMessage="No published events found."
      />
    </div>
  );
}
