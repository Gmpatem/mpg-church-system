import {
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import { getPlatformBillingOverview } from "@/features/platform/queries";

function billingStateLabel(state: "trial" | "active" | "attention" | "overdue") {
  if (state === "trial") return "Trial";
  if (state === "active") return "Active";
  if (state === "attention") return "Attention";
  return "Overdue";
}

function billingStateClass(state: "trial" | "active" | "attention" | "overdue") {
  if (state === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "trial") return "border-blue-200 bg-blue-50 text-blue-700";
  if (state === "attention") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default async function PlatformBillingPage() {
  const billing = await getPlatformBillingOverview();

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Billing and Plans"
        title="Network Commercial Oversight"
        description="Monitor church plan posture, trial lifecycle, and accounts requiring commercial follow-up."
        badges={[
          `${billing.rows.length} churches`,
          `${billing.totals.active} active`,
          `${billing.totals.overdue} overdue`,
        ]}
        actions={[
          { href: "/platform/churches", label: "Open Church Directory" },
          { href: "/platform/settings", label: "Billing Settings", variant: "secondary" },
        ]}
      />

      <PlatformKpiGrid>
        <PlatformKpiCard label="Active" value={billing.totals.active} hint="In good standing" tone="positive" />
        <PlatformKpiCard label="Trial" value={billing.totals.trial} hint={`${billing.trialDays}-day trial`} />
        <PlatformKpiCard label="Attention" value={billing.totals.attention} hint="Follow-up needed" tone="warning" />
        <PlatformKpiCard label="Overdue" value={billing.totals.overdue} hint="Immediate review" tone="critical" />
      </PlatformKpiGrid>

      <PlatformSectionCard
        title="Billing Portfolio"
        description="Commercial posture for each church based on current oversight signals."
      >
        <div className="space-y-2.5 md:hidden">
          {billing.rows.length > 0 ? (
            billing.rows.map((row) => (
              <div key={row.churchId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.churchName}</p>
                    <p className="text-xs text-slate-500">{row.region}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${billingStateClass(row.billingState)}`}
                  >
                    {billingStateLabel(row.billingState)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    Plan: <span className="font-medium text-slate-900">{row.planLabel}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    Health: <span className="font-medium text-slate-900">{row.healthScore}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    Compliance: <span className="font-medium text-slate-900">{row.complianceRate}%</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    Renewal: <span className="font-medium text-slate-900">{row.estimatedRenewalDate}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No billing rows available.</p>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Church</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Region</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">State</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Health</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compliance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {billing.rows.map((row) => (
                <tr key={row.churchId}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.churchName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.region}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.planLabel}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${billingStateClass(row.billingState)}`}
                    >
                      {billingStateLabel(row.billingState)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.healthScore}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.complianceRate}%</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.estimatedRenewalDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-500">{billing.note}</p>
      </PlatformSectionCard>
    </div>
  );
}
