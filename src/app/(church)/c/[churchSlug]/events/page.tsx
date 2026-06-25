import { getEventsWorkspaceData } from "@/features/events/queries";
import { EventsWorkspace } from "./components/EventsWorkspace";

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
    workflow: pickSingle(filters.workflow),
    eventType: pickSingle(filters.eventType),
    departmentId: pickSingle(filters.departmentId),
    dateFrom: pickSingle(filters.dateFrom),
    dateTo: pickSingle(filters.dateTo),
    eventId: pickSingle(filters.eventId),
    tab: pickSingle(filters.tab),
    dialog: pickSingle(filters.dialog),
    page: pickSingle(filters.page),
    pageSize: pickSingle(filters.pageSize),
    calendarView: pickSingle(filters.calendarView),
    calendarDate: pickSingle(filters.calendarDate),
    view: pickSingle(filters.view),
    date: pickSingle(filters.date),
  });

  return <EventsWorkspace churchSlug={churchSlug} data={data} />;
}
