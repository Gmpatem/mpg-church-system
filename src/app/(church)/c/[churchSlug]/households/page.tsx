import Link from "next/link";
import { getChurchHouseholds } from "@/features/households/queries";
import { requireChurchAccess } from "@/features/access/queries";

interface HouseholdsPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function HouseholdsPage({ params }: HouseholdsPageProps) {
  const { churchSlug } = await params;
  const ctx = await requireChurchAccess(churchSlug);
  const households = await getChurchHouseholds(churchSlug);

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Households</h2>
          <p className="mt-1 text-sm text-gray-600">
            Organize families, household contacts, and member grouping for church operations.
          </p>
        </div>

        {canManage ? (
          <Link
            href={`/c/${churchSlug}/households/new`}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Household
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {households.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-600">
            No households found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Household</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Head</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {households.map((household) => (
                  <tr key={household.id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{household.household_name}</p>
                        <p className="text-xs text-gray-500">{household.email ?? "No email"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {household.head_of_household_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {household.member_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {[household.city, household.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{household.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/c/${churchSlug}/households/${household.id}`}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        View Household
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
