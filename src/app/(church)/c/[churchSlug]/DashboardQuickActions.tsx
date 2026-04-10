"use client";

import Link from "next/link";
import { Calendar, CalendarDays, Settings, Users, Wallet, BarChart3 } from "lucide-react";

interface DashboardQuickActionsProps {
  churchSlug: string;
}

const quickActions = [
  {
    label: "Members",
    href: (slug: string) => `/c/${slug}/members`,
    icon: Users,
    color: "bg-blue-50 text-blue-700",
  },
  {
    label: "Treasury",
    href: (slug: string) => `/c/${slug}/treasury`,
    icon: Wallet,
    color: "bg-teal-50 text-teal-700",
  },
  {
    label: "Events",
    href: (slug: string) => `/c/${slug}/events`,
    icon: CalendarDays,
    color: "bg-cyan-50 text-cyan-700",
  },
  {
    label: "Calendar",
    href: (slug: string) => `/c/${slug}/calendar`,
    icon: Calendar,
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    label: "Reports",
    href: (slug: string) => `/c/${slug}/reports`,
    icon: BarChart3,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Settings",
    href: (slug: string) => `/c/${slug}/settings`,
    icon: Settings,
    color: "bg-slate-50 text-slate-700",
  },
];

export function DashboardQuickActions({ churchSlug }: DashboardQuickActionsProps) {
  return (
    <section className="mobile-fade-up">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-slate-950">
          Quick Links
        </h2>
      </div>

      <div className="mobile-stagger grid grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href(churchSlug)}
              className={`mobile-touch-feedback flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center transition hover:border-slate-300 ${action.color}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
