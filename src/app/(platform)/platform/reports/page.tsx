import Link from "next/link";
import { ArrowUpRight, BarChart3, FileText, PieChart, TrendingUp } from "lucide-react";
import {
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import {
  getPlatformDashboardMetrics,
  getPlatformEventsSnapshot,
  getPlatformTreasurySnapshot,
} from "@/features/platform/queries";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function PlatformReportsPage() {
  const [dashboard, treasury, events] = await Promise.all([
    getPlatformDashboardMetrics(),
    getPlatformTreasurySnapshot(),
    getPlatformEventsSnapshot(10),
  ]);

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Reports Workspace"
        title="Platform Reporting"
        description="Review high-level performance and financial indicators from across church workspaces."
        badge="Executive summary"
        actions={[
          { href: "/platform/treasury", label: "Treasury Detail" },
          { href: "/platform/events", label: "Event Detail" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Churches" value={dashboard.totals.churches} hint="Total workspaces" />
        <PlatformMobileStatCard label="Members" value={dashboard.totals.members} hint="Platform-wide members" />
        <PlatformMobileStatCard label="Net Balance" value={formatCurrency(treasury.totals.netBalance)} hint="Treasury net position" />
        <PlatformMobileStatCard label="Upcoming Events" value={events.totals.upcomingEvents} hint="Scheduled activity" />
      </div>

      <PlatformMobileSectionCard title="Operational Summary">
        <div className="space-y-2 text-sm text-slate-700">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">Church health</p>
            <p className="mt-1">
              {dashboard.totals.activeChurches} active and {dashboard.totals.inactiveChurches} inactive church workspaces.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">Financial movement</p>
            <p className="mt-1">
              Inflows: {formatCurrency(treasury.totals.totalIn)} · Outflows: {formatCurrency(treasury.totals.totalOut)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-medium text-slate-900">Event flow</p>
            <p className="mt-1">
              {events.totals.pendingApprovals} pending approval events from {events.rows.length} listed records.
            </p>
          </div>
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Report Modules">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/platform/treasury"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Treasury Snapshot
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/events"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Event Snapshot
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/members"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Member Snapshot
            <PieChart className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/settings"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Reporting Settings
            <FileText className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>

      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <ArrowUpRight className="h-4 w-4 text-slate-500" />
        This report surface is ready for deeper chart integrations without changing the mobile shell.
      </div>
    </div>
  );
}
