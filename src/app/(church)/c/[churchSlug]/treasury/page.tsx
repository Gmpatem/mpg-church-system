import { getTreasuryWorkspaceBootstrap, getMembersAlreadyTithedThisWeek } from "@/features/treasury/queries";
import { TreasuryWorkspace } from "./components/TreasuryWorkspace";

interface TreasuryPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function TreasuryPage({ params }: TreasuryPageProps) {
  const { churchSlug } = await params;

  const [data, alreadyTithedIds] = await Promise.all([
    getTreasuryWorkspaceBootstrap(churchSlug),
    getMembersAlreadyTithedThisWeek(churchSlug),
  ]);

  return (
    <TreasuryWorkspace
      churchSlug={churchSlug}
      dashboard={data.dashboard}
      recentInflows={data.recentInflows}
      recentOutflows={data.recentOutflows}
      formOptions={data.formOptions}
      alreadyTithedIds={alreadyTithedIds}
    />
  );
}
