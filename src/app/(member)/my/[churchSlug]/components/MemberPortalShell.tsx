import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, User2, Users, Home, Calendar } from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { signOutMemberPortalAction } from "@/features/member-portal/actions";
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

const NAV_ITEMS: Array<{
  key: MemberPortalTabKey;
  label: string;
  icon: typeof Home;
}> = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "profile", label: "Profile", icon: User2 },
  { key: "departments", label: "My Involvement", icon: Users },
  { key: "calendar", label: "Calendar", icon: Calendar },
];

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

function getActiveLabel(activeTab: MemberPortalTabKey) {
  return NAV_ITEMS.find((item) => item.key === activeTab)?.label ?? "Member Portal";
}

export function MemberPortalShell({
  foundation,
  activeTab,
  showWelcome = false,
  children,
}: MemberPortalShellProps) {
  const churchName = foundation.churchName ?? "Church";
  const churchSlug = foundation.churchSlug;
  const memberName = getMemberName(foundation);
  const memberCode = foundation.identity?.member.member_code ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r bg-card/60 lg:flex lg:flex-col">
          <div className="border-b p-6">
            <p className="text-sm font-medium text-muted-foreground">Member Portal</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{churchName}</h2>
            <div className="mt-4 rounded-2xl border bg-background/60 p-4">
              <p className="font-medium text-foreground">{memberName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {memberCode ? `Member code: ${memberCode}` : "Member access active"}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <Link
                  key={item.key}
                  href={buildTabHref(churchSlug, item.key)}
                  className={
                    isActive
                      ? "flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-sm font-medium text-background transition"
                      : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <form action={signOutMemberPortalAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b bg-card/40">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">{churchName}</p>
                <h1 className="text-xl font-semibold text-foreground">
                  {getActiveLabel(activeTab)}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <LanguageSwitcher variant="minimal" />
                <form action={signOutMemberPortalAction} className="lg:hidden">
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition hover:bg-accent"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:hidden">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <Link
                    key={item.key}
                    href={buildTabHref(churchSlug, item.key)}
                    className={
                      isActive
                        ? "inline-flex whitespace-nowrap rounded-2xl bg-foreground px-4 py-2.5 text-sm font-medium text-background"
                        : "inline-flex whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {showWelcome ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Welcome to {churchName}.</p>
                <p className="mt-1">
                  Your account is ready. Any requested leadership or staff access is still pending church approval.
                </p>
              </div>
            ) : null}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
