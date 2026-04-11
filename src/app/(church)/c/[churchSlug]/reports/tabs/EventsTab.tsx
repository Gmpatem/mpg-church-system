import { getReportsTabData } from "@/features/reports/queries";
import { EventsAnalyticsTabClient } from "./EventsAnalyticsTabClient";

export async function EventsTab({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsTabData(churchSlug, "events", { dateFrom, dateTo });
  return <EventsAnalyticsTabClient events={data.events} />;
}
