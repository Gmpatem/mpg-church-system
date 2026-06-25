"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/features/i18n";
import { cn } from "@/lib/utils/cn";
import { OFFICE_ALLOWED_ROLES } from "@/lib/constants/access";

type ChurchMobileModuleRailProps = {
  churchSlug: string;
  showAccessControl?: boolean;
  roleLabel?: string;
};

type ModuleSubItem = {
  label: string;
  href: string;
  exact?: boolean;
};

function isPathActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getModuleSubItems({
  pathname,
  base,
  t,
  showAccessControl,
  canOpenOffice,
}: {
  pathname: string;
  base: string;
  t: any;
  showAccessControl: boolean;
  canOpenOffice: boolean;
}): ModuleSubItem[] {
  if (pathname === base) {
    return [];
  }

  if (pathname.startsWith(`${base}/treasury`)) {
    return [
      { label: "Overview", href: `${base}/treasury`, exact: true },
      { label: "Money In", href: `${base}/treasury/in` },
      { label: "Money Out", href: `${base}/treasury/out` },
      { label: t.navigation.approvals, href: `${base}/treasury/approvals` },
      { label: t.navigation.reports, href: `${base}/treasury/audit` },
    ];
  }

  if (pathname.startsWith(`${base}/members`)) {
    return [
      { label: "All Members", href: `${base}/members`, exact: true },
      { label: "Add Member", href: `${base}/members/new` },
      { label: t.navigation.households, href: `${base}/households` },
    ];
  }

  if (pathname.startsWith(`${base}/households`)) {
    return [
      { label: t.navigation.households, href: `${base}/households`, exact: true },
      { label: "Add Household", href: `${base}/households/new` },
      { label: t.navigation.members, href: `${base}/members` },
    ];
  }

  if (pathname.startsWith(`${base}/departments`)) {
    return [
      { label: "All Departments", href: `${base}/departments`, exact: true },
      { label: "Add Department", href: `${base}/departments/new` },
      { label: t.navigation.members, href: `${base}/members` },
    ];
  }

  if (pathname.startsWith(`${base}/events`) || pathname.startsWith(`${base}/calendar`)) {
    return [
      { label: "All Events", href: `${base}/events`, exact: true },
      { label: "Add Event", href: `${base}/events?tab=create_event` },
      ...(showAccessControl ? [{ label: t.navigation.approvals, href: `${base}/approvals` }] : []),
    ];
  }

  if (pathname.startsWith(`${base}/approvals`)) {
    return [
      { label: t.navigation.approvals, href: `${base}/approvals`, exact: true },
      { label: t.navigation.events, href: `${base}/events` },
      { label: t.navigation.treasury, href: `${base}/treasury` },
    ];
  }

  if (pathname.startsWith(`${base}/access-control`) && showAccessControl) {
    return [
      { label: "Permissions", href: `${base}/access-control?tab=permissions` },
      { label: "Invites", href: `${base}/access-control?tab=invites` },
      { label: "Requests", href: `${base}/access-control?tab=pending_access` },
    ];
  }

  if (pathname.startsWith(`${base}/reports`)) {
    return [
      { label: t.navigation.reports, href: `${base}/reports`, exact: true },
      { label: t.navigation.treasury, href: `${base}/treasury` },
    ];
  }

  if (pathname.startsWith(`${base}/office`) && canOpenOffice) {
    return [
      { label: t.navigation.office || "Office", href: `${base}/office`, exact: true },
      { label: t.navigation.approvals, href: `${base}/approvals` },
    ];
  }

  if (pathname.startsWith(`${base}/settings`)) {
    return [
      { label: t.navigation.settings, href: `${base}/settings`, exact: true },
      { label: t.navigation.dashboard, href: `${base}` },
    ];
  }

  return [];
}

export function ChurchMobileModuleRail({
  churchSlug,
  showAccessControl = false,
  roleLabel,
}: ChurchMobileModuleRailProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const base = `/c/${churchSlug}`;
  const canOpenOffice = roleLabel ? OFFICE_ALLOWED_ROLES.has(roleLabel) : false;
  const items = getModuleSubItems({
    pathname,
    base,
    t,
    showAccessControl,
    canOpenOffice,
  });

  if (items.length === 0) return null;

  return (
    <div className="border-t border-slate-100 bg-white px-3 py-2 md:hidden">
      <div className="flex gap-1.5 overflow-x-auto">
        {items.map((item) => {
          const active = isPathActive(pathname, item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mobile-touch-feedback inline-flex min-h-[40px] shrink-0 items-center rounded-full border px-3 py-2 text-xs font-medium transition",
                active
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-transparent bg-transparent text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
