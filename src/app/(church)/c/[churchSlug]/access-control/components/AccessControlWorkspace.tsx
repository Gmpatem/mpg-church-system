import Link from "next/link";

import {
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import type {
  AccessControlOverviewData,
  AccessControlTabData,
  AccessControlTabKey,
} from "@/features/access-control/types";
import { InviteLinkPanel } from "./InviteLinkPanel";
import { PendingAccessRequestsPanel } from "./PendingAccessRequestsPanel";

type AccessControlWorkspaceProps = {
  overview: AccessControlOverviewData;
  activeTab: AccessControlTabKey;
  tabData: AccessControlTabData;
};

const TAB_ITEMS: Array<{ key: AccessControlTabKey; label: string }> = [
  { key: "overview", label: "Permissions" },
  { key: "invites", label: "Invites" },
  { key: "pending_access", label: "Requests" },
];

function buildTabHref(churchSlug: string, tab: AccessControlTabKey) {
  return `/c/${churchSlug}/access-control?tab=${tab}`;
}

function renderTabNav(churchSlug: string, activeTab: AccessControlTabKey) {
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

function renderOverviewTab(data: AccessControlOverviewData) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStatCard
          label="Permission Types"
          value={String(data.totalPermissionDefinitions)}
          hint="Available page permissions"
        />
        <WorkspaceStatCard
          label="Assignments"
          value={String(data.totalPermissionAssignments)}
          hint="All permission assignment rows"
        />
        <WorkspaceStatCard
          label="Active Assignments"
          value={String(data.activePermissionAssignments)}
          hint="Currently active permission grants"
        />
        <WorkspaceStatCard
          label="Pastors"
          value={String(data.roleCounts.pastors)}
          hint="Active pastor role holders"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStatCard
          label="Church Admins"
          value={String(data.roleCounts.churchAdmins)}
          hint="Active church admins"
        />
        <WorkspaceStatCard
          label="Tech Team"
          value={String(data.roleCounts.techTeam)}
          hint="Active tech team members"
        />
        <WorkspaceStatCard
          label="Clerks"
          value={String(data.roleCounts.clerks)}
          hint="Active clerks"
        />
        <WorkspaceStatCard
          label="Secretaries"
          value={String(data.roleCounts.churchSecretaries)}
          hint="Active church secretaries"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkspaceSectionCard
          title="Permission Catalog"
          description="These are the page or module permissions currently available for assignment."
          contentClassName="space-y-3"
        >
          {data.permissions.length > 0 ? (
            <div className="space-y-3">
              {data.permissions.map((permission) => (
                <div key={permission.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{permission.name}</p>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                      {permission.code}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {permission.description?.trim()
                      ? permission.description
                      : "No description set."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No permission definitions were found.
            </p>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="What this module controls"
          description="Access Control brings roles and page permissions together in one workspace."
          contentClassName="space-y-3"
        >
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            Roles define who a person is in the system, such as Pastor, Church Admin, Tech Team, Clerk, or Church Secretary.
          </div>
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            Page Access will define which modules they can open, such as Members, Events, Treasury, Reports, or Settings.
          </div>
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            Invites now use secure token-based links and Pending Access reviews requested elevated roles before they become active.
          </div>
        </WorkspaceSectionCard>
      </div>
    </div>
  );
}

function renderInvitesTab(churchSlug: string, tabData: AccessControlTabData) {
  if (tabData.tab !== "invites") {
    return null;
  }

  return (
    <WorkspaceSectionCard
      title="Member Invites"
      description="Generate a secure onboarding invite for an existing member, then copy, review, or revoke that invite from one place."
      contentClassName="space-y-6"
    >
      <InviteLinkPanel churchSlug={churchSlug} data={tabData.data} />
    </WorkspaceSectionCard>
  );
}

function renderPendingAccessTab(churchSlug: string, tabData: AccessControlTabData) {
  if (tabData.tab !== "pending_access") {
    return null;
  }

  return (
    <WorkspaceSectionCard
      title="Pending Access Requests"
      description="Review church-wide role requests submitted during onboarding. Approval activates the real church role assignment."
      contentClassName="space-y-6"
    >
      <PendingAccessRequestsPanel churchSlug={churchSlug} data={tabData.data} />
    </WorkspaceSectionCard>
  );
}

export function AccessControlWorkspace({
  overview,
  activeTab,
  tabData,
}: AccessControlWorkspaceProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Access Control"
        title={`Manage access for ${overview.churchName ?? "this church"}`}
        description="Control permissions, manage secure invites, and review pending access requests from one workspace."
      />

      {renderTabNav(overview.churchSlug, activeTab)}

      {activeTab === "overview" && tabData.tab === "overview"
        ? renderOverviewTab(tabData.data)
        : null}

      {activeTab === "invites"
        ? renderInvitesTab(overview.churchSlug, tabData)
        : null}

      {activeTab === "pending_access"
        ? renderPendingAccessTab(overview.churchSlug, tabData)
        : null}
    </div>
  );
}


