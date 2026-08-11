import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChurchSummaryStrip,
  ChurchWorkspaceHeader,
  ChurchWorkspacePanel,
  ChurchWorkspaceTabBar,
} from "@/components/church-workspace";
import { LeadershipOverviewTab } from "./components/LeadershipOverviewTab";
import { LeadershipRequestsTab } from "./components/LeadershipRequestsTab";
import { ActiveDepartmentLeadersTab } from "./components/ActiveDepartmentLeadersTab";
import type {
  LeadershipOverviewData,
  LeadershipTabData,
  LeadershipTabKey,
} from "./types";
import { ClipboardCheck, ShieldCheck, UsersRound } from "lucide-react";

type LeadershipWorkspaceProps = {
  churchSlug: string;
  churchName: string | null;
  overview: LeadershipOverviewData;
  activeTab: LeadershipTabKey;
  tabData: LeadershipTabData;
};

const TAB_ITEMS: Array<{ key: LeadershipTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "requests", label: "Requests" },
  { key: "active_leaders", label: "Active Leaders" },
];

function buildTabHref(churchSlug: string, tab: LeadershipTabKey) {
  return `/c/${churchSlug}/leadership?tab=${tab}`;
}

export function LeadershipWorkspace({
  churchSlug,
  churchName,
  overview,
  activeTab,
  tabData,
}: LeadershipWorkspaceProps) {
  const tabs = TAB_ITEMS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: buildTabHref(churchSlug, tab.key),
    count:
      tab.key === "requests"
        ? overview.pendingRequestCount
        : tab.key === "active_leaders"
          ? overview.approvedLeaderCount
          : null,
  }));

  return (
    <div className="space-y-5 md:space-y-6">
      <ChurchWorkspaceHeader
        eyebrow="Leadership"
        title={`Leadership for ${churchName ?? "this church"}`}
        description="Review department leadership requests, approve leaders, and manage the active leadership structure across church departments."
        actions={
          <Button asChild variant="outline" className="h-10 rounded-lg bg-background">
            <Link href={`/c/${churchSlug}/departments`}>Departments</Link>
          </Button>
        }
      />

      <ChurchSummaryStrip
        items={[
          {
            label: "Pending Requests",
            value: overview.pendingRequestCount,
            hint: "Awaiting review",
            icon: <ClipboardCheck className="size-4" aria-hidden="true" />,
            muted: overview.pendingRequestCount === 0,
          },
          {
            label: "Active Leaders",
            value: overview.approvedLeaderCount,
            hint: "Approved assignments",
            icon: <ShieldCheck className="size-4" aria-hidden="true" />,
            muted: overview.approvedLeaderCount === 0,
          },
          {
            label: "Departments Covered",
            value: overview.departmentsWithLeadersCount,
            hint: "With at least one leader",
            icon: <UsersRound className="size-4" aria-hidden="true" />,
            muted: overview.departmentsWithLeadersCount === 0,
          },
        ]}
      />

      <ChurchWorkspaceTabBar
        tabs={tabs}
        activeKey={activeTab}
        ariaLabel="Leadership workspace sections"
      />

      {activeTab === "overview" && tabData.tab === "overview" ? (
        <LeadershipOverviewTab data={tabData.data} />
      ) : null}

      {activeTab === "requests" && tabData.tab === "requests" ? (
        <ChurchWorkspacePanel
          title="Leadership Requests"
          description="Approve or reject department leadership requests submitted during onboarding or later profile completion."
          contentClassName="p-4 sm:p-5"
        >
          <LeadershipRequestsTab churchSlug={churchSlug} data={tabData.data} />
        </ChurchWorkspacePanel>
      ) : null}

      {activeTab === "active_leaders" && tabData.tab === "active_leaders" ? (
        <ChurchWorkspacePanel
          title="Active Department Leaders"
          description="Current approved leadership assignments by department."
          contentClassName="p-4 sm:p-5"
        >
          <ActiveDepartmentLeadersTab data={tabData.data} />
        </ChurchWorkspacePanel>
      ) : null}
    </div>
  );
}

