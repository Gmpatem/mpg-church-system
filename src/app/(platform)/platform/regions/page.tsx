import Link from "next/link";
import {
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import { getPlatformChurchOversightData } from "@/features/platform/queries";

export default async function PlatformRegionsPage() {
  const data = await getPlatformChurchOversightData();

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Regions and Structure"
        title="Union and Conference Regional Structure"
        description="Browse the network by region with church counts, health posture, and compliance signals for fast governance drill-down."
        badges={[
          `${data.regions.length} regions`,
          `${data.summary.totalChurches} churches`,
          `${data.summary.totalMembers} members`,
        ]}
        actions={[
          { href: "/platform/churches", label: "Open Church Directory" },
          { href: "/platform/reports", label: "Open Analytics", variant: "secondary" },
        ]}
      />

      <PlatformKpiGrid>
        <PlatformKpiCard label="Regions" value={data.regions.length} hint="Grouped structure units" />
        <PlatformKpiCard
          label="Active Churches"
          value={data.summary.activeChurches}
          hint="Currently operating"
          tone="positive"
        />
        <PlatformKpiCard
          label="At-Risk Churches"
          value={data.summary.warningChurches + data.summary.criticalChurches + data.summary.inactiveChurches}
          hint="Watchlist + critical + inactive"
          tone="warning"
        />
        <PlatformKpiCard
          label="Compliance"
          value={`${data.summary.complianceSubmissionRate}%`}
          hint="Average reporting completion"
        />
      </PlatformKpiGrid>

      <PlatformSectionCard
        title="Regional Breakdown"
        description="Compare health and compliance by region to prioritize intervention resources."
      >
        <div className="space-y-3">
          {data.regions.length > 0 ? (
            data.regions.map((region) => (
              <div key={region.region} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{region.region}</p>
                  <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    {region.churches} churches
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Active</p>
                    <p className="mt-1 font-semibold text-slate-900">{region.activeChurches}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">At Risk</p>
                    <p className="mt-1 font-semibold text-slate-900">{region.atRiskChurches}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Members</p>
                    <p className="mt-1 font-semibold text-slate-900">{region.members.toLocaleString("en-US")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Compliance</p>
                    <p className="mt-1 font-semibold text-slate-900">{region.averageComplianceRate}%</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">Average health score: {region.averageHealthScore}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No regional structure data is available.</p>
          )}
        </div>

        <div className="mt-4">
          <Link
            href="/platform/oversight"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            Open Intervention Queue
          </Link>
        </div>
      </PlatformSectionCard>
    </div>
  );
}
