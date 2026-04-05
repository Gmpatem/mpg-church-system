import Link from "next/link";
import { notFound } from "next/navigation";
import { getTreasuryOutflowById, getTreasuryFormOptions } from "@/features/treasury/queries";
import { OutflowEditForm } from "./OutflowEditForm";

interface OutflowEditPageProps {
  params: Promise<{ churchSlug: string; entryId: string }>;
}

export default async function OutflowEditPage({ params }: OutflowEditPageProps) {
  const { churchSlug, entryId } = await params;
  const [entry, options] = await Promise.all([
    getTreasuryOutflowById(churchSlug, entryId),
    getTreasuryFormOptions(churchSlug),
  ]);

  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Money Out Entry</h2>
          <p className="text-sm text-gray-600 mt-1">
            Correct a treasury outflow safely with a required correction note.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/treasury/out`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Outflows
        </Link>
      </div>

      <OutflowEditForm churchSlug={churchSlug} entry={entry} options={options} />
    </div>
  );
}