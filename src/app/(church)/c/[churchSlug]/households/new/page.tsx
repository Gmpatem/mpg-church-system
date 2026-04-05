import { HouseholdForm } from "./HouseholdForm";

interface HouseholdNewPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function HouseholdNewPage({ params }: HouseholdNewPageProps) {
  const { churchSlug } = await params;
  return <HouseholdForm churchSlug={churchSlug} />;
}