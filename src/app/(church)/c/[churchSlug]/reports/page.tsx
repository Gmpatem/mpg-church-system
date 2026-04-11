import { ReportsWorkspace } from "./ReportsWorkspace";
import { ReportsFilterRail } from "./ReportsFilterRail";
import { ReportsOverviewStats } from "./ReportsOverviewStats";
import { ReportsExportActions } from "./tabs/ReportsExportActions";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";
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

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-4 text-white shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
              Church Reports
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              {t.pages.reports.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-5 text-blue-100">
              {t.pages.reports.description}
            </p>
          </div>
          <ReportsExportActions churchSlug={churchSlug} activeTab={activeTab} dateFrom={dateFrom} dateTo={dateTo} />
        </div>
      </section>

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
