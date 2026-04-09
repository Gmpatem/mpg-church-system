"use client";

import Link from "next/link";
import { 
  Users, 
  Calendar, 
  Wallet, 
  Building2,
  FileText,
  Settings,
  Home,
  Bell,
  BarChart3
} from "lucide-react";

interface DashboardQuickActionsProps {
  churchSlug: string;
}

const quickActions = [
  {
    label: "Add Member",
    href: (slug: string) => `/c/${slug}/members/new`,
    icon: Users,
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    description: "Register new member",
  },
  {
    label: "Create Event",
    href: (slug: string) => `/c/${slug}/events`,
    icon: Calendar,
    color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    description: "Schedule activity",
  },
  {
    label: "Record Offering",
    href: (slug: string) => `/c/${slug}/treasury/in/new`,
    icon: Wallet,
    color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    description: "Log treasury inflow",
  },
  {
    label: "Add Department",
    href: (slug: string) => `/c/${slug}/departments/new`,
    icon: Building2,
    color: "bg-violet-50 text-violet-600 hover:bg-violet-100",
    description: "New ministry group",
  },
  {
    label: "Reports",
    href: (slug: string) => `/c/${slug}/reports`,
    icon: BarChart3,
    color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
    description: "View analytics",
  },
  {
    label: "Settings",
    href: (slug: string) => `/c/${slug}/settings`,
    icon: Settings,
    color: "bg-slate-50 text-slate-600 hover:bg-slate-100",
    description: "Configure church",
  },
];

export function DashboardQuickActions({ churchSlug }: DashboardQuickActionsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
          <Settings className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Quick Actions</h2>
          <p className="text-xs text-slate-500">Fast access to common tasks</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href(churchSlug)}
              className={`group flex flex-col items-center gap-2 rounded-xl p-3 transition ${action.color}`}
            >
              <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <span className="block text-xs font-semibold">{action.label}</span>
                <span className="block text-[10px] opacity-70">{action.description}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
