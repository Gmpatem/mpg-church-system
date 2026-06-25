"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Church,
  Home,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/features/i18n";
import { ChurchAvatar } from "../primitives/ChurchAvatar";
import { ChurchBadge } from "../primitives/ChurchBadge";
import { ChurchButton, ChurchIconButton } from "../primitives/ChurchButton";
import {
  buildChurchNavigationGroups,
  getActiveChurchNavigation,
  getDashboardNavigationItem,
  isChurchNavigationItemActive,
} from "./navigation";
import type {
  ChurchNavigationGroupKey,
  ChurchNavigationItem,
  ChurchWorkspaceChurch,
  ChurchWorkspaceUser,
} from "../types";

interface ChurchSidebarProps {
  church: ChurchWorkspaceChurch;
  user: ChurchWorkspaceUser | null;
  roleLabel?: string;
  showAccessControl?: boolean;
  pendingApprovalCount?: number;
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobile?: boolean;
}

function badgeContent(item: ChurchNavigationItem) {
  return item.badge && item.badge > 0 ? (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[hsl(var(--church-gold))] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--church-sidebar))]">
      {item.badge}
    </span>
  ) : null;
}

export function ChurchSidebar({
  church,
  user,
  roleLabel,
  showAccessControl = false,
  pendingApprovalCount = 0,
  onNavigate,
  className,
  collapsed = false,
  onCollapsedChange,
  mobile = false,
}: ChurchSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const groups = useMemo(
    () =>
      buildChurchNavigationGroups({
        churchSlug: church.slug,
        roleLabel,
        showAccessControl,
        pendingApprovalCount,
        t,
      }),
    [church.slug, pendingApprovalCount, roleLabel, showAccessControl, t]
  );
  const dashboardItem = useMemo(() => getDashboardNavigationItem(church.slug, t), [church.slug, t]);
  const active = useMemo(() => getActiveChurchNavigation(pathname, groups), [groups, pathname]);
  const activeGroupKey = active.activeGroupKey;
  const fallbackGroupKey = groups[0]?.key ?? null;
  const [openGroupKey, setOpenGroupKey] = useState<ChurchNavigationGroupKey | null>(
    () => activeGroupKey ?? fallbackGroupKey
  );
  const [openFlyoutKey, setOpenFlyoutKey] = useState<ChurchNavigationGroupKey | null>(null);

  useEffect(() => {
    setOpenGroupKey(activeGroupKey ?? fallbackGroupKey);
  }, [activeGroupKey, fallbackGroupKey, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggleGroup(groupKey: ChurchNavigationGroupKey) {
    setOpenGroupKey((current) => {
      if (current === groupKey && activeGroupKey !== groupKey) return null;
      return groupKey;
    });
  }

  const dashboardActive = isChurchNavigationItemActive(pathname, dashboardItem);

  return (
    <TooltipProvider delayDuration={180}>
      <div
        className={cn(
          "flex h-full min-h-0 flex-col bg-[hsl(var(--church-sidebar))] text-[hsl(var(--church-sidebar-ink))]",
          collapsed && !mobile ? "items-center" : "",
          className
        )}
      >
        <div className={cn("w-full border-b border-white/10", collapsed && !mobile ? "px-3 py-4" : "px-5 py-5")}>
          <Link
            href={dashboardItem.href}
            onClick={onNavigate}
            aria-current={dashboardActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-white/70",
              collapsed && !mobile ? "justify-center p-0" : ""
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--church-primary))] text-white shadow-sm",
                collapsed && !mobile ? "size-11" : "size-10"
              )}
            >
              <Church className="size-5" aria-hidden="true" />
            </span>
            {!collapsed || mobile ? (
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {t.navigation.workspace || "Church Workspace"}
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-white">
                  {church.name}
                </span>
              </span>
            ) : (
              <span className="sr-only">{church.name}</span>
            )}
          </Link>

          {roleLabel && (!collapsed || mobile) ? (
            <ChurchBadge className="mt-4 border-white/10 bg-white/10 text-white/80 hover:bg-white/10">
              {roleLabel}
            </ChurchBadge>
          ) : null}

          <div className={cn("mt-4", collapsed && !mobile ? "flex justify-center" : "")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={dashboardItem.href}
                  onClick={onNavigate}
                  aria-current={dashboardActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                    collapsed && !mobile ? "size-10 justify-center px-0" : "px-2.5",
                    dashboardActive
                      ? "bg-[hsl(var(--accent))] text-[hsl(var(--church-primary-hover))] shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Home className="size-4 shrink-0" aria-hidden="true" />
                  {!collapsed || mobile ? (
                    <span className="truncate">{dashboardItem.label}</span>
                  ) : (
                    <span className="sr-only">{dashboardItem.label}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && !mobile ? (
                <TooltipContent side="right">{dashboardItem.label}</TooltipContent>
              ) : null}
            </Tooltip>
          </div>
        </div>

        <nav
          className={cn(
            "min-h-0 w-full flex-1 overflow-y-auto py-4",
            collapsed && !mobile ? "px-2" : "px-3"
          )}
          aria-label="Church workspace"
        >
          <div className="flex flex-col gap-1.5">
            {groups.map((group) => {
              const GroupIcon = group.icon;
              const groupOpen = openGroupKey === group.key;
              const groupActive = active.activeGroupKey === group.key;
              const groupBadge = group.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);

              if (collapsed && !mobile) {
                return (
                  <Popover
                    key={group.key}
                    open={openFlyoutKey === group.key}
                    onOpenChange={(open) => setOpenFlyoutKey(open ? group.key : null)}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${group.label} navigation`}
                            aria-expanded={openFlyoutKey === group.key}
                            className={cn(
                              "relative flex size-11 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                              groupActive && "bg-white/10 text-white"
                            )}
                          >
                            <GroupIcon className="size-5" aria-hidden="true" />
                            {groupBadge > 0 ? (
                              <span className="absolute right-1 top-1 size-2 rounded-full bg-[hsl(var(--church-gold))]" />
                            ) : null}
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">{group.label}</TooltipContent>
                    </Tooltip>

                    <PopoverContent
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="w-72 rounded-xl border-white/10 bg-[hsl(var(--church-sidebar))] p-2 text-white shadow-xl"
                    >
                      <div className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                        {group.label}
                      </div>
                      <div className="grid gap-1">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const itemActive = active.activeItemKey === item.key;

                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              prefetch={true}
                              onClick={() => {
                                setOpenFlyoutKey(null);
                                onNavigate?.();
                              }}
                              aria-current={itemActive ? "page" : undefined}
                              className={cn(
                                "flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                itemActive
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--church-primary-hover))]"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <ItemIcon className="size-4 shrink-0" aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              {badgeContent(item)}
                            </Link>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              return (
                <div key={group.key} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={groupOpen}
                    aria-controls={`church-nav-group-${group.key}`}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                      groupActive
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <GroupIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{group.label}</span>
                    {groupBadge > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[hsl(var(--church-gold))] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--church-sidebar))]">
                        {groupBadge}
                      </span>
                    ) : null}
                    <ChevronDown
                      className={cn("size-4 shrink-0 transition-transform", groupOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>

                  {groupOpen ? (
                    <div
                      id={`church-nav-group-${group.key}`}
                      role="group"
                      aria-label={`${group.label} modules`}
                      className="grid gap-1 pl-3"
                    >
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const itemActive = active.activeItemKey === item.key;

                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            prefetch={true}
                            onClick={onNavigate}
                            aria-current={itemActive ? "page" : undefined}
                            className={cn(
                              "relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                              itemActive
                                ? "bg-[hsl(var(--accent))] text-[hsl(var(--church-primary-hover))] shadow-sm before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[hsl(var(--church-gold))]"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <ItemIcon className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {badgeContent(item)}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>

        <div className={cn("w-full border-t border-white/10", collapsed && !mobile ? "p-3" : "p-4")}>
          <div
            className={cn(
              "rounded-xl border border-white/10 bg-white/5",
              collapsed && !mobile ? "flex flex-col items-center gap-3 p-2" : "p-3"
            )}
          >
            <div className={cn("flex min-w-0 items-center gap-3", collapsed && !mobile ? "justify-center" : "")}>
              <ChurchAvatar
                name={user?.full_name}
                email={user?.email}
                imageUrl={user?.avatar_url}
                className="size-10 border-white/10"
              />
              {!collapsed || mobile ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user?.full_name || t.common.user || "User"}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {user?.email || t.common.noEmail || "No email"}
                  </p>
                </div>
              ) : null}
            </div>

            {!collapsed || mobile ? (
              <ChurchButton
                type="button"
                variant="secondary"
                className="mt-3 w-full bg-white text-[hsl(var(--church-sidebar))] hover:bg-white/90"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 size-4" aria-hidden="true" />
                {t.auth.logout}
              </ChurchButton>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ChurchIconButton
                    type="button"
                    variant="ghost"
                    className="size-10 text-white/70 hover:bg-white/10 hover:text-white"
                    onClick={handleLogout}
                    aria-label={t.auth.logout}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                  </ChurchIconButton>
                </TooltipTrigger>
                <TooltipContent side="right">{t.auth.logout}</TooltipContent>
              </Tooltip>
            )}
          </div>

          {!mobile ? (
            <ChurchIconButton
              type="button"
              variant="ghost"
              className={cn(
                "mt-3 w-full text-white/70 hover:bg-white/10 hover:text-white",
                collapsed && "w-10"
              )}
              onClick={() => onCollapsedChange?.(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="size-4" aria-hidden="true" />
              ) : (
                <>
                  <ChevronsLeft className="mr-2 size-4" aria-hidden="true" />
                  <span>Collapse</span>
                </>
              )}
            </ChurchIconButton>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
