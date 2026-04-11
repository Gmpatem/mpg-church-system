import Link from "next/link";
import { ChurchStatusToggle } from "@/app/(platform)/platform/churches/ChurchStatusToggle";
import {
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import { getPlatformChurchOversightData } from "@/features/platform/queries";

function reportingLabel(state: "complete" | "partial" | "missing") {
  if (state === "complete") return "Complete";
  if (state === "partial") return "Partial";
  return "Missing";
}

function riskBadge(level: "healthy" | "warning" | "critical" | "inactive") {
  if (level === "healthy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (level === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
  if (level === "critical") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

function riskLabel(level: "healthy" | "warning" | "critical" | "inactive") {
  if (level === "healthy") return "Healthy";
  if (level === "warning") return "Watchlist";
  if (level === "critical") return "Critical";
  return "Inactive";
}

export default async function PlatformChurchesPage() {
  const data = await getPlatformChurchOversightData();

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Church Directory"
        title="Multi-Church Oversight Registry"
        description="Master directory for conference and union supervision with health, compliance, reporting, and intervention visibility."
        badges={[
          `${data.summary.totalChurches} churches`,
          `${data.summary.activeChurches} active`,
          `${data.summary.needsInterventionChurches} intervention`,
        ]}
        actions={[
          { href: "/platform/oversight", label: "Intervention Queue" },
          { href: "/platform/regions", label: "Regional Structure", variant: "secondary" },
        ]}
      />

      <PlatformKpiGrid className="lg:grid-cols-5">
        <PlatformKpiCard label="Healthy" value={data.summary.healthyChurches} hint="Low risk posture" tone="positive" />
        <PlatformKpiCard label="Warning" value={data.summary.warningChurches} hint="Needs monitoring" tone="warning" />
        <PlatformKpiCard label="Critical" value={data.summary.criticalChurches} hint="Immediate intervention" tone="critical" />
        <PlatformKpiCard label="Inactive" value={data.summary.inactiveChurches} hint="Not operating" tone="warning" />
        <PlatformKpiCard label="Missing Reports" value={data.summary.missingReportingChurches} hint="No recent signal" tone="critical" />
      </PlatformKpiGrid>

      <PlatformSectionCard
        title="Church Oversight Table"
        description="Use this table to prioritize interventions, validate compliance, and monitor adoption by church."
      >
        <div className="space-y-3 md:hidden">
          {data.churches.map((church) => (
            <div key={church.churchId} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{church.name}</p>
                  <p className="truncate text-xs text-slate-500">{church.regionKey}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${riskBadge(church.riskLevel)}`}>
                  {riskLabel(church.riskLevel)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Health</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{church.healthScore}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Adoption</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{church.adoptionScore}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Compliance</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{church.complianceRate}%</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>{church.memberCount.toLocaleString("en-US")} members</span>
                <span>·</span>
                <span>{reportingLabel(church.reportingState)} reporting</span>
                <span>·</span>
                <span>{church.openSupportTicketCount} open support</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href={`/platform/churches/${church.churchId}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700"
                >
                  Inspect
                </Link>
                <Link
                  href={`/c/${church.slug}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700"
                >
                  Open Church
                </Link>
                <Link
                  href={`/platform/oversight`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700"
                >
                  Queue
                </Link>
                <ChurchStatusToggle churchId={church.churchId} isActive={church.isActive} />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Church</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Region</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Members</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Health</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compliance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Adoption</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reporting</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Risk</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.churches.map((church) => (
                <tr key={church.churchId}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{church.name}</p>
                    <p className="text-xs text-slate-500">{church.isActive ? "Active" : "Inactive"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{church.regionKey}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{church.memberCount.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{church.healthScore}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{church.complianceRate}%</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{church.adoptionScore}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{reportingLabel(church.reportingState)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${riskBadge(church.riskLevel)}`}>
                      {riskLabel(church.riskLevel)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/c/${church.slug}`}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open Church
                      </Link>
                      <Link
                        href={`/platform/churches/${church.churchId}`}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Inspect
                      </Link>
                      <ChurchStatusToggle churchId={church.churchId} isActive={church.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PlatformSectionCard>
    </div>
  );
}
