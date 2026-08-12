"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { MemberPortalTabKey } from "@/features/member-portal/types";
import { cn } from "@/lib/utils/cn";

export type MemberPortalNavItem = {
  key: MemberPortalTabKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

type MemberPortalBottomNavProps = {
  activeTab: MemberPortalTabKey;
  items: MemberPortalNavItem[];
};

export function MemberPortalBottomNav({
  activeTab,
  items,
}: MemberPortalBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-100 bg-white/95 px-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex w-full max-w-[430px] items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "mobile-touch-feedback inline-flex min-h-[54px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center",
                active ? "bg-emerald-50" : "hover:bg-amber-50"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-5",
                  active ? "text-emerald-900" : "text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium leading-none",
                  active ? "text-emerald-900" : "text-slate-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
