"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateMemberAction } from "@/features/members/actions";

interface Household {
  id: string;
  household_name: string;
}

interface EditMemberFormProps {
  churchSlug: string;
  member: any;
  households: Household[];
}

export function EditMemberForm({ churchSlug, member, households }: EditMemberFormProps) {
  const [state, formAction, isPending] = useActionState(updateMemberAction, null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Member</h2>
          <p className="text-sm text-gray-600">Update church-scoped member information safely.</p>
        </div>

        <Link
          href={`/c/${churchSlug}/members/${member.id}`}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Back to Profile
        </Link>
      </div>

      <form action={formAction} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="churchSlug" value={churchSlug} />
        <input type="hidden" name="memberId" value={member.id} />

        {state && !state.ok ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state && state.ok ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {state.message ?? "Member updated successfully."}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input id="firstName" name="firstName" defaultValue={member.first_name ?? ""} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input id="lastName" name="lastName" defaultValue={member.last_name ?? ""} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="memberCode" className="block text-sm font-medium text-gray-700 mb-1">Member Code</label>
            <input id="memberCode" name="memberCode" defaultValue={member.member_code ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" name="email" type="email" defaultValue={member.email ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input id="phone" name="phone" defaultValue={member.phone ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select id="gender" name="gender" defaultValue={member.gender ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="membershipStatus" className="block text-sm font-medium text-gray-700 mb-1">Membership Status</label>
            <select id="membershipStatus" name="membershipStatus" defaultValue={member.membership_status ?? "active"} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="visitor">Visitor</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
          <div>
            <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
            <select id="membershipType" name="membershipType" defaultValue={member.membership_type ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              <option value="regular">Regular</option>
              <option value="adherent">Adherent</option>
              <option value="child">Child</option>
              <option value="youth">Youth</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label htmlFor="dateJoined" className="block text-sm font-medium text-gray-700 mb-1">Date Joined</label>
            <input id="dateJoined" name="dateJoined" type="date" defaultValue={member.date_joined ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={member.date_of_birth ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="householdId" className="block text-sm font-medium text-gray-700 mb-1">Household</label>
            <select id="householdId" name="householdId" defaultValue={member.household_id ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No household</option>
              {households.map((household) => (
                <option key={household.id} value={household.id}>{household.household_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
            <select id="maritalStatus" name="maritalStatus" defaultValue={member.marital_status ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
              <option value="separated">Separated</option>
            </select>
          </div>
          <div>
            <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
            <input id="profession" name="profession" defaultValue={member.profession ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input id="city" name="city" defaultValue={member.city ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input id="country" name="country" defaultValue={member.country ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="address" name="address" rows={3} defaultValue={member.address ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="notes" name="notes" rows={4} defaultValue={member.notes ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/c/${churchSlug}/members/${member.id}`} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}