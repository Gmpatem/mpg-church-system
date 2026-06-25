"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Bell, CheckCheck, LogOut, Menu, Settings, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { OfflineStatusBar } from "@/components/offline/OfflineStatusBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/features/i18n";
import {
  markAllChurchNotificationsReadAction,
  markChurchNotificationReadAction,
} from "@/features/church-notifications/actions";
import { ChurchAvatar } from "../primitives/ChurchAvatar";
import { ChurchBadge } from "../primitives/ChurchBadge";
import { ChurchIconButton } from "../primitives/ChurchButton";
import { getChurchSectionLabel } from "./navigation";
import type {
  ChurchWorkspaceChurch,
  ChurchWorkspaceNotification,
  ChurchWorkspaceUser,
} from "../types";

interface ChurchTopbarProps {
  church: ChurchWorkspaceChurch;
  user: ChurchWorkspaceUser | null;
  roleLabel?: string;
  notifications?: ChurchWorkspaceNotification[];
  onOpenNavigation: () => void;
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

export function ChurchTopbar({
  church,
  user,
  roleLabel,
  notifications = [],
  onOpenNavigation,
}: ChurchTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [readOfficeIds, setReadOfficeIds] = useState<string[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getOfficeReadStorageKey(church.slug));
      if (!raw) {
        setReadOfficeIds([]);
        return;
      }

      const parsed = JSON.parse(raw);
      setReadOfficeIds(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
    } catch {
      setReadOfficeIds([]);
    }
  }, [church.slug]);

  function persistOfficeReadIds(nextIds: string[]) {
    setReadOfficeIds(nextIds);

    try {
      window.localStorage.setItem(getOfficeReadStorageKey(church.slug), JSON.stringify(nextIds));
    } catch {
      // Ignore storage failures; database notifications still use server actions.
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

  function markOneRead(item: ChurchWorkspaceNotification) {
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

  const sectionLabel = getChurchSectionLabel(pathname, church.slug, t);
  const unreadCount = decoratedNotifications.filter((item) => !item.is_read).length;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-[clamp(1rem,2vw,2rem)]">
        <div className="flex min-w-0 items-center gap-3">
          <ChurchIconButton
            type="button"
            variant="ghost"
            className="lg:hidden"
            onClick={onOpenNavigation}
            aria-label={t.common.openNavigation || "Open navigation"}
          >
            <Menu className="size-5" aria-hidden="true" />
          </ChurchIconButton>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {sectionLabel}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {church.name}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden md:flex">
            <OfflineStatusBar />
          </div>

          {roleLabel ? (
            <ChurchBadge className="hidden border-border bg-muted text-muted-foreground lg:inline-flex">
              {roleLabel}
            </ChurchBadge>
          ) : null}

          <LanguageSwitcher variant="minimal" className="hidden sm:flex" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ChurchIconButton type="button" variant="ghost" className="relative" aria-label={t.common.notifications}>
                <Bell className="size-4" aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount}
                  </span>
                ) : null}
              </ChurchIconButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[min(22rem,calc(100vw-2rem))] rounded-xl" align="end">
              <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                <DropdownMenuLabel className="p-0">{t.common.notifications}</DropdownMenuLabel>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    <CheckCheck className="size-3.5" aria-hidden="true" />
                    {t.common.markAllRead}
                  </button>
                ) : null}
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-[420px] overflow-y-auto">
                {decoratedNotifications.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">{t.common.noNotifications}</div>
                ) : (
                  decoratedNotifications.map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link
                        aria-disabled={isPending}
                        href={item.href}
                        onClick={() => {
                          if (!item.is_read) markOneRead(item);
                        }}
                        className="flex cursor-pointer flex-col items-start gap-1 rounded-lg p-3"
                      >
                        <span className="flex w-full items-start justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">{item.title}</span>
                          {!item.is_read ? (
                            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                          ) : null}
                        </span>
                        <span className="text-xs leading-5 text-muted-foreground">{item.message}</span>
                        {getNotificationBadgeLabel(item.event_type, item.entity_type, item.kind) ? (
                          <ChurchBadge className="bg-muted text-muted-foreground">
                            {getNotificationBadgeLabel(item.event_type, item.entity_type, item.kind)}
                          </ChurchBadge>
                        ) : null}
                        <span className="text-xs text-muted-foreground/70">{formatDateStable(item.created_at, t)}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-lg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t.navigation.profile || "Open profile menu"}
              >
                <ChurchAvatar name={user?.full_name} email={user?.email} imageUrl={user?.avatar_url} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64 rounded-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="truncate text-sm font-medium leading-none">
                    {user?.full_name || t.common.user}
                  </p>
                  <p className="truncate text-xs leading-none text-muted-foreground">
                    {user?.email || t.common.noEmail}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push(`/c/${church.slug}`)}>
                <User className="mr-2 size-4" aria-hidden="true" />
                {t.navigation.dashboard}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push(`/c/${church.slug}/settings`)}>
                <Settings className="mr-2 size-4" aria-hidden="true" />
                {t.navigation.settings}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <div className="px-2 py-2">
                <p className="mb-2 text-xs text-muted-foreground">Language / Langue</p>
                <LanguageSwitcher variant="minimal" />
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" aria-hidden="true" />
                {t.auth.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-border px-4 py-1.5 md:hidden">
        <OfflineStatusBar />
      </div>
    </header>
  );
}
