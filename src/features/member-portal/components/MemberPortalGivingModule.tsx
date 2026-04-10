import { WorkspaceEmptyState, WorkspaceSectionCard } from "@/components/workspace";
import { getLabel, inflowTypeLabels } from "@/lib/display-maps";
import type { MemberPortalGivingData } from "@/features/member-portal/types";
import { MemberPortalChipRow } from "./MemberPortalChipRow";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatDate, formatMoney } from "./memberPortalUiUtils";

type MemberPortalGivingModuleProps = {
  data: MemberPortalGivingData;
};

export function MemberPortalGivingModule({ data }: MemberPortalGivingModuleProps) {
  const currentYear = new Date().getFullYear();

  const years = Array.from(
    new Set(
      data.recent
        .map((item) => new Date(item.inflowDate).getFullYear())
        .filter((value) => Number.isFinite(value))
        .slice(0, 3)
    )
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <MemberPortalModuleHero
        eyebrow="My Giving"
        title="Stewardship Summary"
        description="Review your contributions and year-to-date giving totals."
        badges={[`YTD ${formatMoney(data.yearToDateTotal)}`]}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-600">Year-to-date {currentYear}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-950">
              {formatMoney(data.yearToDateTotal)}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            Total {formatMoney(data.totalGiving)}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tithe</span>
            <span className="font-medium text-slate-900">{formatMoney(data.totalTithe)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Offering</span>
            <span className="font-medium text-slate-900">{formatMoney(data.totalOffering)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Donation</span>
            <span className="font-medium text-slate-900">{formatMoney(data.totalDonation)}</span>
          </div>
        </div>
      </div>

      <WorkspaceSectionCard
        title="Contribution History"
        description="Most recent giving records linked to your member account."
        contentClassName="space-y-3"
      >
        <MemberPortalChipRow
          chips={[
            { label: "All", active: true },
            ...years.map((year) => ({ label: String(year) })),
          ]}
        />

        {data.recent.length > 0 ? (
          <div className="space-y-2">
            {data.recent.map((item) => (
              <div
                key={item.id}
                className="mobile-touch-feedback flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {getLabel(inflowTypeLabels, item.inflowType)}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(item.inflowDate)}</p>
                  {item.note?.trim() ? (
                    <p className="truncate text-xs text-slate-500">{item.note}</p>
                  ) : null}
                </div>
                <span className="shrink-0 font-semibold text-emerald-700">
                  +{formatMoney(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <WorkspaceEmptyState
            title="No giving records yet"
            message="When your contributions are recorded, they will appear here."
            className="min-h-[180px]"
          />
        )}
      </WorkspaceSectionCard>
    </div>
  );
}
