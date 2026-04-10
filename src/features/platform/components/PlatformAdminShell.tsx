import type { ReactNode } from "react";
import { getCurrentProfile } from "@/features/access/queries";
import { getPlatformNotifications } from "@/features/platform/queries";
import { PlatformShellClient } from "./PlatformShellClient";

export default async function PlatformAdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, notifications] = await Promise.all([
    getCurrentProfile(),
    getPlatformNotifications(),
  ]);

  return (
    <PlatformShellClient
      fullName={profile?.full_name ?? null}
      email={profile?.email ?? null}
      notifications={notifications}
    >
      {children}
    </PlatformShellClient>
  );
}
