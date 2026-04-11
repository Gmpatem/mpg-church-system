import {
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import {
  getPlatformBillingOverview,
  getPlatformChurchOversightData,
} from "@/features/platform/queries";

export default async function PlatformReportsPage() {
  const [oversight, billing] = await Promise.all([
    getPlatformChurchOversightData(),
    getPlatformBillingOverview(),
  ]);

  const riskDistribution = [
    { label: "Healthy", value: oversight.summary.healthyChurches },
    { label: "Watchlist", value: oversight.summary.warningChurches },
    { label: "Critical", value: oversight.summary.criticalChurches },
    { label: "Inactive", value: oversight.summary.inactiveChurches },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Network Analytics"
        title="Conference and Union Reporting Intelligence"
        description="Aggregate analytics for church health, compliance posture, adoption maturity, and intervention pressure across the network."
        badges={[
          `${oversight.summary.totalChurches} churches`,
          `${oversight.summary.complianceSubmissionRate}% compliance`,
          `${oversight.summary.adoptionAverage} adoption`,
        ]}
        actions={[
          { href: "/platform/oversight", label: "Open Intervention Queue" },
          { href: "/platform/regions", label: "Regional Drill-down", variant: "secondary" },
        ]}
      />

      <PlatformKpiGrid>
        <PlatformKpiCard
          label="Total Churches"
          value={oversight.summary.totalChurches}
          hint={`${oversight.summary.activeChurches} active`}
        />
        <PlatformKpiCard
          label="At-Risk Churches"
          value={
            oversight.summary.warningChurches +
            oversight.summary.criticalChurches +
            oversight.summary.inactiveChurches
          }
          hint="Watchlist, critical, inactive"
          tone="warning"
        />
        <PlatformKpiCard
          label="Compliance Rate"
          value={`${oversight.summary.complianceSubmissionRate}%`}
          hint="Reporting signal completion"
          tone={
            oversight.summary.complianceSubmissionRate >= 67
              ? "positive"
              : oversight.summary.complianceSubmissionRate >= 34
                ? "warning"
                : "critical"
          }
        />
        <PlatformKpiCard
          label="Adoption Score"
          value={oversight.summary.adoptionAverage}
          hint="Network utilization"
        />
        <PlatformKpiCard
          label="Open Support"
          value={oversight.summary.openSupportTickets}
          hint="Adoption blockers"
          tone="warning"
        />
        <PlatformKpiCard
          label="Pending Approvals"
          value={oversight.summary.pendingApprovals}
          hint="Governance workload"
        />
        <PlatformKpiCard
          label="Members"
          value={oversight.summary.totalMembers}
          hint="Network footprint"
        />
        <PlatformKpiCard
          label="New Churches (90d)"
          value={oversight.summary.newChurchesLast90Days}
          hint="Onboarding momentum"
          tone="positive"
        />
      </PlatformKpiGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <PlatformSectionCard
          title="Risk Distribution"
          description="Current health segmentation across the network."
          actionLabel="Open Oversight"
          actionHref="/platform/oversight"
        >
          <div className="space-y-2.5">
            {riskDistribution.map((row) => {
              const percentage =
                oversight.summary.totalChurches > 0
                  ? Math.round((row.value / oversight.summary.totalChurches) * 100)
                  : 0;

              return (
                <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium text-slate-900">{row.label}</p>
                    <p className="text-slate-600">{row.value} churches</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{percentage}% of network</p>
                </div>
              );
            })}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          title="Regional Comparison"
          description="Health and compliance posture by region."
          actionLabel="Open Regions"
          actionHref="/platform/regions"
        >
          <div className="space-y-2.5">
            {oversight.regions.slice(0, 8).map((region) => (
              <div
                key={region.region}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{region.region}</p>
                  <p className="text-xs text-slate-500">{region.churches} churches</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Health {region.averageHealthScore} · Compliance {region.averageComplianceRate}% · At risk {region.atRiskChurches}
                </p>
              </div>
            ))}
            {oversight.regions.length === 0 ? (
              <p className="text-sm text-slate-500">No regional data available yet.</p>
            ) : null}
          </div>
        </PlatformSectionCard>
      </div>

      <PlatformSectionCard
        title="Billing and Plan Oversight"
        description="Portfolio billing posture derived from activation and oversight signals."
        actionLabel="Open Billing"
        actionHref="/platform/billing"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Active Billing</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{billing.totals.active}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Trial</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{billing.totals.trial}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Needs Attention</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{billing.totals.attention}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Overdue</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{billing.totals.overdue}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">{billing.note}</p>
      </PlatformSectionCard>
    </div>
  );
}
