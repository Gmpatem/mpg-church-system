"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Church, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/features/i18n";
import { ChurchAvatar } from "../primitives/ChurchAvatar";
import { ChurchBadge } from "../primitives/ChurchBadge";
import { ChurchButton } from "../primitives/ChurchButton";
import { buildChurchNavigationGroups } from "./navigation";
import type { ChurchWorkspaceChurch, ChurchWorkspaceUser } from "../types";

interface ChurchSidebarProps {
  church: ChurchWorkspaceChurch;
  user: ChurchWorkspaceUser | null;
  roleLabel?: string;
  showAccessControl?: boolean;
  pendingApprovalCount?: number;
  onNavigate?: () => void;
  className?: string;
}

function isPathActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname === `${href}/dashboard`;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ChurchSidebar({
  church,
  user,
  roleLabel,
  showAccessControl = false,
  pendingApprovalCount = 0,
  onNavigate,
  className,
}: ChurchSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const groups = buildChurchNavigationGroups({
    churchSlug: church.slug,
    roleLabel,
    showAccessControl,
    pendingApprovalCount,
    t,
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-[hsl(var(--church-sidebar))] text-[hsl(var(--church-sidebar-ink))]",
        className
      )}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <Link href={`/c/${church.slug}`} onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--church-primary))] text-white shadow-sm">
            <Church className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              {t.navigation.workspace || "Church Workspace"}
            </span>
            <span className="mt-1 block truncate text-sm font-semibold text-white">
              {church.name}
            </span>
          </span>
        </Link>

        {roleLabel ? (
          <ChurchBadge className="mt-4 border-white/10 bg-white/10 text-white/80 hover:bg-white/10">
            {roleLabel}
          </ChurchBadge>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Church workspace">
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1.5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isPathActive(pathname, item.href, item.exact);

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      prefetch={true}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition",
                        active
                          ? "bg-[hsl(var(--church-primary))] text-white shadow-sm"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[hsl(var(--church-gold))] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--church-sidebar))]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <ChurchAvatar
              name={user?.full_name}
              email={user?.email}
              imageUrl={user?.avatar_url}
              className="size-10 border-white/10"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.full_name || t.common.user || "User"}
              </p>
              <p className="truncate text-xs text-white/50">
                {user?.email || t.common.noEmail || "No email"}
              </p>
            </div>
          </div>

          <ChurchButton
            type="button"
            variant="secondary"
            className="mt-3 w-full bg-white text-[hsl(var(--church-sidebar))] hover:bg-white/90"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 size-4" aria-hidden="true" />
            {t.auth.logout}
          </ChurchButton>
        </div>
      </div>
    </div>
  );
}
