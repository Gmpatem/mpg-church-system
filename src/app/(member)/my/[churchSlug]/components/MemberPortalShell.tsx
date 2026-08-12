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
  Bell,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  MemberPortalBottomNav,
  type MemberPortalNavItem,
} from "@/features/member-portal/components/MemberPortalBottomNav";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import {
  getInitials,
  MemberPortalChurchMark,
} from "@/features/member-portal/components/MemberPortalAppPrimitives";
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
      key: "ministries",
      label: "Ministries",
      icon: Users,
      href: buildTabHref(churchSlug, "ministries"),
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
      ministries: 1,
      departments: 1,
      events: 2,
      calendar: 2,
      giving: 3,
      profile: 4,
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
    <div className="church-workspace min-h-screen bg-[hsl(var(--church-bg))]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-amber-100 bg-white lg:flex lg:flex-col">
          <div className="border-b border-amber-100 p-6">
            <div className="flex items-center gap-3">
              <MemberPortalChurchMark className="size-11" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {t.navigation.memberPortal || "Member Portal"}
                </p>
                <h2 className="truncate text-lg font-semibold text-emerald-950">{churchName}</h2>
              </div>
            </div>
            <div className="mt-5 rounded-[22px] border border-amber-100 bg-amber-50/60 p-4">
              <p className="font-medium text-emerald-950">{memberName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {memberCode ? `${t.members.memberCode}: ${memberCode}` : (t.memberPortal?.accessActive || "Member access active")}
              </p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "mobile-touch-feedback flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-emerald-950 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-amber-50 hover:text-emerald-950"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-3 border-t border-amber-100 p-4">
            <LanguageSwitcher variant="minimal" />
            <form action={signOutMemberPortalAction}>
              <button
                type="submit"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-amber-50"
              >
                <LogOut className="size-4" />
                <span>{t.auth.logout}</span>
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 hidden bg-white/95 backdrop-blur lg:block">
            <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">{churchName}</p>
                <h1 className="text-xl font-semibold text-emerald-950">
                  {getActiveLabel(activeTab, navItems, t)}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="mobile-touch-feedback relative inline-flex size-10 items-center justify-center rounded-full bg-amber-50 text-emerald-950 transition hover:bg-amber-100"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                <Link
                  href={profileHref}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-amber-100 bg-white text-sm font-semibold text-emerald-950 transition hover:bg-amber-50"
                  aria-label={t.navigation.profile || "Profile"}
                >
                  {getInitials(memberName)}
                </Link>
              </div>
            </div>
          </div>

          <div
            key={activeTab}
            className={cn(
              "mobile-route-frame mx-auto w-full max-w-[430px] px-3 pb-28 pt-3 sm:max-w-[460px] lg:max-w-6xl lg:px-8 lg:pb-8 lg:pt-6",
              routeMotionClass
            )}
          >
            {activeTab === "overview" ? <PwaInstallPrompt variant="member-portal" className="mb-4" /> : null}

            {showWelcome ? (
              <div className="mobile-fade-up mb-4 rounded-[22px] border border-emerald-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
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
        <SheetContent side="bottom" className="rounded-t-[28px] border-amber-100 bg-white px-4 pb-6 pt-3 lg:hidden">
          <SheetHeader className="flex flex-col gap-2 text-left">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
            <SheetTitle className="text-base font-semibold text-emerald-950">{memberName}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {memberCode ? `${t.members.memberCode}: ${memberCode}` : (t.memberPortal?.accessActive || "Member access active")}
            </p>
          </SheetHeader>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={profileHref}
              onClick={() => setProfileSheetOpen(false)}
              className="mobile-touch-feedback flex min-h-[44px] items-center gap-2 rounded-2xl border border-amber-100 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <User2 className="size-4" />
              {t.navigation.profile || "Profile"}
            </Link>

            <Link
              href={buildTabHref(churchSlug, "giving")}
              onClick={() => setProfileSheetOpen(false)}
              className="mobile-touch-feedback flex min-h-[44px] items-center gap-2 rounded-2xl border border-amber-100 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <HandHeart className="size-4" />
              {t.memberPortal?.giving || "Giving"}
            </Link>

            <div className="rounded-2xl border border-amber-100 px-3 py-3">
              <p className="mb-2 text-xs text-muted-foreground">Language / Langue</p>
              <LanguageSwitcher variant="minimal" />
            </div>

            <form action={signOutMemberPortalAction}>
              <button
                type="submit"
                className="mobile-touch-feedback flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                <LogOut className="size-4" />
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
