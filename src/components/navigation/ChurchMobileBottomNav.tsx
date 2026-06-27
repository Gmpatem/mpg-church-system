"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  Home,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OFFICE_ALLOWED_ROLES } from "@/lib/constants/access";
import { useI18n } from "@/features/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type ChurchMobileBottomNavProps = {
  churchSlug: string;
  showAccessControl?: boolean;
  pendingApprovalCount?: number;
  roleLabel?: string;
};

type SecondaryLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

function isPathActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href || pathname === href.replace(/\/dashboard$/, "");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ChurchMobileBottomNav({
  churchSlug,
  showAccessControl = false,
  pendingApprovalCount = 0,
  roleLabel,
}: ChurchMobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useI18n();

  const base = `/c/${churchSlug}`;
  const canOpenOffice = roleLabel ? OFFICE_ALLOWED_ROLES.has(roleLabel) : false;

  const primaryItems = [
    { key: "dashboard", label: t.navigation.dashboard, href: `${base}/dashboard`, icon: LayoutDashboard, exact: true },
    { key: "members", label: t.navigation.members, href: `${base}/members`, icon: Users },
    { key: "events", label: t.navigation.events, href: `${base}/events`, icon: CalendarDays },
    { key: "treasury", label: t.navigation.treasury, href: `${base}/treasury`, icon: Wallet },
  ];

  const secondaryItems = useMemo<SecondaryLink[]>(() => {
    const items: SecondaryLink[] = [
      { label: t.navigation.reports, href: `${base}/reports`, icon: BarChart3 },
      { label: t.navigation.approvals, href: `${base}/approvals`, icon: ClipboardCheck, badge: pendingApprovalCount },
      { label: t.navigation.settings, href: `${base}/settings`, icon: Settings },
      { label: t.navigation.households, href: `${base}/households`, icon: Home },
      { label: t.navigation.departments, href: `${base}/departments`, icon: Users },
    ];

    if (canOpenOffice) {
      items.push({ label: t.navigation.office || "Church Office", href: `${base}/office`, icon: Briefcase });
    }

    if (showAccessControl) {
      items.push({
        label: t.navigation.accessControl || "Invites & Access",
        href: `${base}/access-control`,
        icon: Shield,
      });
    }

    return items;
  }, [base, canOpenOffice, pendingApprovalCount, showAccessControl, t.navigation]);

  const moreActive = secondaryItems.some((item) => isPathActive(pathname, item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-around">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(pathname, item.href, item.exact);

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="mobile-touch-feedback inline-flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center"
              >
                <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-slate-500")} />
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none",
                    active ? "text-blue-600" : "text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="mobile-touch-feedback inline-flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center"
            aria-expanded={moreOpen}
            aria-label="Open more navigation options"
          >
            <Menu className={cn("h-5 w-5", moreActive ? "text-blue-600" : "text-slate-500")} />
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                moreActive ? "text-blue-600" : "text-slate-500"
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-slate-200 bg-white px-4 pb-6 pt-3"
        >
          <SheetHeader className="space-y-2 text-left">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
            <SheetTitle className="text-base font-semibold text-slate-900">
              More
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "mobile-touch-feedback flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-medium",
                    active
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 ? (
                    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
