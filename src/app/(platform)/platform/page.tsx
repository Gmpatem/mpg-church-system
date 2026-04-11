import Link from "next/link";
import {
  ChurchHealthCard,
  ComplianceAlertRail,
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import { getPlatformChurchOversightData } from "@/features/platform/queries";

function riskLabel(level: "healthy" | "warning" | "critical" | "inactive") {
  if (level === "healthy") return "Healthy";
  if (level === "warning") return "Watchlist";
  if (level === "critical") return "Critical";
  return "Inactive";
}

export default async function PlatformPage() {
  const data = await getPlatformChurchOversightData();
  const topRegions = data.regions.slice(0, 4);

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Network Command Center"
        title="Conference and Union Oversight Console"
        description="Executive view of church health, compliance posture, adoption signals, and intervention priority across the entire network."
        badges={[
          `${data.summary.totalChurches} churches`,
          `${data.summary.complianceSubmissionRate}% compliance`,
          `${data.summary.adoptionAverage} adoption score`,
        ]}
        actions={[
          { href: "/platform/churches", label: "Open Church Directory" },
          { href: "/platform/oversight", label: "Open Intervention Queue", variant: "secondary" },
        ]}
      />

      {data.alerts.slice(0, 2).map((alert) => (
        <ComplianceAlertRail
          key={alert.title}
          title={alert.title}
          summary={alert.summary}
          href="/platform/oversight"
          actionLabel="Review"
        />
      ))}

      <PlatformKpiGrid>
        <PlatformKpiCard label="Churches" value={data.summary.totalChurches} hint={`${data.summary.activeChurches} active`} />
        <PlatformKpiCard label="At Risk" value={data.summary.warningChurches + data.summary.criticalChurches + data.summary.inactiveChurches} hint="Warning, critical, inactive" tone="warning" />
        <PlatformKpiCard label="Missing Reports" value={data.summary.missingReportingChurches} hint="No recent reporting signals" tone="critical" />
        <PlatformKpiCard label="Members" value={data.summary.totalMembers} hint="Network-wide footprint" />
        <PlatformKpiCard label="Intervention Queue" value={data.summary.needsInterventionChurches} hint="Needs action" tone="warning" />
        <PlatformKpiCard label="Open Support" value={data.summary.openSupportTickets} hint="Unresolved blockers" tone="warning" />
        <PlatformKpiCard label="Pending Approvals" value={data.summary.pendingApprovals} hint="Governance workload" />
        <PlatformKpiCard label="New (90d)" value={data.summary.newChurchesLast90Days} hint="Recent church onboarding" tone="positive" />
      </PlatformKpiGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <PlatformSectionCard
          title="Top Performing Churches"
          description="High health and compliance signal churches with strong adoption."
          actionLabel="Full Directory"
          actionHref="/platform/churches"
        >
          <div className="space-y-3">
            {data.topPerformingChurches.length > 0 ? (
              data.topPerformingChurches.map((church) => (
                <ChurchHealthCard
                  key={church.churchId}
                  churchName={church.name}
                  regionLabel={church.regionKey}
                  statusLabel={church.isActive ? "Active" : "Inactive"}
                  healthScore={church.healthScore}
                  adoptionScore={church.adoptionScore}
                  complianceRate={church.complianceRate}
                  riskLabel={riskLabel(church.riskLevel)}
                  reasons={church.interventionReasons}
                  inspectHref={`/platform/churches/${church.churchId}`}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No churches available yet.</p>
            )}
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          title="Immediate Intervention"
          description="Churches requiring executive or conference-level intervention."
          actionLabel="Open Oversight"
          actionHref="/platform/oversight"
        >
          <div className="space-y-3">
            {data.interventionQueue.length > 0 ? (
              data.interventionQueue.slice(0, 6).map((church) => (
                <ChurchHealthCard
                  key={church.churchId}
                  churchName={church.name}
                  regionLabel={church.regionKey}
                  statusLabel={church.isActive ? "Active" : "Inactive"}
                  healthScore={church.healthScore}
                  adoptionScore={church.adoptionScore}
                  complianceRate={church.complianceRate}
                  riskLabel={riskLabel(church.riskLevel)}
                  reasons={church.interventionReasons}
                  inspectHref={`/platform/churches/${church.churchId}`}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No intervention queue items right now.</p>
            )}
          </div>
        </PlatformSectionCard>
      </div>

      <PlatformSectionCard
        title="Regional Snapshot"
        description="Union/conference region health posture and member distribution."
        actionLabel="Open Regions"
        actionHref="/platform/regions"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topRegions.length > 0 ? (
            topRegions.map((region) => (
              <div key={region.region} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-sm font-semibold text-slate-900">{region.region}</p>
                <p className="mt-1 text-xs text-slate-500">{region.churches} churches · {region.members.toLocaleString("en-US")} members</p>
                <p className="mt-2 text-xs text-slate-600">
                  Health {region.averageHealthScore} · Compliance {region.averageComplianceRate}%
                </p>
                <p className="mt-1 text-xs text-amber-700">{region.atRiskChurches} at risk</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No regional data available yet.</p>
          )}
        </div>
        <div className="mt-4">
          <Link
            href="/platform/reports"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Open Network Analytics
          </Link>
        </div>
      </PlatformSectionCard>
    </div>
  );
}
