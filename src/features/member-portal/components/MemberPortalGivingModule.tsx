import { BarChart3, CalendarDays, HandHeart, ReceiptText } from "lucide-react";
import { WorkspaceEmptyState } from "@/components/workspace";
import { getLabel, inflowTypeLabels } from "@/lib/display-maps";
import type { MemberPortalGivingData } from "@/features/member-portal/types";
import {
  MemberPortalCard,
  MemberPortalIconBubble,
  MemberPortalSectionHeader,
} from "./MemberPortalAppPrimitives";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatMoney } from "./memberPortalUiUtils";

type MemberPortalGivingModuleProps = {
  data: MemberPortalGivingData;
  unreadNotificationCount?: number;
};

export function MemberPortalGivingModule({
  data,
  unreadNotificationCount = 0,
}: MemberPortalGivingModuleProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero
        title="Giving"
        description="Your recorded contributions"
        unreadNotificationCount={unreadNotificationCount}
      />

      <MemberPortalCard className="bg-amber-50/50 py-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full text-emerald-950">
          <HandHeart className="size-12 text-emerald-950" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-emerald-950">Give with a cheerful heart</h2>
        <p className="mt-1 text-sm text-slate-600">Your giving makes a difference.</p>
      </MemberPortalCard>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Giving Summary" actionLabel="View all" />
        <MemberPortalCard className="p-0">
          <SummaryRow
            icon={BarChart3}
            title="This Month"
            subtitle={`${data.currentMonthCount} transaction${data.currentMonthCount === 1 ? "" : "s"}`}
            amount={formatMoney(data.currentMonthTotal)}
          />
          <SummaryRow
            icon={CalendarDays}
            title="Year to Date"
            subtitle={String(currentYear)}
            amount={formatMoney(data.yearToDateTotal)}
          />
        </MemberPortalCard>
      </section>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Recent Contributions" />
        {data.recent.length > 0 ? (
          <MemberPortalCard className="divide-y divide-amber-50 p-0">
            {data.recent.map((item) => (
              <div key={item.id} className="flex min-h-[76px] items-center gap-3 px-4 py-3">
                <MemberPortalIconBubble icon={ReceiptText} className="size-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {getLabel(inflowTypeLabels, item.inflowType)}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {formatContributionDate(item.inflowDate)}
                    {item.referenceNumber?.trim() ? ` · ${item.referenceNumber}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-emerald-950">
                  {formatMoney(item.amount)}
                </p>
              </div>
            ))}
          </MemberPortalCard>
        ) : (
          <WorkspaceEmptyState
            title="No recorded contributions"
            message="Contributions connected to your member record will appear here after the church treasury records them."
            className="min-h-[180px] border-amber-100 bg-white"
          />
        )}
      </section>
    </div>
  );
}

function formatContributionDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SummaryRow({
  icon,
  title,
  subtitle,
  amount,
}: {
  icon: typeof BarChart3;
  title: string;
  subtitle: string;
  amount: string;
}) {
  return (
    <div className="flex min-h-[82px] items-center gap-3 border-b border-amber-50 px-4 py-3 last:border-b-0">
      <MemberPortalIconBubble icon={icon} className="size-12" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p>
      </div>
      <p className="shrink-0 text-right text-sm font-semibold text-emerald-950">{amount}</p>
    </div>
  );
}
