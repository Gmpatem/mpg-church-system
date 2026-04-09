import { getOfficeWorkspaceData } from "@/features/office/queries";
import { OfficeWorkspace } from "@/features/office/components/OfficeWorkspace";
import { WorkspaceHero } from "@/components/workspace";

interface OfficePageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function OfficePage({ params }: OfficePageProps) {
  const { churchSlug } = await params;
  const data = await getOfficeWorkspaceData(churchSlug);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Church Office"
        description="Operational overview and pending actions for church administration."
      />
      <OfficeWorkspace
        churchSlug={churchSlug}
        data={data}
      />
    </div>
  );
}
