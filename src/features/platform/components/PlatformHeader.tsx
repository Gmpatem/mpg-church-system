"use client";

import { AlertTriangle, Bell, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markAllPlatformNotificationsReadAction,
  markPlatformNotificationReadAction,
} from "@/features/platform/actions";
import { createClient } from "@/lib/supabase/client";

type PlatformNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at?: string | null;
  href: string;
  is_unread: boolean;
};

interface PlatformHeaderProps {
  fullName?: string | null;
  email?: string | null;
  notifications?: PlatformNotification[];
}

function formatDateStable(value?: string | null) {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

export default function PlatformHeader({
  fullName,
  email,
  notifications = [],
}: PlatformHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const unreadCount = notifications.filter((item) => item.is_unread).length;
  const [isPending, startTransition] = useTransition();

  function markOneRead(notificationId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notification_id", notificationId);
      await markPlatformNotificationReadAction(formData);
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllPlatformNotificationsReadAction();
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search churches, regions, or risk signals..."
            className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="ml-6 flex items-center gap-4">
        <Link href="/platform/oversight">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Intervention Queue</span>
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                  {unreadCount}
                </Badge>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={isPending}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No notifications yet.</div>
            ) : (
              notifications.map((item) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (item.is_unread) {
                        markOneRead(item.id);
                      }
                    }}
                    className="flex cursor-pointer flex-col items-start gap-1 p-3"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.is_unread ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">{item.message}</p>
                    <p className="text-xs text-gray-400">{formatDateStable(item.created_at)}</p>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-xs text-white">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                {fullName ?? "Admin"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{fullName ?? "Platform Owner"}</span>
                <span className="text-xs font-normal text-gray-500">
                  {email ?? "Authenticated admin"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/platform/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onSelect={handleSignOut}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
