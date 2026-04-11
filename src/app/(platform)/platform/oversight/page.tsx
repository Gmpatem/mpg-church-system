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

export default async function PlatformOversightPage() {
  const data = await getPlatformChurchOversightData();
  const missingReporting = data.churches.filter((church) => church.reportingState === "missing");

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Intervention Oversight"
        title="Church Intervention and Risk Queue"
        description="Prioritize churches requiring conference, union, or system-owner support based on health, compliance, and governance signals."
        badges={[
          `${data.summary.needsInterventionChurches} intervention`,
          `${data.summary.criticalChurches} critical`,
          `${data.summary.missingReportingChurches} missing reports`,
        ]}
        actions={[
          { href: "/platform/churches", label: "Open Churches" },
          { href: "/platform/support", label: "Open Support", variant: "secondary" },
        ]}
      />

      {data.alerts.map((alert) => (
        <ComplianceAlertRail
          key={alert.title}
          title={alert.title}
          summary={alert.summary}
          href="/platform/support"
          actionLabel="Act"
        />
      ))}

      <PlatformKpiGrid>
        <PlatformKpiCard
          label="Intervention Queue"
          value={data.summary.needsInterventionChurches}
          hint="Needs executive follow-up"
          tone="warning"
        />
        <PlatformKpiCard
          label="Critical"
          value={data.summary.criticalChurches}
          hint="Immediate action"
          tone="critical"
        />
        <PlatformKpiCard
          label="Watchlist"
          value={data.summary.warningChurches}
          hint="Monitor closely"
          tone="warning"
        />
        <PlatformKpiCard
          label="Missing Reports"
          value={data.summary.missingReportingChurches}
          hint="No recent reporting signal"
          tone="critical"
        />
        <PlatformKpiCard
          label="Open Support"
          value={data.summary.openSupportTickets}
          hint="Support blockers"
          tone="warning"
        />
        <PlatformKpiCard
          label="Pending Approvals"
          value={data.summary.pendingApprovals}
          hint="Governance queue"
        />
      </PlatformKpiGrid>

      <PlatformSectionCard
        title="Intervention Queue"
        description="Churches sorted by lowest health scores and highest risk posture."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {data.interventionQueue.length > 0 ? (
            data.interventionQueue.map((church) => (
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

      <PlatformSectionCard
        title="Missing Reporting Coverage"
        description="Churches with missing reporting signals should be prioritized for reporting enablement."
      >
        <div className="space-y-2.5">
          {missingReporting.length > 0 ? (
            missingReporting.slice(0, 12).map((church) => (
              <div key={church.churchId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{church.name}</p>
                    <p className="text-xs text-slate-500">{church.regionKey}</p>
                  </div>
                  <Link
                    href={`/platform/churches/${church.churchId}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    Inspect
                  </Link>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Health {church.healthScore} · Adoption {church.adoptionScore} · Compliance {church.complianceRate}%
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">All churches currently show at least partial reporting signals.</p>
          )}
        </div>
      </PlatformSectionCard>
    </div>
  );
}
