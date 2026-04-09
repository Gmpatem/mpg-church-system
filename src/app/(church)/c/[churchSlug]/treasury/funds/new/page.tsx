import { FundCreateForm } from "./FundCreateForm";
import { WorkspaceHero } from "@/components/workspace";

interface FundNewPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function FundNewPage({ params }: FundNewPageProps) {
  const { churchSlug } = await params;

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Create Treasury Fund"
        description="Add a new fund category for this church."
      />

      <FundCreateForm churchSlug={churchSlug} />
    </div>
  );
}
