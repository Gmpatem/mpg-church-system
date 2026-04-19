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
  const entry = await getTreasuryInflowById(churchSlug, entryId);

  if (!entry) notFound();

  const includeFundIds =
    typeof entry.fund_id === "string" && entry.fund_id.length > 0 ? [entry.fund_id] : [];
  const includeDepartmentIds =
    typeof entry.department_id === "string" && entry.department_id.length > 0
      ? [entry.department_id]
      : [];

  const options = await getTreasuryFormOptions(churchSlug, {
    includeFundIds,
    includeDepartmentIds,
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
        title="Edit Inflow Entry"
        description="Correct a recorded inflow entry."
      />

      <InflowEditForm churchSlug={churchSlug} entry={entry} options={options} />
    </div>
  );
}
