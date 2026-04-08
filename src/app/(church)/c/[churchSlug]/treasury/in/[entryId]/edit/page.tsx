import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { getTreasuryInflowById, getTreasuryFormOptions } from "@/features/treasury/queries";
import { InflowEditForm } from "./InflowEditForm";

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Money In Entry</h2>
          <p className="text-sm text-gray-600 mt-1">
            Correct a treasury inflow safely with a required correction note.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/treasury/in`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Inflows
        </Link>
      </div>

      <InflowEditForm churchSlug={churchSlug} entry={entry} options={options} />
    </div>
  );
}