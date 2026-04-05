import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignMemberToHouseholdAction,
  setHouseholdHeadAction,
} from "@/features/households/actions";
import {
  getChurchHouseholdById,
  getChurchMembersForHouseholdAssignment,
} from "@/features/households/queries";
import { requireChurchAccess } from "@/features/access/queries";

interface HouseholdDetailPageProps {
  params: Promise<{ churchSlug: string; householdId: string }>;
}

export default async function HouseholdDetailPage({ params }: HouseholdDetailPageProps) {
  const { churchSlug, householdId } = await params;

  const ctx = await requireChurchAccess(churchSlug);
  const detail = await getChurchHouseholdById(churchSlug, householdId);

  if (!detail) {
    notFound();
  }

  const { household, members } = detail;

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  const allMembers = canManage ? await getChurchMembersForHouseholdAssignment(churchSlug) : [];
  const assignableMembers = allMembers.filter((member) => member.household_id !== householdId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{household.household_name}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Household profile, member grouping, and family contact details.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/households`}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Back to Households
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Household Details</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Head of Household</p>
              <p className="mt-1 text-sm text-gray-900">{household.head_of_household_name ?? "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Members</p>
              <p className="mt-1 text-sm text-gray-900">{household.member_count}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
              <p className="mt-1 text-sm text-gray-900">{household.phone ?? "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
              <p className="mt-1 text-sm text-gray-900">{household.email ?? "—"}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Address</p>
              <p className="mt-1 text-sm text-gray-900">{household.address ?? "—"}</p>
              <p className="mt-1 text-sm text-gray-600">
                {[household.city, household.country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{household.notes ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Quick Summary</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Household readiness</p>
                <p className="mt-1 text-sm text-gray-500">
                  {members.length > 0
                    ? "This household already has linked members."
                    : "This household has no linked members yet."}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Head assigned</p>
                <p className="mt-1 text-sm text-gray-500">
                  {household.head_of_household_name
                    ? "A head of household has been assigned."
                    : "No head of household is assigned yet."}
                </p>
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Assign Member</h3>
              <p className="mt-1 text-sm text-gray-600">
                Link an existing member to this household and set an initial household role.
              </p>

              <form action={assignMemberToHouseholdAction} className="mt-5 space-y-4">
                <input type="hidden" name="churchSlug" value={churchSlug} />
                <input type="hidden" name="householdId" value={householdId} />

                <div>
                  <label htmlFor="memberId" className="mb-1 block text-sm font-medium text-gray-700">
                    Member
                  </label>
                  <select
                    id="memberId"
                    name="memberId"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select member</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {(member.display_name || [member.first_name, member.last_name].filter(Boolean).join(" "))} - {member.membership_status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="householdRole" className="mb-1 block text-sm font-medium text-gray-700">
                    Household Role
                  </label>
                  <select
                    id="householdRole"
                    name="householdRole"
                    defaultValue=""
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select household role</option>
                    <option value="head">Head</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="relative">Relative</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Assign Member
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Household Members</h3>
          <p className="mt-1 text-sm text-gray-600">
            Members currently linked to this household.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-600">
            No members are linked to this household yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  {canManage ? (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {member.display_name || [member.first_name, member.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.household_role ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.membership_status}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.email ?? "—"}</td>
                    {canManage ? (
                      <td className="px-6 py-4 text-sm">
                        <form action={setHouseholdHeadAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="householdId" value={householdId} />
                          <input type="hidden" name="memberId" value={member.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Set as Head
                          </button>
                        </form>
                      </td>
                    ) : null}
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
