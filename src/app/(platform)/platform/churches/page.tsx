import PlatformChurchesWorkspaceClient from "@/features/platform/components/PlatformChurchesWorkspaceClient";
import { getPlatformChurches } from "@/features/platform/queries";

export default async function PlatformChurchesPage() {
  const churches = await getPlatformChurches();

  return <PlatformChurchesWorkspaceClient churches={churches} />;
}
