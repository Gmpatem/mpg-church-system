import Link from "next/link";
import {
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import {
  getPlatformAccessControlSnapshot,
  getPlatformChurchOversightData,
} from "@/features/platform/queries";

export default async function PlatformAccessControlPage() {
  const [snapshot, oversight] = await Promise.all([
    getPlatformAccessControlSnapshot(),
    getPlatformChurchOversightData(),
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Access and Governance"
        title="Platform Governance Authority Console"
        description="Monitor platform-level authority assignments, access posture, and security risks across the church network."
        badges={[
          `${snapshot.platformRoleCount} platform roles`,
          `${snapshot.churchRoleCount} church role assignments`,
          `${snapshot.pendingOrInactiveChurchUsers} non-active users`,
        ]}
        actions={[
          { href: "/platform/settings", label: "Open Policy Settings" },
          { href: "/platform/oversight", label: "Open Oversight", variant: "secondary" },
        ]}
      />

      <PlatformKpiGrid>
        <PlatformKpiCard
          label="Platform Roles"
          value={snapshot.platformRoleCount}
          hint="Global governance assignments"
        />
        <PlatformKpiCard
          label="Church Roles"
          value={snapshot.churchRoleCount}
          hint="Local governance assignments"
        />
        <PlatformKpiCard
          label="Active Church Users"
          value={snapshot.activeChurchUsers}
          hint="Current active accounts"
          tone="positive"
        />
        <PlatformKpiCard
          label="Pending or Inactive"
          value={snapshot.pendingOrInactiveChurchUsers}
          hint="Access hygiene backlog"
          tone={snapshot.pendingOrInactiveChurchUsers > 0 ? "warning" : "positive"}
        />
        <PlatformKpiCard
          label="Intervention Churches"
          value={oversight.summary.needsInterventionChurches}
          hint="Need governance follow-up"
          tone="warning"
        />
        <PlatformKpiCard
          label="Critical Churches"
          value={oversight.summary.criticalChurches}
          hint="High-risk operating status"
          tone="critical"
        />
      </PlatformKpiGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <PlatformSectionCard
          title="Governance Focus"
          description="Platform-level governance responsibilities and intervention posture."
        >
          <div className="space-y-2.5 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Authority Integrity</p>
              <p className="mt-1">
                Validate that platform-level roles are limited to approved system owner and conference/union leadership users.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Access Hygiene</p>
              <p className="mt-1">
                {snapshot.pendingOrInactiveChurchUsers} church users need status review to keep permissions clean.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Governance Response</p>
              <p className="mt-1">
                {oversight.summary.needsInterventionChurches} churches are in intervention scope and should be tracked with support and oversight teams.
              </p>
            </div>
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          title="Policy Surfaces"
          description="Primary governance pages for policy, support, and risk monitoring."
        >
          <div className="grid gap-2">
            <Link
              href="/platform/settings"
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Platform Governance Settings
            </Link>
            <Link
              href="/platform/oversight"
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Intervention Oversight Queue
            </Link>
            <Link
              href="/platform/support"
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Support Operations
            </Link>
            <Link
              href="/platform/reports"
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Network Analytics
            </Link>
          </div>
        </PlatformSectionCard>
      </div>
    </div>
  );
}
