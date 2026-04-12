import Link from "next/link";

import {
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import type {
  AccessControlPermissionsData,
  AccessControlTabData,
  AccessControlTabKey,
} from "@/features/access-control/types";
import { InviteLinkPanel } from "./InviteLinkPanel";
import { PendingAccessRequestsPanel } from "./PendingAccessRequestsPanel";
import { AccessControlPermissionsPanel } from "./AccessControlPermissionsPanel";

type AccessControlWorkspaceProps = {
  permissionsData: AccessControlPermissionsData;
  activeTab: AccessControlTabKey;
  tabData: AccessControlTabData;
};

const TAB_ITEMS: Array<{ key: AccessControlTabKey; label: string }> = [
  { key: "permissions", label: "Permissions" },
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

function renderPermissionsTab(
  churchSlug: string,
  data: AccessControlPermissionsData
) {
  if (data.users.length === 0) {
    return (
      <WorkspaceSectionCard
        title="Permissions Workspace"
        description="Select a church user to review and manage their access."
      >
        <WorkspaceEmptyState
          title="No church users found"
          message="Invite or activate users first, then assign roles and permissions from this workspace."
        />
      </WorkspaceSectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStatCard
          label="Church Users"
          value={String(data.summary.totalUsers)}
          hint="Users in this church access workspace"
        />
        <WorkspaceStatCard
          label="Active Roles"
          value={String(data.summary.activeRoleAssignments)}
          hint="Currently active role assignments"
        />
        <WorkspaceStatCard
          label="Active Permissions"
          value={String(data.summary.activePermissionAssignments)}
          hint="Currently active permission grants"
        />
        <WorkspaceStatCard
          label="Permission Types"
          value={String(data.permissions.length)}
          hint="Available permission definitions"
        />
      </div>

      <WorkspaceSectionCard
        title="Permissions Workspace"
        description="Search church users, update active roles, and grant or revoke module permissions using real RBAC assignments."
      >
        <AccessControlPermissionsPanel
          churchSlug={churchSlug}
          data={data}
        />
      </WorkspaceSectionCard>
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
  permissionsData,
  activeTab,
  tabData,
}: AccessControlWorkspaceProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Access Control"
        title={`Manage access for ${permissionsData.churchName ?? "this church"}`}
        description="Control church roles and page permissions, manage secure invites, and review pending access requests from one workspace."
      />

      {renderTabNav(permissionsData.churchSlug, activeTab)}

      {activeTab === "permissions" && tabData.tab === "permissions"
        ? renderPermissionsTab(permissionsData.churchSlug, tabData.data)
        : null}

      {activeTab === "invites"
        ? renderInvitesTab(permissionsData.churchSlug, tabData)
        : null}

      {activeTab === "pending_access"
        ? renderPendingAccessTab(permissionsData.churchSlug, tabData)
        : null}
    </div>
  );
}


