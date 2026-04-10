import Link from "next/link";
import { ChevronRight, LockKeyhole, ShieldCheck, UserCheck, Users } from "lucide-react";
import {
  PlatformMobileAttentionStrip,
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformAccessControlSnapshot } from "@/features/platform/queries";

export default async function PlatformAccessControlPage() {
  const snapshot = await getPlatformAccessControlSnapshot();

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Access Control"
        title="Role & Access Overview"
        description="Monitor platform-level and church-level role assignments from one mobile admin workspace."
        badge={snapshot.platformRoleCount + " platform roles"}
        actions={[
          { href: "/platform/settings", label: "Security Settings" },
          { href: "/platform/members", label: "Member Access View" },
        ]}
      />

      <PlatformMobileAttentionStrip>
        <p className="font-medium">
          {snapshot.pendingOrInactiveChurchUsers} church user accounts are not in active status.
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Review role assignment quality regularly to keep permissions aligned across churches.
        </p>
      </PlatformMobileAttentionStrip>

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Platform Roles" value={snapshot.platformRoleCount} hint="Global assignments" />
        <PlatformMobileStatCard label="Church Roles" value={snapshot.churchRoleCount} hint="Scoped assignments" />
        <PlatformMobileStatCard label="Active Church Users" value={snapshot.activeChurchUsers} hint="Status active" />
        <PlatformMobileStatCard label="Pending/Inactive" value={snapshot.pendingOrInactiveChurchUsers} hint="Needs review" />
      </div>

      <PlatformMobileSectionCard title="Access Management Surfaces">
        <div className="space-y-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Platform role assignments are managed in the platform owner/admin workspace.
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Church role assignments remain scoped to each church workspace and access-control module.
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            User status trends help identify pending onboarding or inactive accounts that need follow-up.
          </div>
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Related Workspaces">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/platform/settings"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Settings
            <LockKeyhole className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/churches"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Churches
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>

      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <ShieldCheck className="h-4 w-4 text-slate-500" />
        <UserCheck className="h-4 w-4 text-slate-500" />
        <Users className="h-4 w-4 text-slate-500" />
        Access snapshots are live and ready for deeper policy tooling.
      </div>
    </div>
  );
}
