"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  Home,
  House,
  Landmark,
  LogOut,
  MoreHorizontal,
  ShieldCheck,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  markAllPlatformNotificationsReadAction,
  markPlatformNotificationReadAction,
} from "@/features/platform/actions";
import PlatformHeader from "./PlatformHeader";
import { PlatformSidebar } from "./PlatformSidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type PlatformNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at?: string | null;
  href: string;
  is_unread: boolean;
};

type PlatformShellClientProps = {
  children: React.ReactNode;
  fullName: string | null;
  email: string | null;
  notifications: PlatformNotification[];
};

type PrimaryNavItem = {
  key: "dashboard" | "churches" | "oversight" | "reports" | "more";
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRIMARY_NAV: PrimaryNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/platform", icon: Home },
  { key: "churches", label: "Churches", href: "/platform/churches", icon: Building2 },
  { key: "oversight", label: "Oversight", href: "/platform/oversight", icon: AlertTriangle },
  { key: "reports", label: "Reports", href: "/platform/reports", icon: BarChart3 },
  { key: "more", label: "More", icon: MoreHorizontal },
];

const MORE_LINKS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/platform/regions", label: "Regions", icon: Landmark },
  { href: "/platform/access-control", label: "Governance", icon: ShieldCheck },
  { href: "/platform/billing", label: "Billing", icon: CreditCard },
  { href: "/platform/support", label: "Support", icon: CircleHelp },
  { href: "/platform/settings", label: "Settings", icon: Settings },
  { href: "/platform/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/platform/members", label: "Member Signals", icon: Users },
  { href: "/platform/events", label: "Event Signals", icon: CalendarDays },
  { href: "/platform/treasury", label: "Treasury Signals", icon: Wallet },
  { href: "/platform/households", label: "Household Signals", icon: House },
  { href: "/platform/calendar", label: "Calendar Signals", icon: CalendarDays },
];

function getHeaderTitle(pathname: string) {
  if (pathname === "/platform") return "Dashboard";
  if (pathname.startsWith("/platform/churches")) return "Churches";
  if (pathname.startsWith("/platform/oversight")) return "Oversight";
  if (pathname.startsWith("/platform/reports")) return "Analytics";
  if (pathname.startsWith("/platform/regions")) return "Regions";
  if (pathname.startsWith("/platform/billing")) return "Billing";
  if (pathname.startsWith("/platform/members")) return "Member Signals";
  if (pathname.startsWith("/platform/events")) return "Event Signals";
  if (pathname.startsWith("/platform/treasury")) return "Treasury Signals";
  if (pathname.startsWith("/platform/approvals")) return "Approvals";
  if (pathname.startsWith("/platform/households")) return "Household Signals";
  if (pathname.startsWith("/platform/access-control")) return "Governance";
  if (pathname.startsWith("/platform/support")) return "Support";
  if (pathname.startsWith("/platform/calendar")) return "Calendar Signals";
  if (pathname.startsWith("/platform/settings")) return "Settings";
  return "Platform";
}

function routeMatches(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/platform") return pathname === "/platform";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(fullName: string | null, email: string | null) {
  const value = fullName?.trim();
  if (value) {
    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();
  }

  return (email?.trim()[0] || "A").toUpperCase();
}

function formatNotificationDate(value?: string | null) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PlatformShellClient({
  children,
  fullName,
  email,
  notifications,
}: PlatformShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const headerTitle = getHeaderTitle(pathname);
  const initials = getInitials(fullName, email);
  const unreadCount = notifications.filter((item) => item.is_unread).length;

  const activePrimaryKey = useMemo(() => {
    if (pathname === "/platform") return "dashboard";
    if (pathname.startsWith("/platform/churches")) return "churches";
    if (pathname.startsWith("/platform/oversight")) return "oversight";
    if (pathname.startsWith("/platform/reports")) return "reports";
    return "more";
  }, [pathname]);

  function markNotificationRead(notificationId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notification_id", notificationId);
      await markPlatformNotificationReadAction(formData);
      router.refresh();
    });
  }

  function markAllNotificationsRead() {
    startTransition(async () => {
      await markAllPlatformNotificationsReadAction();
      router.refresh();
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <PlatformSidebar />
        <div className="ml-20 md:ml-64">
          <PlatformHeader
            fullName={fullName}
            email={email}
            notifications={notifications}
          />
          <main className="p-6">{children}</main>
        </div>
      </div>

      <div className="lg:hidden">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-blue-700 to-teal-500" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Network Console
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {headerTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-slate-100 text-xs font-semibold text-slate-700"
                aria-label="Open profile menu"
              >
                {initials}
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-24 pt-4">{children}</main>

        {pathname === "/platform/support" ? (
          <a
            href="#create-support-ticket"
            className="fixed bottom-24 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-slate-900 text-white shadow-lg"
            aria-label="Create support ticket"
          >
            <CircleHelp className="h-5 w-5" />
          </a>
        ) : null}

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <div className="mx-auto flex w-full max-w-md items-center justify-around">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = activePrimaryKey === item.key;

              if (item.key === "more") {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className="inline-flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5"
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className={active ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-slate-500"} />
                    <span
                      className={
                        active
                          ? "text-[11px] font-medium text-blue-600"
                          : "text-[11px] font-medium text-slate-500"
                      }
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href!}
                  className="inline-flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5"
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={active ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-slate-500"} />
                  <span
                    className={
                      active
                        ? "text-[11px] font-medium text-blue-600"
                        : "text-[11px] font-medium text-slate-500"
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-slate-900">Notifications</SheetTitle>
            <SheetDescription>
              Platform alerts and activity updates.
            </SheetDescription>
          </SheetHeader>

          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              disabled={isPending}
              className="mb-3 text-xs font-medium text-blue-600 disabled:opacity-60"
            >
              Mark all read
            </button>
          ) : null}

          <div className="max-h-[55vh] space-y-2 overflow-y-auto pb-2">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (item.is_unread) markNotificationRead(item.id);
                    setNotificationsOpen(false);
                  }}
                  className="block rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    {item.is_unread ? (
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatNotificationDate(item.created_at)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-slate-900">Account</SheetTitle>
            <SheetDescription>Manage your platform profile.</SheetDescription>
          </SheetHeader>

          <div className="space-y-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{fullName ?? "Admin User"}</p>
              <p className="text-xs text-slate-500">{email ?? "Authenticated account"}</p>
            </div>

            <Link
              href="/platform/settings"
              onClick={() => setProfileOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800"
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                Settings
              </span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-slate-900">More Modules</SheetTitle>
            <SheetDescription>Open additional oversight surfaces.</SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2">
            {MORE_LINKS.map((item) => {
              const Icon = item.icon;
              const active = routeMatches(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={
                    active
                      ? "rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700"
                      : "rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700"
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
