"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createMemberAction } from "@/features/members/actions";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { CopyableLink } from "@/components/ui/CopyableLink";
import { InlineAlert } from "@/components/ui/InlineAlert";

interface Department {
  id: string;
  department_name: string;
  description?: string | null;
}

interface Household {
  id: string;
  household_name: string;
}

interface NewMemberFormProps {
  churchSlug: string;
  departments: Department[];
  households?: Household[];
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function NewMemberForm({
  churchSlug,
  departments,
  households = [],
}: NewMemberFormProps) {
  const [state, formAction, isPending] = useActionState(createMemberAction, null);
  const [sendInvite, setSendInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);

  useEffect(() => {
    if (!state?.ok || !state.memberId || !sendInvite) return;

    setInvitePending(true);
    setInviteError(null);

    createMemberInviteAction(churchSlug, state.memberId)
      .then((result) => {
        if (result.ok) {
          const fullUrl = window.location.origin + result.path;
          setInviteUrl(fullUrl);
        } else {
          setInviteError(result.error);
        }
      })
      .catch(() => {
        setInviteError("Invite link could not be generated.");
      })
      .finally(() => {
        setInvitePending(false);
      });
  }, [state]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Member</h2>
          <p className="text-sm text-slate-600">
            Create a member record now. Staff can enter essentials first, and the member can complete missing profile details later.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/members`}
          className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Members
        </Link>
      </div>

      <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="churchSlug" value={churchSlug} />

        {state && !state.ok && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state && state.ok && (
          <div className="space-y-3">
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {state.message ?? "Member created successfully."}
            </div>

            {invitePending && (
              <p className="text-sm text-slate-500">Generating invite link...</p>
            )}

            {inviteUrl && (
              <CopyableLink
                url={inviteUrl}
                label="Portal invite link"
                showWhatsApp={true}
              />
            )}

            {inviteError && (
              <InlineAlert
                variant="warning"
                message={`Member created, but the invite link could not be generated. You can send an invite from the Invites & Access page. Error: ${inviteError}`}
              />
            )}
          </div>
        )}

        <Section
          title="Basic Identity"
          description="These are the core details needed to create the member record."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-700">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-700">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Optional custom display name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="memberCode" className="mb-1 block text-sm font-medium text-slate-700">
                Member Code
              </label>
              <input
                id="memberCode"
                name="memberCode"
                type="text"
                placeholder="Leave blank to auto-generate"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Membership"
          description="Church membership details and initial organizational placement."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="membershipStatus" className="mb-1 block text-sm font-medium text-slate-700">
                Membership Status
              </label>
              <select
                id="membershipStatus"
                name="membershipStatus"
                defaultValue="active"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="visitor">Visitor</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            <div>
              <label htmlFor="membershipType" className="mb-1 block text-sm font-medium text-slate-700">
                Membership Type
              </label>
              <select
                id="membershipType"
                name="membershipType"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                <option value="regular">Regular</option>
                <option value="adherent">Adherent</option>
                <option value="child">Child</option>
                <option value="youth">Youth</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateJoined" className="mb-1 block text-sm font-medium text-slate-700">
                Date Joined
              </label>
              <input
                id="dateJoined"
                name="dateJoined"
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="baptismDate" className="mb-1 block text-sm font-medium text-slate-700">
                Baptism Date
              </label>
              <input
                id="baptismDate"
                name="baptismDate"
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="previousChurch" className="mb-1 block text-sm font-medium text-slate-700">
                Previous Church
              </label>
              <input
                id="previousChurch"
                name="previousChurch"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-slate-700">
                Initial Department
              </label>
              <select
                id="departmentId"
                name="departmentId"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No department yet</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
              {departments.length === 0 && (
                <p className="mt-1 text-sm text-slate-500">No active departments found yet.</p>
              )}
            </div>
          </div>
        </Section>

        <Section
          title="Personal Details"
          description="Useful profile data for church records and future profile completion."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-medium text-slate-700">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="gender" className="mb-1 block text-sm font-medium text-slate-700">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="maritalStatus" className="mb-1 block text-sm font-medium text-slate-700">
                Marital Status
              </label>
              <select
                id="maritalStatus"
                name="maritalStatus"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
                <option value="separated">Separated</option>
              </select>
            </div>

            <div>
              <label htmlFor="profession" className="mb-1 block text-sm font-medium text-slate-700">
                Profession
              </label>
              <input
                id="profession"
                name="profession"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Contact"
          description="Location and contact details for follow-up and church operations."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-slate-700">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Household and Emergency"
          description="Connect the member to a household and capture emergency details when available."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="householdId" className="mb-1 block text-sm font-medium text-slate-700">
                Household
              </label>
              <select
                id="householdId"
                name="householdId"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No household yet</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.household_name}
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
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

            <div>
              <label htmlFor="emergencyContactName" className="mb-1 block text-sm font-medium text-slate-700">
                Emergency Contact Name
              </label>
              <input
                id="emergencyContactName"
                name="emergencyContactName"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="emergencyContactPhone" className="mb-1 block text-sm font-medium text-slate-700">
                Emergency Contact Phone
              </label>
              <input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Additional"
          description="Optional notes and transfer metadata."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="transferInDate" className="mb-1 block text-sm font-medium text-slate-700">
                Transfer In Date
              </label>
              <input
                id="transferInDate"
                name="transferInDate"
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="transferOutDate" className="mb-1 block text-sm font-medium text-slate-700">
                Transfer Out Date
              </label>
              <input
                id="transferOutDate"
                name="transferOutDate"
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            id="sendPortalInvite"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
            className="h-4 w-4 rounded border"
          />
          <label htmlFor="sendPortalInvite" className="text-sm text-slate-700">
            Send a portal invite to this member after creating their record
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/c/${churchSlug}/members`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
