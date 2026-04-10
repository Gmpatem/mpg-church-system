import Link from "next/link";
import { Suspense } from "react";
import { OverviewTab } from "./tabs/OverviewTab";
import { TreasuryTab } from "./tabs/TreasuryTab";
import { MembersTab } from "./tabs/MembersTab";
import { EventsTab } from "./tabs/EventsTab";
import { UnifiedTab } from "./tabs/UnifiedTab";

type TabKey = "overview" | "treasury" | "members" | "events" | "unified";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "treasury", label: "Treasury" },
  { key: "members", label: "Members" },
  { key: "events", label: "Events" },
  { key: "unified", label: "Unified" },
];

import { PageSpinner } from "@/components/feedback/PageSpinner";

function TabLoading() {
  return <PageSpinner />;
}

function buildTabHref({
  churchSlug,
  tab,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  tab: TabKey;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  return `/c/${churchSlug}/reports?${params.toString()}`;
}

export function ReportsWorkspace({
  churchSlug,
  activeTab,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  activeTab: TabKey;
  dateFrom?: string;
  dateTo?: string;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Link
              key={tab.key}
              href={buildTabHref({
                churchSlug,
                tab: tab.key,
                dateFrom,
                dateTo,
              })}
              className={
                isActive
                  ? "mobile-touch-feedback shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm"
                  : "mobile-touch-feedback shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <Suspense fallback={<TabLoading />}>
          <OverviewTab churchSlug={churchSlug} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      ) : null}

      {activeTab === "treasury" ? (
        <Suspense fallback={<TabLoading />}>
          <TreasuryTab churchSlug={churchSlug} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      ) : null}

      {activeTab === "members" ? (
        <Suspense fallback={<TabLoading />}>
          <MembersTab churchSlug={churchSlug} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      ) : null}

      {activeTab === "events" ? (
        <Suspense fallback={<TabLoading />}>
          <EventsTab churchSlug={churchSlug} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      ) : null}

      {activeTab === "unified" ? (
        <Suspense fallback={<TabLoading />}>
          <UnifiedTab churchSlug={churchSlug} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      ) : null}
    </div>
  );
}
