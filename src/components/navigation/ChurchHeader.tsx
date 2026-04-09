"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Menu, Settings, User, Globe } from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
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
  onOpenSidebar?: () => void;
  notifications?: ChurchNotificationItem[];
}

function getPageLabel(pathname: string, churchSlug: string) {
  const base = `/c/${churchSlug}`;

  if (pathname === base) return "Dashboard";
  if (pathname.startsWith(`${base}/members`)) return "Members";
  if (pathname.startsWith(`${base}/households`)) return "Households";
  if (pathname.startsWith(`${base}/departments`)) return "Departments";
  if (pathname.startsWith(`${base}/treasury`)) return "Treasury";
  if (pathname.startsWith(`${base}/events`)) return "Events";
  if (pathname.startsWith(`${base}/calendar`)) return "Calendar";
  if (pathname.startsWith(`${base}/announcements`)) return "Announcements";
  if (pathname.startsWith(`${base}/reports`)) return "Reports";
  if (pathname.startsWith(`${base}/settings`)) return "Settings";

  return "Church Workspace";
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

function formatDateStable(value?: string | null) {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

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
  onOpenSidebar,
  notifications = [],
}: ChurchHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [readOfficeIds, setReadOfficeIds] = useState<string[]>([]);

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

  const pageLabel = getPageLabel(pathname, church.slug);
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between px-4 md:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
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
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align="end">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={isPending}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-[400px] overflow-y-auto">
                {decoratedNotifications.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">No notifications yet.</div>
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
                        <p className="text-xs text-slate-400">{formatDateStable(item.created_at)}</p>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push(`/c/${church.slug}`)}>
                <User className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push(`/c/${church.slug}/settings`)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Language Switcher */}
              <div className="px-2 py-2">
                <p className="text-xs text-slate-500 mb-2">Language / Langue</p>
                <LanguageSwitcher variant="minimal" />
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
