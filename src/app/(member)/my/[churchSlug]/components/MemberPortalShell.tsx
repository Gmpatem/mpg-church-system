"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LogOut,
  User2,
  Users,
  Home,
  CalendarDays,
  HandHeart,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  MemberPortalBottomNav,
  type MemberPortalNavItem,
} from "@/features/member-portal/components/MemberPortalBottomNav";
import { MemberPortalMobileHeader } from "@/features/member-portal/components/MemberPortalMobileHeader";
import { useI18n } from "@/features/i18n";
import { signOutMemberPortalAction } from "@/features/member-portal/actions";
import { cn } from "@/lib/utils/cn";
import type {
  MemberPortalFoundationData,
  MemberPortalTabKey,
} from "@/features/member-portal/types";

type MemberPortalShellProps = {
  foundation: MemberPortalFoundationData;
  activeTab: MemberPortalTabKey;
  showWelcome?: boolean;
  children: ReactNode;
};

function getNavItems(t: any, churchSlug: string): MemberPortalNavItem[] {
  return [
    {
      key: "overview",
      label: t.memberPortal?.home || "Home",
      icon: Home,
      href: buildTabHref(churchSlug, "overview"),
    },
    {
      key: "departments",
      label: t.memberPortal?.directory || t.pages?.membersWorkspace?.tabs?.directory || "Directory",
      icon: Users,
      href: buildTabHref(churchSlug, "departments"),
    },
    {
      key: "events",
      label: t.memberPortal?.events || t.navigation.events || "Events",
      icon: CalendarDays,
      href: buildTabHref(churchSlug, "events"),
    },
    {
      key: "giving",
      label: t.memberPortal?.giving || "Giving",
      icon: HandHeart,
      href: buildTabHref(churchSlug, "giving"),
    },
    {
      key: "profile",
      label: t.navigation.profile || "Profile",
      icon: User2,
      href: buildTabHref(churchSlug, "profile"),
    },
  ];
}

function buildTabHref(churchSlug: string, tab: MemberPortalTabKey) {
  return `/my/${churchSlug}?tab=${tab}`;
}

function getMemberName(foundation: MemberPortalFoundationData) {
  const member = foundation.identity?.member;
  const profile = foundation.profile;

  if (member?.display_name?.trim()) return member.display_name.trim();

  const joined = [member?.first_name, member?.last_name].filter(Boolean).join(" ").trim();
  if (joined) return joined;

  if (profile?.full_name?.trim()) return profile.full_name.trim();

  return "Member";
}

function getActiveLabel(activeTab: MemberPortalTabKey, items: MemberPortalNavItem[], t: any) {
  return items.find((item) => item.key === activeTab)?.label ?? (t.navigation.memberPortal || "Member Portal");
}

export function MemberPortalShell({
  foundation,
  activeTab,
  showWelcome = false,
  children,
}: MemberPortalShellProps) {
  const { t } = useI18n();
  const churchName = foundation.churchName ?? (t.common.church || "Church");
  const churchSlug = foundation.churchSlug;
  const memberName = getMemberName(foundation);
  const memberCode = foundation.identity?.member.member_code ?? null;
  const navItems = getNavItems(t, churchSlug);
  const profileHref = buildTabHref(churchSlug, "profile");
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const previousTabRef = useRef(activeTab);
  const [routeMotionClass, setRouteMotionClass] = useState<"mobile-route-forward" | "mobile-route-back">(
    "mobile-route-forward"
  );

  useEffect(() => {
    const order: Record<MemberPortalTabKey, number> = {
      overview: 0,
      departments: 1,
      events: 2,
      giving: 3,
      profile: 4,
      calendar: 2,
    };

    const previousTab = previousTabRef.current;
    if (previousTab === activeTab) return;

    if ((order[activeTab] ?? 0) >= (order[previousTab] ?? 0)) {
      setRouteMotionClass("mobile-route-forward");
    } else {
      setRouteMotionClass("mobile-route-back");
    }

    previousTabRef.current = activeTab;
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b p-6">
            <p className="text-sm font-medium text-slate-500">{t.navigation.memberPortal || "Member Portal"}</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{churchName}</h2>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-foreground">{memberName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {memberCode ? `${t.members.memberCode}: ${memberCode}` : (t.memberPortal?.accessActive || "Member access active")}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    isActive
                      ? "mobile-touch-feedback flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-sm font-medium text-background transition"
                      : "mobile-touch-feedback flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-slate-200 p-4">
            <LanguageSwitcher variant="minimal" />
            <form action={signOutMemberPortalAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                <span>{t.auth.logout}</span>
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur">
            <div className="lg:hidden">
              <MemberPortalMobileHeader
                churchName={churchName}
                memberName={memberName}
                onOpenProfileMenu={() => setProfileSheetOpen(true)}
                actions={<LanguageSwitcher variant="minimal" />}
              />
            </div>

            <div className="hidden items-center justify-between border-b border-slate-200 px-6 py-4 lg:flex lg:px-8">
              <div>
                <p className="text-sm text-slate-500">{churchName}</p>
                <h1 className="text-xl font-semibold text-slate-900">
                  {getActiveLabel(activeTab, navItems, t)}
                </h1>
              </div>

              <Link
                href={profileHref}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                aria-label={t.navigation.profile || "Profile"}
              >
                {memberName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0] || "")
                  .join("")
                  .toUpperCase() || "M"}
              </Link>
            </div>
          </div>

          <div
            key={activeTab}
            className={cn("space-y-4 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6 mobile-route-frame", routeMotionClass)}
          >
            {showWelcome ? (
              <div className="mobile-fade-up rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-foreground">{t.memberPortal?.welcome || "Welcome to"} {churchName}.</p>
                <p className="mt-1">
                  {t.memberPortal?.accountReady || "Your account is ready. Any requested leadership or staff access is still pending church approval."}
                </p>
              </div>
            ) : null}

            {children}
          </div>
        </main>
      </div>

      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-slate-200 bg-white px-4 pb-6 pt-3 lg:hidden">
          <SheetHeader className="space-y-2 text-left">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
            <SheetTitle className="text-base font-semibold text-slate-900">{memberName}</SheetTitle>
            <p className="text-xs text-slate-500">
              {memberCode ? `${t.members.memberCode}: ${memberCode}` : (t.memberPortal?.accessActive || "Member access active")}
            </p>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            <Link
              href={profileHref}
              onClick={() => setProfileSheetOpen(false)}
              className="mobile-touch-feedback flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <User2 className="h-4 w-4" />
              {t.navigation.profile || "Profile"}
            </Link>

            <Link
              href={buildTabHref(churchSlug, "giving")}
              onClick={() => setProfileSheetOpen(false)}
              className="mobile-touch-feedback flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <HandHeart className="h-4 w-4" />
              {t.memberPortal?.giving || "Giving"}
            </Link>

            <div className="rounded-2xl border border-slate-200 px-3 py-3">
              <p className="mb-2 text-xs text-slate-500">Language / Langue</p>
              <LanguageSwitcher variant="minimal" />
            </div>

            <form action={signOutMemberPortalAction}>
              <button
                type="submit"
                className="mobile-touch-feedback flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                <span>{t.auth.logout}</span>
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <MemberPortalBottomNav activeTab={activeTab} items={navItems} />
    </div>
  );
}
