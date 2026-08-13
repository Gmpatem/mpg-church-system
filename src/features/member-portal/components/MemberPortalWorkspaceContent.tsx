import { MemberMinistriesPortal } from "@/features/ministry-operations/components/MemberMinistriesPortal";
import { WorkspaceEmptyState } from "@/components/workspace";
import { MemberPortalDirectoryModule } from "@/features/member-portal/components/MemberPortalDirectoryModule";
import { MemberPortalEventsModule } from "@/features/member-portal/components/MemberPortalEventsModule";
import { MemberPortalGivingModule } from "@/features/member-portal/components/MemberPortalGivingModule";
import { MemberPortalHomeModule } from "@/features/member-portal/components/MemberPortalHomeModule";
import { MemberPortalModuleHero } from "@/features/member-portal/components/MemberPortalModuleHero";
import { MemberPortalProfileModule } from "@/features/member-portal/components/MemberPortalProfileModule";
import type {
  MemberPortalFoundationData,
  MemberPortalTabData,
  MemberPortalTabKey,
} from "@/features/member-portal/types";

type MemberPortalWorkspaceProps = {
  foundation: MemberPortalFoundationData;
  activeTab: MemberPortalTabKey;
  tabData: MemberPortalTabData;
};

function formatMemberName(foundation: MemberPortalFoundationData) {
  const member = foundation.identity?.member;
  const profile = foundation.profile;

  if (member?.display_name?.trim()) return member.display_name.trim();

  const fullName = [member?.first_name, member?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (profile?.full_name?.trim()) return profile.full_name.trim();

  return "Member";
}

function renderActiveModule({
  foundation,
  activeTab,
  tabData,
}: {
  foundation: MemberPortalFoundationData;
  activeTab: MemberPortalTabKey;
  tabData: MemberPortalTabData;
}) {
  const churchName = foundation.churchName ?? "Church";
  const churchSlug = foundation.churchSlug;
  const memberName = formatMemberName(foundation);
  const identity = foundation.identity;

  if (!identity) return null;

  if (activeTab === "overview" && tabData.tab === "overview" && tabData.data) {
    return (
      <MemberPortalHomeModule
        churchName={churchName}
        churchSlug={churchSlug}
        memberName={memberName}
        identity={identity}
        data={tabData.data}
        unreadNotificationCount={foundation.unreadNotificationCount}
      />
    );
  }

  if (activeTab === "ministries" && tabData.tab === "ministries" && tabData.data) {
    return (
      <MemberMinistriesPortal
        data={tabData.data}
        unreadNotificationCount={foundation.unreadNotificationCount}
      />
    );
  }

  if (activeTab === "departments" && tabData.tab === "departments" && tabData.data) {
    return (
      <MemberPortalDirectoryModule
        data={tabData.data}
        unreadNotificationCount={foundation.unreadNotificationCount}
      />
    );
  }

  if (
    (activeTab === "events" && tabData.tab === "events") ||
    (activeTab === "calendar" && tabData.tab === "calendar")
  ) {
    return (
      <MemberPortalEventsModule
        events={tabData.data}
        unreadNotificationCount={foundation.unreadNotificationCount}
      />
    );
  }

  if (activeTab === "giving" && tabData.tab === "giving" && tabData.data) {
    return (
      <MemberPortalGivingModule
        data={tabData.data}
        unreadNotificationCount={foundation.unreadNotificationCount}
      />
    );
  }

  if (activeTab === "profile" && tabData.tab === "profile" && tabData.data) {
    return (
      <MemberPortalProfileModule
        churchName={churchName}
        memberName={memberName}
        data={tabData.data}
        unreadNotificationCount={foundation.unreadNotificationCount}
      />
    );
  }

  return (
    <WorkspaceEmptyState
      title="Module not available"
      message="This section is not available for your current account at the moment."
      className="min-h-[200px]"
    />
  );
}

export function MemberPortalWorkspace({
  foundation,
  activeTab,
  tabData,
}: MemberPortalWorkspaceProps) {
  const churchSlug = foundation.churchSlug;
  const churchName = foundation.churchName ?? "Church";
  const isLinked = foundation.linkStatus === "linked";
  const identity = foundation.identity;

  if (!isLinked || !identity) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
        <MemberPortalModuleHero
          eyebrow="Member Portal"
          title={`Welcome to ${churchName}`}
          description="Your personal church workspace appears after your member record is linked to your account."
        />

        <WorkspaceEmptyState
          title="Your member portal is not linked yet"
          message="Your account can access this church, but your member record is not linked yet. A church admin needs to connect your account to your member profile first."
          actionLabel="Open church dashboard"
          actionHref={`/c/${churchSlug}`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      {renderActiveModule({ foundation, activeTab, tabData })}
    </div>
  );
}
