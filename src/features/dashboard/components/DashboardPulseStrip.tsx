import Link from "next/link";
import { ArrowUpRight, CalendarDays, ClipboardCheck, Home, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Translations } from "@/features/i18n/en";
import type { DashboardData } from "../types";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

function withCount(template: string, count: number) {
  return template.replace("{{count}}", new Intl.NumberFormat().format(count));
}

export function DashboardPulseStrip({
  data,
  labels,
}: {
  data: DashboardData;
  labels: DashboardLabels;
}) {
  const metrics = [
    {
      label: labels.members,
      value: data.pulse.memberCount,
      hint: withCount(labels.membersThisMonth, data.pulse.membersAddedThisMonth),
      href: data.routes.members,
      icon: UsersRound,
      tone: "sage",
      trend: data.pulse.membersAddedThisMonth > 0,
    },
    {
      label: labels.households,
      value: data.pulse.householdCount,
      hint: withCount(labels.householdsWithoutHead, data.pulse.householdsWithoutHead),
      href: data.routes.households,
      icon: Home,
      tone: "green",
    },
    {
      label: labels.ministries,
      value: data.pulse.activeMinistryCount,
      hint: withCount(labels.ministriesActive, data.pulse.activeMinistryCount),
      href: data.routes.ministries,
      icon: Users,
      tone: "sage",
    },
    {
      label: labels.upcomingEvents,
      value: data.pulse.upcomingEventCount,
      hint: labels.nextSevenDays,
      href: data.routes.events,
      icon: CalendarDays,
      tone: "gold",
    },
    {
      label: labels.needsAttention,
      value: data.pulse.attentionCount,
      hint: labels.approvalsRequests,
      href: data.routes.attention,
      icon: ClipboardCheck,
      tone: "coral",
    },
  ];

  const toneClasses = {
    sage: "bg-[#E8F1E7] text-[#145C44]",
    green: "bg-[#EAF3E4] text-[#0F4D3A]",
    gold: "bg-[#FBF0D8] text-[#916914]",
    coral: "bg-[#FCE5D8] text-[#C74B1E]",
  };

  return (
    <section className="min-w-0 rounded-2xl border border-[#E5E0D6] bg-[#FFFDF8] px-4 py-4 shadow-[0_10px_30px_rgba(44,38,28,0.05)] sm:px-5">
      <h2 className="px-1 text-[12px] font-bold uppercase tracking-[0.18em] text-[#1E2635]">
        {labels.churchPulse}
      </h2>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-0">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <Link
              key={metric.label}
              href={metric.href}
              className={cn(
                "group flex min-w-0 flex-col items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-[#F8F5EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44] focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-4",
                index > 0 && "xl:border-l xl:border-[#DDD6CA]"
              )}
              aria-label={`${metric.label}: ${metric.value}`}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
                  toneClasses[metric.tone as keyof typeof toneClasses]
                )}
              >
                <Icon className="size-5 sm:size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-[#303A35]">{metric.label}</span>
                <span className="mt-1 block text-3xl font-semibold leading-none tracking-normal text-[#141B19]">
                  {metric.value}
                </span>
                <span
                  className={cn(
                    "mt-2 flex min-w-0 items-center gap-1 truncate text-xs font-medium text-[#66706A]",
                    metric.trend && "text-[#168450]"
                  )}
                >
                  {metric.trend ? <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                  <span className="truncate">{metric.hint}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
