import { Suspense } from "react";
import { OverviewTab } from "./tabs/OverviewTab";
import { TreasuryTab } from "./tabs/TreasuryTab";
import { MembersTab } from "./tabs/MembersTab";
import { EventsTab } from "./tabs/EventsTab";
import { PageSpinner } from "@/components/feedback/PageSpinner";

type TabKey = "overview" | "finance" | "members" | "events";

function TabLoading() {
  return <PageSpinner />;
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
    <div className="space-y-4">
      {activeTab === "overview" ? (
        <Suspense fallback={<TabLoading />}>
          <OverviewTab churchSlug={churchSlug} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      ) : null}

      {activeTab === "finance" ? (
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
    </div>
  );
}
