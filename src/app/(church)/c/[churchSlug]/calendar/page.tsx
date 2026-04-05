import ChurchCalendarClient from "@/features/calendar/components/ChurchCalendarClient";
import { getChurchCalendarData } from "@/features/calendar/queries";

interface ChurchCalendarPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function ChurchCalendarPage({ params }: ChurchCalendarPageProps) {
  const { churchSlug } = await params;
  const data = await getChurchCalendarData(churchSlug);

  return (
    <ChurchCalendarClient
      churchSlug={data.churchSlug}
      timezone={data.timezone}
      events={data.events}
      departments={data.departments}
    />
  );
}
