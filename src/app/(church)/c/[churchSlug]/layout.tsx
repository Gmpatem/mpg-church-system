import { requireChurchAccess } from "@/features/access/queries";
import { canCurrentUserViewAccessControl } from "@/features/access-control/queries";
import { getChurchNotifications } from "@/features/church-notifications/queries";
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

export default async function ChurchLayout({ children, params }: ChurchLayoutProps) {
  const { churchSlug } = await params;

  const [canViewAccessControl, ctx] = await Promise.all([
    canCurrentUserViewAccessControl(churchSlug),
    requireChurchAccess(churchSlug),
  ]);

  const notifications = await getChurchNotifications(ctx.churchId, churchSlug);

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
      showAccessControl={canViewAccessControl}
      notifications={notifications}
    >
      {children}
    </ChurchShell>
  );
}



