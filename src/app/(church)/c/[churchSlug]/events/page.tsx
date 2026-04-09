import { getEventsWorkspaceData } from "@/features/events/queries";
import { EventsWorkspaceUnified } from "./components/EventsWorkspaceUnified";
import { WorkspaceHero } from "@/components/workspace";

interface EventsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};

  const data = await getEventsWorkspaceData(churchSlug, {
    q: pickSingle(filters.q),
    status: pickSingle(filters.status),
    dateFrom: pickSingle(filters.dateFrom),
    dateTo: pickSingle(filters.dateTo),
    eventId: pickSingle(filters.eventId),
    tab: pickSingle(filters.tab),
  });

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Events"
        description="Manage church events, approvals, and the calendar."
      />
      <EventsWorkspaceUnified churchSlug={churchSlug} data={data} />
    </div>
  );
}
