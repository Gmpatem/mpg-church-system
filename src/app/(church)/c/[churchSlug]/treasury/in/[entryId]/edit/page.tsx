import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { getTreasuryInflowById, getTreasuryFormOptions } from "@/features/treasury/queries";
import { InflowEditForm } from "./InflowEditForm";
import { WorkspaceHero } from "@/components/workspace";

interface InflowEditPageProps {
  params: Promise<{ churchSlug: string; entryId: string }>;
}

export default async function InflowEditPage({ params }: InflowEditPageProps) {
  const { churchSlug, entryId } = await params;
  const [entry, options] = await Promise.all([
    getTreasuryInflowById(churchSlug, entryId),
    getTreasuryFormOptions(churchSlug),
  ]);

  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treasury", href: `/c/${churchSlug}/treasury` },
          { label: "Edit Entry" },
        ]}
      />
      <WorkspaceHero
        title="Edit Inflow Entry"
        description="Correct a recorded inflow entry."
      />

      <InflowEditForm churchSlug={churchSlug} entry={entry} options={options} />
    </div>
  );
}