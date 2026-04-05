import { Suspense } from "react";
import { WorkspaceHero } from "@/components/workspace";
import { ReportsWorkspace } from "./ReportsWorkspace";
import { ReportsOverviewSection } from "./ReportsOverviewSection";
import { ReportsSectionLoading } from "./ReportsSectionLoading";
import { ReportsFilterRail } from "./ReportsFilterRail";

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

export default async function ReportsPage({ params, searchParams }: ReportsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};

  const activeTab = normalizeTab(pickSingle(filters.tab));
  const dateFrom = pickSingle(filters.dateFrom);
  const dateTo = pickSingle(filters.dateTo);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        eyebrow="Reports"
        title="Church Reports"
        description="Unified reporting across treasury, members, departments, and events."
      />

      <ReportsFilterRail
        churchSlug={churchSlug}
        activeTab={activeTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <Suspense fallback={<ReportsSectionLoading />}>
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
