import ChurchCalendarClient from "@/features/calendar/components/ChurchCalendarClient";
import { getChurchCalendarData } from "@/features/calendar/queries";
import { WorkspaceHero } from "@/components/workspace";

interface ChurchCalendarPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function ChurchCalendarPage({ params }: ChurchCalendarPageProps) {
  const { churchSlug } = await params;
  const data = await getChurchCalendarData(churchSlug);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Calendar"
        description="View upcoming events and church activities."
      />
      <ChurchCalendarClient
        churchSlug={data.churchSlug}
        timezone={data.timezone}
        events={data.events}
        departments={data.departments}
      />
    </div>
  );
}
