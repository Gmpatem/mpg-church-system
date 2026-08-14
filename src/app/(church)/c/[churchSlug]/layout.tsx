import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireChurchAccess } from "@/features/access/queries";
import { requireDepartmentAccess } from "@/features/departments/access";
import { getChurchNotifications } from "@/features/church-notifications/queries";
import { getMyPendingApprovalCount } from "@/features/approvals/queries";
import { ChurchAppShell } from "@/components/church-workspace";

interface ChurchLayoutProps {
  children: React.ReactNode;
  params: Promise<{ churchSlug: string }>;
}

function getRoleLabel(roles: string[]) {
  if (roles.includes("platform_owner")) return "Platform Owner";
  if (roles.includes("platform_admin")) return "Platform Admin";
  if (roles.includes("platform_support")) return "Platform Support";
  if (roles.includes("church_admin")) return "Church Admin";
  if (roles.includes("pastor")) return "Pastor";
  if (roles.includes("elder")) return "Elder";
  if (roles.includes("clerk")) return "Clerk";
  if (roles.includes("church_secretary")) return "Church Secretary";
  if (roles.includes("treasurer")) return "Treasurer";
  return "Member";
}

function canViewAccessControl(roles: string[]): boolean {
  return roles.some((role) =>
    [
      "pastor", "church_admin", "tech_team", "clerk", "church_secretary",
      "platform_owner", "platform_admin", "platform_support",
    ].includes(role)
  );
}

export default async function ChurchLayout({ children, params }: ChurchLayoutProps) {
  const { churchSlug } = await params;
  const ctx = await requireChurchAccess(churchSlug);
  const requestHeaders = await headers();
  const requestPathname = requestHeaders.get("x-mpg-pathname") ?? "";
  const scopedDepartmentId = requestHeaders.get("x-mpg-department-id") ?? "";
  const hasFullWorkspaceAccess = ctx.isPlatformAdmin || ctx.hasOperationalAccess;
  let departmentScopedLeader = false;

  if (!hasFullWorkspaceAccess) {
    const isDepartmentWorkspaceRoute =
      requestPathname === `/c/${ctx.churchSlug}/departments` && Boolean(scopedDepartmentId);

    if (!isDepartmentWorkspaceRoute) {
      redirect(ctx.hasMemberLink ? `/my/${ctx.churchSlug}?tab=overview` : `/join/${ctx.churchSlug}`);
    }

    try {
      const access = await requireDepartmentAccess(ctx.churchSlug, scopedDepartmentId, "view");
      departmentScopedLeader = access.isDepartmentLeader;
    } catch {
      redirect(`/my/${ctx.churchSlug}?tab=ministries`);
    }

    if (!departmentScopedLeader) {
      redirect(`/my/${ctx.churchSlug}?tab=ministries`);
    }
  }

  if (departmentScopedLeader) {
    return (
      <div className="min-h-dvh overflow-x-clip bg-[hsl(var(--church-bg))] text-foreground">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{ctx.churchName}</p>
              <p className="text-xs text-muted-foreground">Department Leader Workspace</p>
            </div>
            <Link
              href={`/my/${ctx.churchSlug}?tab=ministries`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Back to Member Portal
            </Link>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1600px] px-[clamp(1rem,2vw,2rem)] py-[clamp(1rem,2vw,1.75rem)]">
          {children}
        </main>
      </div>
    );
  }

  const [notifications, pendingApprovalCount] = await Promise.all([
    getChurchNotifications(ctx.churchId),
    getMyPendingApprovalCount(ctx.churchId, ctx.userId, ctx.roles),
  ]);

  return (
    <ChurchAppShell
      church={{
        id: ctx.churchId,
        slug: ctx.churchSlug,
        name: ctx.churchName ?? ctx.churchSlug,
      }}
      user={
        ctx.profile
          ? {
              id: ctx.profile.id,
              full_name: ctx.profile.full_name ?? null,
              email: ctx.profile.email ?? null,
              avatar_url: null,
            }
          : null
      }
      roleLabel={getRoleLabel(ctx.roles)}
      showAccessControl={canViewAccessControl(ctx.roles)}
      pendingApprovalCount={pendingApprovalCount}
      notifications={notifications}
    >
      {children}
    </ChurchAppShell>
  );
}


