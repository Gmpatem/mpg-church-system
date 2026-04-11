import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ComplianceAlertRail,
  PlatformExecutiveHero,
  PlatformKpiCard,
  PlatformKpiGrid,
  PlatformSectionCard,
} from "@/features/platform/components/PlatformOversightPrimitives";
import { getPlatformBillingOverview, getPlatformChurchById, getPlatformChurchOversightData } from "@/features/platform/queries";

interface PageProps {
  params: Promise<{ churchId: string }>;
}

function riskLabel(level: "healthy" | "warning" | "critical" | "inactive") {
  if (level === "healthy") return "Healthy";
  if (level === "warning") return "Watchlist";
  if (level === "critical") return "Critical";
  return "Inactive";
}

function reportingLabel(state: "complete" | "partial" | "missing") {
  if (state === "complete") return "Complete";
  if (state === "partial") return "Partial";
  return "Missing";
}

function billingLabel(state: "trial" | "active" | "attention" | "overdue") {
  if (state === "trial") return "Trial";
  if (state === "active") return "Active";
  if (state === "attention") return "Attention";
  return "Overdue";
}

export default async function PlatformChurchDetailPage({ params }: PageProps) {
  const { churchId } = await params;

  const [churchProfile, oversight, billing] = await Promise.all([
    getPlatformChurchById(churchId),
    getPlatformChurchOversightData(),
    getPlatformBillingOverview(),
  ]);

  if (!churchProfile) {
    notFound();
  }

  const church = oversight.churches.find((item) => item.churchId === churchId);
  const billingRow = billing.rows.find((item) => item.churchId === churchId);

  if (!church) {
    notFound();
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PlatformExecutiveHero
        eyebrow="Church Oversight Detail"
        title={church.name}
        description="Executive drill-down for health, compliance, governance risk, adoption, and intervention readiness."
        badges={[
          church.isActive ? "Active" : "Inactive",
          `${church.healthScore} health score`,
          `${church.complianceRate}% compliance`,
        ]}
        actions={[
          { href: "/platform/churches", label: "Back to Directory" },
          { href: `/c/${church.slug}`, label: "Open Church Workspace" },
          { href: "/platform/oversight", label: "Intervention Queue", variant: "secondary" },
        ]}
      />

      {church.interventionReasons.length > 0 ? (
        <ComplianceAlertRail
          title={`${church.name} requires intervention`}
          summary={church.interventionReasons.join(" · ")}
          href="/platform/support"
          actionLabel="Open Support"
        />
      ) : null}

      <PlatformKpiGrid className="lg:grid-cols-6">
        <PlatformKpiCard label="Health" value={church.healthScore} hint={riskLabel(church.riskLevel)} tone={church.riskLevel === "healthy" ? "positive" : church.riskLevel === "warning" ? "warning" : "critical"} />
        <PlatformKpiCard label="Compliance" value={`${church.complianceRate}%`} hint={reportingLabel(church.reportingState)} tone={church.reportingState === "complete" ? "positive" : church.reportingState === "partial" ? "warning" : "critical"} />
        <PlatformKpiCard label="Adoption" value={church.adoptionScore} hint="Utilization score" />
        <PlatformKpiCard label="Members" value={church.memberCount} hint="Network footprint" />
        <PlatformKpiCard label="Pending Approvals" value={church.pendingApprovalCount} hint="Governance queue" tone={church.pendingApprovalCount > 0 ? "warning" : "positive"} />
        <PlatformKpiCard label="Open Support" value={church.openSupportTicketCount} hint="Intervention signals" tone={church.openSupportTicketCount > 0 ? "warning" : "positive"} />
      </PlatformKpiGrid>

      <div className="grid gap-5 xl:grid-cols-2">
        <PlatformSectionCard
          title="Governance and Reporting"
          description="Operational oversight posture based on recent activity and governance flow."
        >
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Reporting State</p>
              <p className="mt-1 font-medium text-slate-900">{reportingLabel(church.reportingState)}</p>
              <p className="mt-1 text-xs text-slate-600">Proxy based on recent event, finance, and active-user signals.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Pending Approval Load</p>
              <p className="mt-1 font-medium text-slate-900">{church.pendingApprovalCount} item(s)</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Support Blockers</p>
              <p className="mt-1 font-medium text-slate-900">{church.openSupportTicketCount} open · {church.urgentSupportTicketCount} urgent</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active Users</p>
              <p className="mt-1 font-medium text-slate-900">{church.activeUserCount} of {church.totalUserCount}</p>
            </div>
          </div>
        </PlatformSectionCard>

        <PlatformSectionCard
          title="Commercial and Lifecycle"
          description="Billing posture and church lifecycle derived from platform-level settings and oversight signals."
        >
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Plan Tier</p>
              <p className="mt-1 font-medium text-slate-900">{billingRow?.planLabel ?? "Starter"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Billing State</p>
              <p className="mt-1 font-medium text-slate-900">{billingRow ? billingLabel(billingRow.billingState) : "Unspecified"}</p>
              <p className="mt-1 text-xs text-slate-600">Trial window: {billing.trialDays} days</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Estimated Renewal</p>
              <p className="mt-1 font-medium text-slate-900">{billingRow?.estimatedRenewalDate ?? "Not available"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Recent Inflow Signal</p>
              <p className="mt-1 font-medium text-slate-900">{church.recentInflowCount} entries · ${church.recentInflowAmount.toLocaleString("en-US")}</p>
            </div>
          </div>
        </PlatformSectionCard>
      </div>

      <PlatformSectionCard
        title="Church Profile and Regional Placement"
        description="Identity and hierarchy reference for conference/union governance operations."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Church Name</p>
            <p className="mt-1 font-medium text-slate-900">{churchProfile.name}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Region</p>
            <p className="mt-1 font-medium text-slate-900">{church.regionKey}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Language</p>
            <p className="mt-1 font-medium text-slate-900">{church.defaultLanguage ?? "Not set"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Timezone</p>
            <p className="mt-1 font-medium text-slate-900">{church.timezone ?? "Not set"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Location</p>
            <p className="mt-1 font-medium text-slate-900">{[church.city, church.country].filter(Boolean).join(", ") || "Not set"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Contact</p>
            <p className="mt-1 font-medium text-slate-900">{church.email ?? "No email"}</p>
            <p className="text-xs text-slate-600">{church.phone ?? "No phone"}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/platform/churches"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            Back to Directory
          </Link>
          <Link
            href={`/c/${church.slug}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            Open Church Workspace
          </Link>
          <Link
            href="/platform/support"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            Open Support Queue
          </Link>
          <Link
            href="/platform/reports"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            Network Reports
          </Link>
        </div>
      </PlatformSectionCard>
    </div>
  );
}
