import { getEventsWorkspaceData } from "@/features/events/queries";
import { EventsWorkspaceUnified } from "./components/EventsWorkspaceUnified";
import { WorkspaceHero } from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface EventsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const t = await getTranslations();

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
        title={t.pages.events.title}
        description={t.pages.events.description}
      />
      <EventsWorkspaceUnified churchSlug={churchSlug} data={data} />
    </div>
  );
}
