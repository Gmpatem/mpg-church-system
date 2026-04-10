"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/features/i18n";
import { cn } from "@/lib/utils/cn";

type ChurchMobileModuleRailProps = {
  churchSlug: string;
  showAccessControl?: boolean;
  roleLabel?: string;
};

const OFFICE_ALLOWED_ROLES = new Set([
  "Clerk",
  "Church Secretary",
  "Church Admin",
  "Pastor",
  "Platform Owner",
  "Platform Admin",
  "Platform Support",
]);

function isPathActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
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

  const items = [
    { label: t.navigation.dashboard, href: base, exact: true },
    { label: t.navigation.members, href: `${base}/members` },
    { label: t.navigation.households, href: `${base}/households` },
    { label: t.navigation.departments, href: `${base}/departments` },
    { label: t.navigation.events, href: `${base}/events` },
    { label: t.navigation.calendar, href: `${base}/calendar` },
    { label: t.navigation.treasury, href: `${base}/treasury` },
    { label: t.navigation.reports, href: `${base}/reports` },
    { label: t.navigation.approvals, href: `${base}/approvals` },
    ...(showAccessControl
      ? [{ label: t.navigation.accessControl || "Invites & Access", href: `${base}/access-control` }]
      : []),
    { label: t.navigation.announcements || "Announcements", href: `${base}/announcements` },
    { label: t.navigation.leadership || "Leadership", href: `${base}/leadership` },
    ...(canOpenOffice ? [{ label: t.navigation.office || "Church Office", href: `${base}/office` }] : []),
    { label: t.navigation.settings, href: `${base}/settings` },
  ];

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-2 md:hidden">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((item) => {
          const active = isPathActive(pathname, item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mobile-touch-feedback shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
