import Link from "next/link";
import { getTreasuryFormOptions } from "@/features/treasury/queries";
import { MoneyInForm } from "./MoneyInForm";

interface MoneyInPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function MoneyInPage({ params }: MoneyInPageProps) {
  const { churchSlug } = await params;
  const options = await getTreasuryFormOptions(churchSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Record Money In</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tithe, offering, donation, or special contribution.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/treasury`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Treasury
        </Link>
      </div>

      <MoneyInForm churchSlug={churchSlug} options={options} />
    </div>
  );
}