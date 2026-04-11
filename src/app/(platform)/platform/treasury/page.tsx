import Link from "next/link";
import { ArrowUpRight, Building2, Coins, Landmark, Wallet } from "lucide-react";
import {
  PlatformMobileAttentionStrip,
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformTreasurySnapshot } from "@/features/platform/queries";

const INFLOW_TYPE_LABELS: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  donation: "Donation",
  mission: "Mission",
  fundraising: "Fundraising",
};

function getInflowTypeLabel(value: string | null | undefined) {
  if (!value) return "Contribution";
  return INFLOW_TYPE_LABELS[value] ?? "Contribution";
}

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlatformTreasuryPage() {
  const snapshot = await getPlatformTreasurySnapshot();

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Treasury Signals"
        title="Network Financial Signal Monitor"
        description="Track aggregate inflow and outflow posture across churches for executive oversight."
        badge={snapshot.totals.fundCount + " funds"}
        actions={[
          { href: "/platform", label: "Back to Dashboard" },
          { href: "/platform/reports", label: "Financial Reports" },
        ]}
      />

      <PlatformMobileAttentionStrip>
        <p className="font-medium">
          Net balance is {formatCurrency(snapshot.totals.netBalance)} across all tracked funds.
        </p>
        <p className="mt-1 text-xs text-amber-800">Use this as an oversight summary; transaction entry remains church-scoped.</p>
      </PlatformMobileAttentionStrip>

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Total In" value={formatCurrency(snapshot.totals.totalIn)} hint="All inflows" />
        <PlatformMobileStatCard label="Total Out" value={formatCurrency(snapshot.totals.totalOut)} hint="All outflows" />
        <PlatformMobileStatCard label="Net Balance" value={formatCurrency(snapshot.totals.netBalance)} hint="Inflow minus outflow" />
        <PlatformMobileStatCard label="Fund Count" value={snapshot.totals.fundCount} hint="Configured treasury funds" />
      </div>

      <PlatformMobileSectionCard title="Recent Inflows">
        <div className="space-y-2">
          {snapshot.recentInflows.length > 0 ? (
            snapshot.recentInflows.map((row: any) => {
              const church = getChurch(row.churches);
              return (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{getInflowTypeLabel(row.inflow_type)}</p>
                      <p className="text-xs text-slate-500">{church?.name ?? "Platform record"}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">{formatCurrency(Number(row.amount || 0))}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(row.inflow_date)}</span>
                    <span>{row.is_anonymous ? "Anonymous" : "Linked contribution"}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No inflow records available yet.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Related Oversight Surfaces">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            href="/platform/reports"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Reports
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/approvals"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Approvals
            <Building2 className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/calendar"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Calendar
            <Landmark className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>
    </div>
  );
}
