"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardCheck,
  Megaphone,
} from "lucide-react";
import {
  acknowledgeMemberPortalNotificationAction,
  markAllMemberPortalNotificationsReadAction,
  markMemberPortalNotificationReadAction,
} from "@/features/church-notifications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import type { MemberPortalNotificationItem } from "@/features/member-portal/types";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

type MemberPortalNotificationsContextValue = {
  openNotifications: () => void;
  unreadCount: number;
};

const MemberPortalNotificationsContext =
  createContext<MemberPortalNotificationsContextValue | null>(null);

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function notificationIcon(eventType: string) {
  if (eventType === "announcement" || eventType === "department_announcement") {
    return Megaphone;
  }
  if (eventType === "event") return CalendarDays;
  if (eventType === "approval") return ClipboardCheck;
  return Bell;
}

export function useMemberPortalNotifications() {
  return useContext(MemberPortalNotificationsContext);
}

export function MemberPortalNotificationsProvider({
  churchId,
  churchSlug,
  userId,
  initialNotifications,
  children,
}: {
  churchId: string;
  churchSlug: string;
  userId: string | null;
  initialNotifications: MemberPortalNotificationItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const contextValue = useMemo(
    () => ({ openNotifications: () => setOpen(true), unreadCount }),
    [unreadCount]
  );

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`member-notifications:${churchSlug}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "church_notifications",
          filter: `target_user_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Record<
            string,
            unknown
          >;
          const notificationId = typeof row.id === "string" ? row.id : null;
          if (!notificationId) return;

          if (payload.eventType === "DELETE") {
            setNotifications((current) =>
              current.filter((notification) => notification.id !== notificationId)
            );
            return;
          }

          if (row.church_id !== churchId) return;

          const expiresAt = typeof row.expires_at === "string" ? row.expires_at : null;
          if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
            setNotifications((current) =>
              current.filter((notification) => notification.id !== notificationId)
            );
            return;
          }

          const nextNotification: MemberPortalNotificationItem = {
            id: notificationId,
            title: typeof row.title === "string" ? row.title : "Church update",
            message: typeof row.message === "string" ? row.message : "",
            eventType: typeof row.event_type === "string" ? row.event_type : "system",
            entityType: typeof row.entity_type === "string" ? row.entity_type : null,
            entityId: typeof row.entity_id === "string" ? row.entity_id : null,
            isRead: row.is_read === true,
            readAt: typeof row.read_at === "string" ? row.read_at : null,
            requiresAcknowledgement: row.requires_acknowledgement === true,
            acknowledgedAt:
              typeof row.acknowledged_at === "string" ? row.acknowledged_at : null,
            expiresAt,
            createdAt:
              typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
          };

          setNotifications((current) => {
            const withoutCurrent = current.filter(
              (notification) => notification.id !== notificationId
            );
            return [nextNotification, ...withoutCurrent].slice(0, 50);
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [churchId, churchSlug, userId]);

  function markOneRead(notificationId: string) {
    const item = notifications.find((notification) => notification.id === notificationId);
    if (!item || item.isRead) return;

    startTransition(async () => {
      try {
        setActionError(null);
        await markMemberPortalNotificationReadAction({ churchSlug, notificationId });
        const nowIso = new Date().toISOString();
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: nowIso }
              : notification
          )
        );
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Could not update notification.");
      }
    });
  }

  function markAllRead() {
    if (unreadCount === 0) return;

    startTransition(async () => {
      try {
        setActionError(null);
        await markAllMemberPortalNotificationsReadAction(churchSlug);
        const nowIso = new Date().toISOString();
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt ?? nowIso,
          }))
        );
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Could not update notifications.");
      }
    });
  }

  function acknowledge(notificationId: string) {
    startTransition(async () => {
      try {
        setActionError(null);
        await acknowledgeMemberPortalNotificationAction({ churchSlug, notificationId });
        const nowIso = new Date().toISOString();
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  readAt: notification.readAt ?? nowIso,
                  acknowledgedAt: nowIso,
                }
              : notification
          )
        );
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Could not acknowledge notification.");
      }
    });
  }

  return (
    <MemberPortalNotificationsContext.Provider value={contextValue}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-[24px] p-0 sm:w-full">
          <DialogHeader className="flex flex-col gap-2 px-5 pb-4 pt-5 text-left sm:px-6">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription className="mt-1">
                    Church announcements, events, assignments, and approval updates.
                  </DialogDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">
                {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
              </Badge>
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={markAllRead}
                >
                  <CheckCheck data-icon="inline-start" />
                  Mark all read
                </Button>
              ) : null}
            </div>
          </DialogHeader>

          <Separator />

          {actionError ? (
            <p role="alert" className="bg-destructive/10 px-5 py-3 text-sm text-destructive sm:px-6">
              {actionError}
            </p>
          ) : null}

          {notifications.length === 0 ? (
            <MobileEmptyState
              title="No notifications yet"
              message="New church updates will appear here."
              className="min-h-64"
            />
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col">
                {notifications.map((notification, index) => {
                  const Icon = notificationIcon(notification.eventType);
                  const needsAcknowledgement =
                    notification.requiresAcknowledgement && !notification.acknowledgedAt;

                  return (
                    <div key={notification.id}>
                      {index > 0 ? <Separator /> : null}
                      <article
                        className={cn(
                          "flex gap-3 px-5 py-4 sm:px-6",
                          notification.isRead ? "bg-background" : "bg-primary/5"
                        )}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{notification.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatNotificationDate(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead ? (
                              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                            ) : null}
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {!notification.isRead ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => markOneRead(notification.id)}
                              >
                                <Check data-icon="inline-start" />
                                Mark read
                              </Button>
                            ) : null}
                            {needsAcknowledgement ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                onClick={() => acknowledge(notification.id)}
                              >
                                <CheckCheck data-icon="inline-start" />
                                Acknowledge
                              </Button>
                            ) : notification.acknowledgedAt ? (
                              <Badge variant="outline">Acknowledged</Badge>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </MemberPortalNotificationsContext.Provider>
  );
}
