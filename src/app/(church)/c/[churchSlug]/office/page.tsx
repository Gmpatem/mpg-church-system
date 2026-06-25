import { getOfficeWorkspaceData } from "@/features/office/queries";
import { OfficeConsoleWorkspace } from "@/features/office/components/OfficeConsoleWorkspace";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";

interface OfficePageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function OfficePage({ params }: OfficePageProps) {
  const { churchSlug } = await params;
  const data = await getOfficeWorkspaceData(churchSlug);

  return (
    <div className="space-y-6">
      <WorkspaceRouteStateBridge
        churchSlug={churchSlug}
        moduleKey="office"
        prefetchHrefs={[
          `/c/${churchSlug}/approvals`,
          `/c/${churchSlug}/reports`,
          `/c/${churchSlug}/access-control`,
        ]}
      />
      <OfficeConsoleWorkspace
        churchSlug={churchSlug}
        data={data}
      />
    </div>
  );
}
