import type { ReactNode } from "react";
import { getCurrentProfile } from "@/features/access/queries";
import { getPlatformNotifications } from "@/features/platform/queries";
import { PlatformSidebar } from "./PlatformSidebar";
import PlatformHeader from "./PlatformHeader";

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
    <div className="min-h-screen bg-gray-50">
      <PlatformSidebar />
      <div className="ml-20 md:ml-64">
        <PlatformHeader
          fullName={profile?.full_name ?? null}
          email={profile?.email ?? null}
          notifications={notifications}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
