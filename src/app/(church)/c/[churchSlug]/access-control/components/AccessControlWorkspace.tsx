import Link from "next/link";

import {
  WorkspaceEmptyState,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import { ChurchWorkspaceHeader } from "@/components/church-workspace";
import { MobileCompactStatsStrip } from "@/components/mobile/MobileCompactStatsStrip";
import { MobilePageHeader } from "@/components/mobile/MobilePageHeader";
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
                ? "mobile-touch-feedback inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition"
                : "mobile-touch-feedback inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
      <div className="md:hidden">
        <MobileCompactStatsStrip
          items={[
            { label: "Users", value: data.summary.totalUsers },
            { label: "Roles", value: data.summary.activeRoleAssignments },
            { label: "Permissions", value: data.summary.activePermissionAssignments },
            { label: "Types", value: data.permissions.length },
          ]}
        />
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
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
      <MobilePageHeader
        className="md:hidden"
        title="Access"
        subtitle="Manage roles, permissions, and requests"
      />

      <ChurchWorkspaceHeader
        className="hidden md:flex"
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


