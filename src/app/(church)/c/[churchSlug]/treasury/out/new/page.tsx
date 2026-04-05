import Link from "next/link";
import { getTreasuryFormOptions } from "@/features/treasury/queries";
import { MoneyOutForm } from "./MoneyOutForm";

interface MoneyOutPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function MoneyOutPage({ params }: MoneyOutPageProps) {
  const { churchSlug } = await params;
  const options = await getTreasuryFormOptions(churchSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Record Money Out</h2>
          <p className="text-sm text-gray-600 mt-1">
            Project, evangelism, mission remittance, or church expense.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/treasury`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Treasury
        </Link>
      </div>

      <MoneyOutForm churchSlug={churchSlug} options={options} />
    </div>
  );
}