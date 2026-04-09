"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Building2,
  Calendar,
  Church,
  Home,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  Shield,
  Briefcase,
  ClipboardCheck,
} from "lucide-react";
import { useI18n } from "@/features/i18n";

interface ChurchSidebarProps {
  showAccessControl?: boolean;
  pendingApprovalCount?: number;
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
  onNavigate?: () => void;
}

export function ChurchSidebar({
  church,
  user,
  roleLabel,
  onNavigate,
  showAccessControl = false,
  pendingApprovalCount = 0,
}: ChurchSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const { t } = useI18n();

  const navigation = [
    { name: t.navigation.dashboard, href: `/c/${church.slug}`, icon: LayoutDashboard, exact: true },
    { name: t.navigation.members, href: `/c/${church.slug}/members`, icon: Users },
    { name: t.navigation.households, href: `/c/${church.slug}/households`, icon: Home },
    { name: t.navigation.departments, href: `/c/${church.slug}/departments`, icon: Building2 },
    { name: t.navigation.treasury, href: `/c/${church.slug}/treasury`, icon: Wallet },
    { name: t.navigation.events, href: `/c/${church.slug}/events`, icon: Calendar },
    { name: t.navigation.office || "Church Office", href: `/c/${church.slug}/office`, icon: Briefcase, requiresOffice: true },
    { name: t.navigation.reports, href: `/c/${church.slug}/reports`, icon: BarChart3 },
    { name: t.navigation.approvals || "Approvals", href: `/c/${church.slug}/approvals`, icon: ClipboardCheck, requiresAuthority: true },
    { name: t.navigation.accessControl || "Invites & Access", href: `/c/${church.slug}/access-control`, icon: Shield, requiresAuthority: true },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href={`/c/${church.slug}`} onClick={onNavigate} className="block">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Church className="h-5 w-5 text-cyan-200" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {t.navigation.workspace || "Church Workspace"}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {church.name}
              </p>
            </div>
          </div>
        </Link>

        {roleLabel ? (
          <div className="mt-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            {roleLabel}
          </div>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-5">
          <nav className="grid gap-1.5">
            {navigation
              .filter((item) => !item.requiresAuthority || showAccessControl)
              .filter((item) => {
                if (!item.requiresOffice) return true;

                const allowedOfficeLabels = [
                  "Clerk",
                  "Church Secretary",
                  "Church Admin",
                  "Pastor",
                  "Platform Owner",
                  "Platform Admin",
                  "Platform Support"
                ];

                return allowedOfficeLabels.includes(roleLabel ?? "");
              })
              .map((item) => {
              const active = isActive(item.href, item.exact);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                  {item.name === "Approvals" && pendingApprovalCount > 0 ? (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {pendingApprovalCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.full_name || t.common.user || "User"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.email || t.common.noEmail || "No email"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full justify-center rounded-xl bg-white text-slate-950 hover:bg-slate-100"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.auth.logout}
          </Button>
        </div>
      </div>
    </div>
  );
}












