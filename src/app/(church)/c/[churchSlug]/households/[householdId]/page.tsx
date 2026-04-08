import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { WorkspaceStatCard } from "@/components/workspace";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import {
  assignMemberToHouseholdAction,
  setHouseholdHeadAction,
} from "@/features/households/actions";
import {
  getChurchHouseholdById,
  getChurchMembersForHouseholdAssignment,
} from "@/features/households/queries";
import { requireChurchAccess } from "@/features/access/queries";

const householdRoleLabels: Record<string, string> = {
  head: "Head of Household",
  spouse: "Spouse",
  child: "Child",
  relative: "Relative",
  guardian: "Guardian",
  other: "Other",
};

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
      <Breadcrumb
        items={[
          { label: "Households", href: `/c/${churchSlug}/households` },
          { label: household.household_name },
        ]}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{household.household_name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Household profile, member grouping, and family contact details.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/households`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Households
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <WorkspaceStatCard
          label="Members"
          value={household.member_count}
        />
        <WorkspaceStatCard
          label="Head of Household"
          value={household.head_of_household_name ?? "—"}
        />
        <WorkspaceStatCard
          label="Phone"
          value={household.phone ?? "—"}
        />
        <WorkspaceStatCard
          label="Email"
          value={household.email ?? "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Household Details</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Head of Household</p>
              <p className="mt-1 text-sm text-slate-900">{household.head_of_household_name ?? "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p>
              <p className="mt-1 text-sm text-slate-900">{household.member_count}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-1 text-sm text-slate-900">{household.phone ?? "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-900">{household.email ?? "—"}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
              <p className="mt-1 text-sm text-slate-900">{household.address ?? "—"}</p>
              <p className="mt-1 text-sm text-slate-600">
                {[household.city, household.country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{household.notes ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Quick Summary</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">Household readiness</p>
                <p className="mt-1 text-sm text-slate-500">
                  {members.length > 0
                    ? "This household already has linked members."
                    : "This household has no linked members yet."}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">Head assigned</p>
                <p className="mt-1 text-sm text-slate-500">
                  {household.head_of_household_name
                    ? "A head of household has been assigned."
                    : "No head of household is assigned yet."}
                </p>
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Assign Member</h3>
              <p className="mt-1 text-sm text-slate-600">
                Link an existing member to this household and set an initial household role.
              </p>

              <form action={assignMemberToHouseholdAction} className="mt-5 space-y-4">
                <input type="hidden" name="churchSlug" value={churchSlug} />
                <input type="hidden" name="householdId" value={householdId} />

                <div>
                  <label htmlFor="memberId" className="mb-1 block text-sm font-medium text-slate-700">
                    Member
                  </label>
                  <select
                    id="memberId"
                    name="memberId"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select member</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {(member.display_name || [member.first_name, member.last_name].filter(Boolean).join(" "))} - {getLabel(memberStatusLabels, member.membership_status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="householdRole" className="mb-1 block text-sm font-medium text-slate-700">
                    Household Role
                  </label>
                  <select
                    id="householdRole"
                    name="householdRole"
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
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
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Assign Member
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Household Members</h3>
          <p className="mt-1 text-sm text-slate-600">
            Members currently linked to this household.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-600">
            No members are linked to this household yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  {canManage ? (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {member.display_name || [member.first_name, member.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getLabel(householdRoleLabels, member.household_role)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getLabel(memberStatusLabels, member.membership_status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.email ?? "—"}</td>
                    {canManage ? (
                      <td className="px-6 py-4 text-sm">
                        <form action={setHouseholdHeadAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="householdId" value={householdId} />
                          <input type="hidden" name="memberId" value={member.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
