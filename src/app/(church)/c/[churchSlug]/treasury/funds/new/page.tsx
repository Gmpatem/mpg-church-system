import Link from "next/link";
import { FundCreateForm } from "./FundCreateForm";

interface FundNewPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function FundNewPage({ params }: FundNewPageProps) {
  const { churchSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create Treasury Fund</h2>
          <p className="text-sm text-slate-600 mt-1">
            Add a new treasury fund or category for this church.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/treasury`}
          className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Treasury
        </Link>
      </div>

      <FundCreateForm churchSlug={churchSlug} />
    </div>
  );
}
