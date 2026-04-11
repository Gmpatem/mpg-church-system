import { ApprovalsQueueWorkspace } from "@/features/approvals/components/ApprovalsQueueWorkspace";
import { getApprovalsInboxData } from "@/features/approvals/inbox";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";

type PageProps = {
  params: Promise<{
    churchSlug: string;
  }>;
  searchParams?: Promise<{
    module?: string;
    status?: string;
    stage?: string;
  }>;
};

export default async function ApprovalsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};

  const data = await getApprovalsInboxData(params.churchSlug, {
    module: searchParams.module,
    status: searchParams.status,
    stage: searchParams.stage,
  });

  return (
    <div className="space-y-6">
      <WorkspaceRouteStateBridge
        churchSlug={params.churchSlug}
        moduleKey="approvals"
        restoreQueryState={true}
        persistQueryKeys={["module", "status", "stage"]}
        prefetchHrefs={[
          `/c/${params.churchSlug}/office`,
          `/c/${params.churchSlug}/reports`,
          `/c/${params.churchSlug}/access-control`,
        ]}
      />
      <ApprovalsQueueWorkspace
        churchSlug={params.churchSlug}
        data={data}
      />
    </div>
  );
}
