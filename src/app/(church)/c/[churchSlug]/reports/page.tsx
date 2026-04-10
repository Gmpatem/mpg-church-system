import { Suspense } from "react";
import { WorkspaceHero } from "@/components/workspace";
import { ReportsWorkspace } from "./ReportsWorkspace";
import { ReportsOverviewSection } from "./ReportsOverviewSection";
import { PageSpinner } from "@/components/feedback/PageSpinner";
import { ReportsFilterRail } from "./ReportsFilterRail";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface ReportsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function normalizeTab(value: string): "overview" | "treasury" | "members" | "events" | "unified" {
  if (value === "treasury") return "treasury";
  if (value === "members") return "members";
  if (value === "events") return "events";
  if (value === "unified") return "unified";
  return "overview";
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function ReportsPage({ params, searchParams }: ReportsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const t = await getTranslations();

  const activeTab = normalizeTab(pickSingle(filters.tab));
  const dateFrom = pickSingle(filters.dateFrom);
  const dateTo = pickSingle(filters.dateTo);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        eyebrow={t.pages.reports.eyebrow}
        title={t.pages.reports.title}
        description={t.pages.reports.description}
      />

      <ReportsFilterRail
        churchSlug={churchSlug}
        activeTab={activeTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <Suspense fallback={<PageSpinner />}>
        <ReportsOverviewSection
          churchSlug={churchSlug}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </Suspense>

      <ReportsWorkspace
        churchSlug={churchSlug}
        activeTab={activeTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
