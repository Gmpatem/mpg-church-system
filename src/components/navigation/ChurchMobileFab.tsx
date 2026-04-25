"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ChurchMobileFabProps = {
  churchSlug: string;
};

function getFabTarget(pathname: string, churchSlug: string) {
  const base = `/c/${churchSlug}`;

  if (pathname === base || pathname.startsWith(`${base}/members`)) {
    return { href: `${base}/members/new`, label: "Add Member" };
  }

  if (pathname.startsWith(`${base}/households`)) {
    return { href: `${base}/households/new`, label: "Add Household" };
  }

  if (pathname.startsWith(`${base}/departments`)) {
    return { href: `${base}/departments/new`, label: "Add Department" };
  }

  if (pathname.startsWith(`${base}/events`) || pathname.startsWith(`${base}/calendar`)) {
    return { href: `${base}/events?tab=create_event`, label: "Create Event" };
  }

  if (pathname.startsWith(`${base}/treasury`)) {
    return { href: `${base}/treasury/in/new`, label: "Add Payment" };
  }

  return null;
}

export function ChurchMobileFab({ churchSlug }: ChurchMobileFabProps) {
  const pathname = usePathname();
  const target = getFabTarget(pathname, churchSlug);
  const [mounted, setMounted] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !getFabTarget(pathname, churchSlug)) return;
    setShowLabel(true);
    const timer = window.setTimeout(() => setShowLabel(false), 3000);
    return () => window.clearTimeout(timer);
  }, [churchSlug, mounted, pathname]);

  if (!target || !mounted) return null;

  return (
    <Link
      href={target.href}
      aria-label={target.label}
      className={cn(
        "mobile-touch-feedback fixed bottom-20 right-3 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-slate-900 px-4 text-white shadow-lg shadow-slate-900/25 transition-all md:hidden",
        showLabel ? "w-auto" : "w-14 justify-center"
      )}
    >
      <Plus className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap text-sm font-semibold transition-all",
          showLabel ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
        )}
      >
        {target.label}
      </span>
    </Link>
  );
}
