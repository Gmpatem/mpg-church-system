import PlatformChurchesClient from "@/features/platform/components/PlatformChurchesClient";
import { getPlatformChurches } from "@/features/platform/queries";

export default async function PlatformChurchesPage() {
  const churches = await getPlatformChurches();

  return <PlatformChurchesClient churches={churches} />;
}
