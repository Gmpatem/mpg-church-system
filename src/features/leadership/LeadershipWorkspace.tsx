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
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TAB_ITEMS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Link
            key={tab.key}
            href={buildTabHref(churchSlug, tab.key)}
            className={
              isActive
                ? "mobile-touch-feedback shrink-0 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition"
                : "mobile-touch-feedback shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
    <div className="space-y-5 md:space-y-6">
      <WorkspaceHero
        size="compact"
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

