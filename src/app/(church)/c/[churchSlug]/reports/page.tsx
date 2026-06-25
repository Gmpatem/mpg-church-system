import { ReportsWorkspace } from "./ReportsWorkspace";
import { ReportsFilterRail } from "./ReportsFilterRail";
import { ReportsOverviewStats } from "./ReportsOverviewStats";
import { ReportsExportActions } from "./tabs/ReportsExportActions";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";
import { ChurchWorkspaceHeader } from "@/components/church-workspace";
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

function normalizeTab(value: string): "overview" | "finance" | "members" | "events" {
  if (value === "treasury" || value === "finance") return "finance";
  if (value === "members") return "members";
  if (value === "events") return "events";
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
    <div className="space-y-5 md:space-y-6">
      <WorkspaceRouteStateBridge
        churchSlug={churchSlug}
        moduleKey="reports"
        restoreQueryState={true}
        persistQueryKeys={["tab", "dateFrom", "dateTo"]}
        prefetchHrefs={[
          `/c/${churchSlug}/members`,
          `/c/${churchSlug}/treasury`,
          `/c/${churchSlug}/events`,
        ]}
      />

      <ChurchWorkspaceHeader
        eyebrow="Church Reports"
        title={t.pages.reports.title}
        description={t.pages.reports.description}
        actions={<ReportsExportActions churchSlug={churchSlug} activeTab={activeTab} dateFrom={dateFrom} dateTo={dateTo} />}
      />

      <ReportsOverviewStats
        churchSlug={churchSlug}
        activeTab={activeTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <ReportsFilterRail
        churchSlug={churchSlug}
        activeTab={activeTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      <ReportsWorkspace
        churchSlug={churchSlug}
        activeTab={activeTab}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
