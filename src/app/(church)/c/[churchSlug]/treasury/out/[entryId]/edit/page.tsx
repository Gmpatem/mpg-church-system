import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { getTreasuryOutflowById, getTreasuryFormOptions } from "@/features/treasury/queries";
import { OutflowEditForm } from "./OutflowEditForm";
import { WorkspaceHero } from "@/components/workspace";

interface OutflowEditPageProps {
  params: Promise<{ churchSlug: string; entryId: string }>;
}

export default async function OutflowEditPage({ params }: OutflowEditPageProps) {
  const { churchSlug, entryId } = await params;
  const entry = await getTreasuryOutflowById(churchSlug, entryId);

  if (!entry) notFound();

  const options = await getTreasuryFormOptions(churchSlug, {
    includeFundIds: entry.fund_id ? [entry.fund_id] : [],
    includeDepartmentIds: entry.department_id ? [entry.department_id] : [],
  });

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treasury", href: `/c/${churchSlug}/treasury` },
          { label: "Edit Entry" },
        ]}
      />
      <WorkspaceHero
        title="Edit Outflow Entry"
        description="Correct a recorded outflow entry."
      />

      <OutflowEditForm churchSlug={churchSlug} entry={entry} options={options} />
    </div>
  );
}
