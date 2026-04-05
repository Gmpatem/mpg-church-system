import Link from "next/link";
import {
  WorkspaceHero,
  WorkspaceSectionCard,
} from "@/components/workspace";
import { LeadershipOverviewTab } from "./components/LeadershipOverviewTab";
import { LeadershipRequestsTab } from "./components/LeadershipRequestsTab";
import { ActiveDepartmentLeadersTab } from "./components/ActiveDepartmentLeadersTab";
import type {
  LeadershipTabData,
  LeadershipTabKey,
} from "./types";

type LeadershipWorkspaceProps = {
  churchSlug: string;
  churchName: string | null;
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

function renderTabNav(churchSlug: string, activeTab: LeadershipTabKey) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border bg-card p-2">
      {TAB_ITEMS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Link
            key={tab.key}
            href={buildTabHref(churchSlug, tab.key)}
            className={
              isActive
                ? "inline-flex items-center rounded-2xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition"
                : "inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function LeadershipWorkspace({
  churchSlug,
  churchName,
  activeTab,
  tabData,
}: LeadershipWorkspaceProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Leadership"
        title={`Leadership for ${churchName ?? "this church"}`}
        description="Review department leadership requests, approve leaders, and manage the active leadership structure across church departments."
      />

      {renderTabNav(churchSlug, activeTab)}

      {activeTab === "overview" && tabData.tab === "overview" ? (
        <LeadershipOverviewTab data={tabData.data} />
      ) : null}

      {activeTab === "requests" && tabData.tab === "requests" ? (
        <WorkspaceSectionCard
          title="Leadership Requests"
          description="Approve or reject department leadership requests submitted during onboarding or later profile completion."
          contentClassName="space-y-6"
        >
          <LeadershipRequestsTab churchSlug={churchSlug} data={tabData.data} />
        </WorkspaceSectionCard>
      ) : null}

      {activeTab === "active_leaders" && tabData.tab === "active_leaders" ? (
        <WorkspaceSectionCard
          title="Active Department Leaders"
          description="Current approved leadership assignments by department."
          contentClassName="space-y-6"
        >
          <ActiveDepartmentLeadersTab data={tabData.data} />
        </WorkspaceSectionCard>
      ) : null}
    </div>
  );
}

