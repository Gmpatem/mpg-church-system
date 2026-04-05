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
  { key: "overview", label: "Overview" },
  { key: "roles", label: "Roles" },
  { key: "page_access", label: "Page Access" },
  { key: "invites", label: "Invites" },
  { key: "pending_access", label: "Pending Access" },
  { key: "activity_log", label: "Activity Log" },
];

function buildTabHref(churchSlug: string, tab: AccessControlTabKey) {
  return `/c/${churchSlug}/access-control?tab=${tab}`;
}

function renderTabNav(churchSlug: string, activeTab: AccessControlTabKey) {
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

function renderPlaceholderTab(
  activeTab: AccessControlTabKey,
  churchSlug: string
) {
  const copy: Record<AccessControlTabKey, { title: string; body: string }> = {
    overview: {
      title: "Overview",
      body:
        "This overview will summarize elevated users, active role holders, and permission coverage across the church system.",
    },
    roles: {
      title: "Roles tab is next",
      body:
        "This tab will manage church positions like Pastor, Church Admin, Tech Team, Clerk, and Church Secretary.",
    },
    page_access: {
      title: "Page Access tab is next",
      body:
        "This tab will let authorized leaders tick checkboxes for which pages or modules each person can access.",
    },
    invites: {
      title: "Invites",
      body:
        "This tab will help leaders generate and share church onboarding links with members.",
    },
    pending_access: {
      title: "Pending Access",
      body:
        "This tab reviews church-wide access requests submitted during onboarding or later profile completion.",
    },
    activity_log: {
      title: "Activity Log tab is next",
      body:
        "This tab will display recent role changes, permission updates, and access-control history.",
    },
  };

  const item = copy[activeTab];

  return (
    <WorkspaceSectionCard
      title={item.title}
      description={item.body}
      contentClassName="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Current tab: <span className="font-medium text-foreground">{activeTab}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => (
          <Link
            key={tab.key}
            href={buildTabHref(churchSlug, tab.key)}
            className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            Open {tab.label}
          </Link>
        ))}
      </div>
    </WorkspaceSectionCard>
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Access Control"
        title={`Manage access for ${overview.churchName ?? "this church"}`}
        description="Control elevated roles, checkbox-based page permissions, secure onboarding invites, and pending access approvals inside one workspace."
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

      {activeTab !== "overview" && activeTab !== "invites" && activeTab !== "pending_access"
        ? renderPlaceholderTab(activeTab, overview.churchSlug)
        : null}
    </div>
  );
}


