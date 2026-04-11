import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import { getChurchNotifications } from "@/features/church-notifications/queries";
import { getMyPendingApprovalCount } from "@/features/approvals/queries";
import { ChurchShell } from "@/components/navigation/ChurchShell";

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

  const ctx = await requireChurchWorkspaceAccess(churchSlug);
  const [notifications, pendingApprovalCount] = await Promise.all([
    getChurchNotifications(ctx.churchId),
    getMyPendingApprovalCount(ctx.churchId, ctx.userId, ctx.roles),
  ]);

  return (
    <ChurchShell
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
    </ChurchShell>
  );
}


