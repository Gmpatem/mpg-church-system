import { getOfficeWorkspaceData } from "@/features/office/queries";
import { OfficeWorkspace } from "@/features/office/components/OfficeWorkspace";

interface OfficePageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function OfficePage({ params }: OfficePageProps) {
  const { churchSlug } = await params;
  const data = await getOfficeWorkspaceData(churchSlug);

  return (
    <OfficeWorkspace
      churchSlug={churchSlug}
      data={data}
    />
  );
}
