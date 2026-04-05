import { requirePlatformAdmin } from "@/features/access/queries";
import PlatformAdminShell from "@/features/platform/components/PlatformAdminShell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
