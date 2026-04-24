"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

type ChurchMobileFabProps = {
  churchSlug: string;
};

function getFabTarget(pathname: string, churchSlug: string) {
  const base = `/c/${churchSlug}`;

  if (pathname === base || pathname.startsWith(`${base}/members`)) {
    return { href: `${base}/members/new`, label: "Add member" };
  }

  if (pathname.startsWith(`${base}/households`)) {
    return { href: `${base}/households/new`, label: "Add household" };
  }

  if (pathname.startsWith(`${base}/departments`)) {
    return { href: `${base}/departments/new`, label: "Add department" };
  }

  if (pathname.startsWith(`${base}/events`) || pathname.startsWith(`${base}/calendar`)) {
    return { href: `${base}/events?tab=create_event`, label: "Create event" };
  }

  if (pathname.startsWith(`${base}/treasury`)) {
    return { href: `${base}/treasury/in/new`, label: "Add Payment" };
  }

  return null;
}

export function ChurchMobileFab({ churchSlug }: ChurchMobileFabProps) {
  const pathname = usePathname();
  const target = getFabTarget(pathname, churchSlug);

  if (!target) return null;

  return (
    <Link
      href={target.href}
      aria-label={target.label}
      className="mobile-touch-feedback fixed bottom-20 right-3 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/25 md:hidden"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">{target.label}</span>
    </Link>
  );
}
