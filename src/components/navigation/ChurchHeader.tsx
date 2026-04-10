"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { useI18n } from "@/features/i18n";
import { ChurchMobileModuleRail } from "@/components/navigation/ChurchMobileModuleRail";
import {
  markAllChurchNotificationsReadAction,
  markChurchNotificationReadAction,
} from "@/features/church-notifications/actions";

interface ChurchNotificationItem {
  id: string;
  title: string;
  message: string;
  href: string;
  event_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at?: string | null;
  kind?: "db" | "office_signal";
}

interface ChurchHeaderProps {
  church: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
  roleLabel?: string;
  showAccessControl?: boolean;
  onOpenSidebar?: () => void;
  notifications?: ChurchNotificationItem[];
}

function getPageLabel(pathname: string, churchSlug: string, t: any) {
  const base = `/c/${churchSlug}`;

  if (pathname === base) return t.navigation.dashboard;
  if (pathname.startsWith(`${base}/members`)) return t.navigation.members;
  if (pathname.startsWith(`${base}/households`)) return t.navigation.households;
  if (pathname.startsWith(`${base}/departments`)) return t.navigation.departments;
  if (pathname.startsWith(`${base}/treasury`)) return t.navigation.treasury;
  if (pathname.startsWith(`${base}/events`)) return t.navigation.events;
  if (pathname.startsWith(`${base}/calendar`)) return t.navigation.calendar;
  if (pathname.startsWith(`${base}/announcements`)) return t.navigation.announcements;
  if (pathname.startsWith(`${base}/reports`)) return t.navigation.reports;
  if (pathname.startsWith(`${base}/settings`)) return t.navigation.settings;
  if (pathname.startsWith(`${base}/leadership`)) return t.navigation.leadership;
  if (pathname.startsWith(`${base}/office`)) return t.navigation.office;
  if (pathname.startsWith(`${base}/approvals`)) return t.navigation.approvals;
  if (pathname.startsWith(`${base}/access-control`)) return t.navigation.accessControl;

  return t.navigation.workspace;
}

function getNotificationBadgeLabel(
  eventType?: string | null,
  entityType?: string | null,
  kind?: "db" | "office_signal"
) {
  if (kind === "office_signal" || entityType === "office_signal") {
    if (eventType === "access_request") return "Access";
    if (eventType === "leadership_request") return "Leadership";
    if (eventType === "announcement_review") return "Announcement";
    if (eventType === "event_approval") return "Event Review";
    if (eventType === "today_event") return "Today";
    return "Office";
  }

  return null;
}

function formatDateStable(value?: string | null, t?: any) {
  if (!value) return t?.common.unknownTime || "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t?.common.unknownTime || "Unknown time";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOfficeReadStorageKey(churchSlug: string) {
  return `church-office-read:${churchSlug}`;
}

export function ChurchHeader({
  church,
  user,
  roleLabel,
  showAccessControl = false,
  onOpenSidebar,
  notifications = [],
}: ChurchHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [readOfficeIds, setReadOfficeIds] = useState<string[]>([]);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getOfficeReadStorageKey(church.slug));
      if (!raw) {
        setReadOfficeIds([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setReadOfficeIds(parsed.filter((value) => typeof value === "string"));
      } else {
        setReadOfficeIds([]);
      }
    } catch {
      setReadOfficeIds([]);
    }
  }, [church.slug]);

  function persistOfficeReadIds(nextIds: string[]) {
    setReadOfficeIds(nextIds);

    try {
      window.localStorage.setItem(
        getOfficeReadStorageKey(church.slug),
        JSON.stringify(nextIds)
      );
    } catch {
      // ignore storage errors
    }
  }

  function markOfficeSignalRead(notificationId: string) {
    if (readOfficeIds.includes(notificationId)) return;
    persistOfficeReadIds(Array.from(new Set([...readOfficeIds, notificationId])));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function markOneRead(item: ChurchNotificationItem) {
    if (item.kind === "office_signal" || item.entity_type === "office_signal") {
      markOfficeSignalRead(item.id);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("churchSlug", church.slug);
      formData.set("notificationId", item.id);
      await markChurchNotificationReadAction(formData);
      router.refresh();
    });
  }

  function markAllRead() {
    const officeIds = notifications
      .filter((item) => item.kind === "office_signal" || item.entity_type === "office_signal")
      .map((item) => item.id);

    if (officeIds.length > 0) {
      persistOfficeReadIds(Array.from(new Set([...readOfficeIds, ...officeIds])));
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("churchSlug", church.slug);
      await markAllChurchNotificationsReadAction(formData);
      router.refresh();
    });
  }

  const decoratedNotifications = useMemo(() => {
    return notifications.map((item) => {
      if (item.kind === "office_signal" || item.entity_type === "office_signal") {
        return {
          ...item,
          is_read: item.is_read || readOfficeIds.includes(item.id),
        };
      }

      return item;
    });
  }, [notifications, readOfficeIds]);

  const pageLabel = getPageLabel(pathname, church.slug, t);
  const unreadCount = decoratedNotifications.filter((item) => !item.is_read).length;

  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between px-4 md:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {onOpenSidebar ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onOpenSidebar}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t.common.openNavigation}</span>
              </Button>
            ) : null}

            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
                {pageLabel}
              </p>
              <p className="truncate text-sm font-semibold text-slate-950">
                {church.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {roleLabel ? (
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 md:inline-flex">
                {roleLabel}
              </div>
            ) : null}

            <LanguageSwitcher variant="minimal" className="hidden sm:flex" />

            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 ? (
                      <>
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
                        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                          {unreadCount}
                        </span>
                      </>
                    ) : null}
                    <span className="sr-only">{t.common.notifications}</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-80" align="end">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">{t.common.notifications}</DropdownMenuLabel>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllRead}
                        disabled={isPending}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {t.common.markAllRead}
                      </button>
                    ) : null}
                  </div>

                  <DropdownMenuSeparator />

                  <div className="max-h-[400px] overflow-y-auto">
                    {decoratedNotifications.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500">{t.common.noNotifications}</div>
                    ) : (
                      decoratedNotifications.map((item) => (
                        <DropdownMenuItem key={item.id} asChild>
                          <Link
                            aria-disabled={isPending}
                            href={item.href}
                            onClick={() => {
                              if (!item.is_read) {
                                markOneRead(item);
                              }
                            }}
                            className="flex cursor-pointer flex-col items-start gap-1 p-3 disabled:pointer-events-none disabled:opacity-60"
                          >
                            <div className="flex w-full items-start justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900">{item.title}</p>
                              {!item.is_read ? (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-600">{item.message}</p>
                            {getNotificationBadgeLabel(item.event_type, item.entity_type, item.kind) ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                {getNotificationBadgeLabel(item.event_type, item.entity_type, item.kind)}
                              </span>
                            ) : null}
                            <p className="text-xs text-slate-400">{formatDateStable(item.created_at, t)}</p>
                          </Link>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"
                onClick={() => setMobileNotificationsOpen(true)}
                aria-label={t.common.notifications}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100"
                onClick={() => setMobileProfileOpen(true)}
                aria-label={t.navigation.profile || "Open profile menu"}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </div>

            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.full_name || t.common.user}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || t.common.noEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push(`/c/${church.slug}`)}>
                    <User className="mr-2 h-4 w-4" />
                    {t.navigation.dashboard}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => router.push(`/c/${church.slug}/settings`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t.navigation.settings}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <div className="px-2 py-2">
                    <p className="mb-2 text-xs text-slate-500">Language / Langue</p>
                    <LanguageSwitcher variant="minimal" />
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.auth.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <ChurchMobileModuleRail
          churchSlug={church.slug}
          roleLabel={roleLabel}
          showAccessControl={showAccessControl}
        />
      </header>

      <Sheet open={mobileNotificationsOpen} onOpenChange={setMobileNotificationsOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-slate-200 bg-white px-4 pb-6 pt-3 sm:hidden">
          <SheetHeader className="space-y-2 text-left">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
            <SheetTitle className="text-base font-semibold text-slate-900">
              {t.common.notifications}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                disabled={isPending}
                className="mobile-touch-feedback w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                {t.common.markAllRead}
              </button>
            ) : null}

            {decoratedNotifications.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                {t.common.noNotifications}
              </p>
            ) : (
              <div className="space-y-2">
                {decoratedNotifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      if (!item.is_read) {
                        markOneRead(item);
                      }
                      setMobileNotificationsOpen(false);
                    }}
                    className="mobile-touch-feedback block rounded-2xl border border-slate-200 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      {!item.is_read ? (
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDateStable(item.created_at, t)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobileProfileOpen} onOpenChange={setMobileProfileOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-slate-200 bg-white px-4 pb-6 pt-3 sm:hidden">
          <SheetHeader className="space-y-2 text-left">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
            <SheetTitle className="text-base font-semibold text-slate-900">
              {user?.full_name || t.common.user}
            </SheetTitle>
            <p className="text-xs text-slate-500">{user?.email || t.common.noEmail}</p>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileProfileOpen(false);
                router.push(`/c/${church.slug}`);
              }}
              className="mobile-touch-feedback flex w-full items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <User className="h-4 w-4" />
              {t.navigation.dashboard}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileProfileOpen(false);
                router.push(`/c/${church.slug}/settings`);
              }}
              className="mobile-touch-feedback flex w-full items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700"
            >
              <Settings className="h-4 w-4" />
              {t.navigation.settings}
            </button>

            <div className="rounded-2xl border border-slate-200 px-3 py-3">
              <p className="mb-2 text-xs text-slate-500">Language / Langue</p>
              <LanguageSwitcher variant="minimal" />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mobile-touch-feedback flex w-full items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              {t.auth.logout}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
