import { HouseholdForm } from "./HouseholdForm";
import { WorkspaceHero } from "@/components/workspace";

interface HouseholdNewPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function HouseholdNewPage({ params }: HouseholdNewPageProps) {
  const { churchSlug } = await params;
  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="New Household"
        description="Create a household record and add members."
      />
      <HouseholdForm churchSlug={churchSlug} />
    </div>
  );
}