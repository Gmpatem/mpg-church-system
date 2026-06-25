import { redirect } from "next/navigation";

interface ChurchCalendarPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function ChurchCalendarPage({ params, searchParams }: ChurchCalendarPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const paramsToKeep = new URLSearchParams();
  paramsToKeep.set("tab", "calendar");

  const eventId = pickSingle(filters.eventId);
  const date = pickSingle(filters.date);
  const calendarDate = pickSingle(filters.calendarDate);
  const view = pickSingle(filters.view);
  const calendarView = pickSingle(filters.calendarView);

  if (eventId) paramsToKeep.set("eventId", eventId);
  if (calendarDate || date) paramsToKeep.set("calendarDate", calendarDate || date);
  if (calendarView || view) paramsToKeep.set("calendarView", calendarView || view);

  redirect(`/c/${churchSlug}/events?${paramsToKeep.toString()}`);
}
