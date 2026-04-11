import Link from "next/link";
import { ChevronRight, Home, MapPin, Users } from "lucide-react";
import {
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformHouseholdsSnapshot } from "@/features/platform/queries";

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
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

export default async function PlatformHouseholdsPage() {
  const snapshot = await getPlatformHouseholdsSnapshot();

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Household Signals"
        title="Cross-Church Household Registry"
        description="Review household coverage and linkage quality across churches for network-level visibility."
        badge={snapshot.totals.totalHouseholds + " households"}
        actions={[
          { href: "/platform/members", label: "Open Members" },
          { href: "/platform/reports", label: "Household Reports" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Total Households" value={snapshot.totals.totalHouseholds} hint="All household records" />
        <PlatformMobileStatCard label="Members Linked" value={snapshot.totals.membersLinkedToHouseholds} hint="With household assignment" />
        <PlatformMobileStatCard label="Loaded Rows" value={snapshot.rows.length} hint="Current mobile list" />
        <PlatformMobileStatCard label="Churches" value={new Set(snapshot.rows.map((row: any) => row.church_id)).size} hint="Churches represented" />
      </div>

      <PlatformMobileSectionCard title="Household List">
        <div className="space-y-2">
          {snapshot.rows.length > 0 ? (
            snapshot.rows.map((row: any) => {
              const church = getChurch(row.churches);
              return (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.household_name ?? "Unnamed household"}</p>
                      <p className="truncate text-xs text-slate-500">{church?.name ?? "Church record"}</p>
                    </div>
                    <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {formatDate(row.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[row.city, row.country].filter(Boolean).join(", ") || "Location pending"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No household records available yet.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Related Oversight Surfaces">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/platform/members"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Members
            <Users className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/reports"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Reports
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>

      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <Home className="h-4 w-4 text-slate-500" />
        Household summaries are ready for deeper analytics wiring.
      </div>
    </div>
  );
}
