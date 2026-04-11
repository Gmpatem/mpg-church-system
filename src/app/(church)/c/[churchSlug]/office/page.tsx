import { getOfficeWorkspaceData } from "@/features/office/queries";
import { OfficeQueueWorkspace } from "@/features/office/components/OfficeQueueWorkspace";
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
      <OfficeQueueWorkspace
        churchSlug={churchSlug}
        data={data}
      />
    </div>
  );
}
