import { BarChart3, CalendarDays, ChevronRight, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

const quickAmounts = [500, 1000, 2000, 5000, 10000] as const;

export function MemberPortalGivingModule({ data }: MemberPortalGivingModuleProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentMonthTotal = data.recent.reduce((sum, item) => {
    const date = new Date(item.inflowDate);
    if (Number.isNaN(date.getTime())) return sum;
    if (date.getFullYear() !== currentYear || date.getMonth() !== currentMonth) return sum;
    return sum + item.amount;
  }, 0);
  const currentMonthCount = data.recent.filter((item) => {
    const date = new Date(item.inflowDate);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  }).length;

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero title="Giving" description="Cheerful giver" />

      <MemberPortalCard className="bg-amber-50/50 py-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full text-emerald-950">
          <HandHeart className="size-12 text-emerald-950" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-emerald-950">Give with a cheerful heart</h2>
        <p className="mt-1 text-sm text-slate-600">Your giving makes a difference.</p>
      </MemberPortalCard>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Quick Give" />
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              className="mobile-touch-feedback flex min-h-[74px] flex-col items-center justify-center rounded-[14px] border border-amber-100 bg-white px-2 py-3 text-center shadow-sm shadow-amber-950/5 hover:bg-amber-50"
            >
              <span className="text-lg font-semibold leading-none text-emerald-950">
                {new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(amount)}
              </span>
              <span className="mt-1 text-xs text-slate-600">XAF</span>
            </button>
          ))}
          <button
            type="button"
            className="mobile-touch-feedback flex min-h-[74px] items-center justify-center rounded-[14px] border border-amber-100 bg-white px-2 py-3 text-sm font-medium text-slate-950 shadow-sm shadow-amber-950/5 hover:bg-amber-50"
          >
            Other
          </button>
        </div>
        <Button
          type="button"
          disabled
          className="mt-1 h-12 rounded-[14px] bg-emerald-900 text-white hover:bg-emerald-900 disabled:opacity-80"
          title="Online giving is not connected yet"
        >
          Give Now
          <ChevronRight data-icon="inline-end" />
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Giving Summary" actionLabel="View all" />
        <MemberPortalCard className="p-0">
          <SummaryRow
            icon={BarChart3}
            title="This Month"
            subtitle={`${currentMonthCount} transaction${currentMonthCount === 1 ? "" : "s"}`}
            amount={formatMoney(currentMonthTotal)}
          />
          <SummaryRow
            icon={CalendarDays}
            title="Year to Date"
            subtitle={String(currentYear)}
            amount={formatMoney(data.yearToDateTotal)}
          />
        </MemberPortalCard>
      </section>
    </div>
  );
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
