import {
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import {
  genderLabels,
  getLabel,
  maritalStatusLabels,
  memberStatusLabels,
  memberTypeLabels,
} from "@/lib/display-maps";
import { signOutMemberPortalAction } from "@/features/member-portal/actions";
import type { MemberPortalProfileData } from "@/features/member-portal/types";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatDate } from "./memberPortalUiUtils";

type MemberPortalProfileModuleProps = {
  churchName: string;
  memberName: string;
  data: MemberPortalProfileData;
};

function completionPercent(fields: MemberPortalProfileData["fields"]) {
  const values = [
    fields.fullName,
    fields.email,
    fields.phone,
    fields.address,
    fields.city,
    fields.country,
    fields.dateOfBirth,
    fields.gender,
    fields.maritalStatus,
    fields.householdName,
  ];

  const completed = values.filter((value) => (value ?? "").toString().trim()).length;
  return Math.round((completed / values.length) * 100);
}

function renderField(label: string, value: string | null | undefined) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value?.trim() ? value : "Not provided"}</p>
    </div>
  );
}

export function MemberPortalProfileModule({
  churchName,
  memberName,
  data,
}: MemberPortalProfileModuleProps) {
  const fields = data.fields;
  const completion = completionPercent(fields);

  return (
    <div className="space-y-4 sm:space-y-6">
      <MemberPortalModuleHero
        eyebrow="My Profile"
        title={memberName}
        description={`Manage your member profile, household details, and account settings for ${churchName}.`}
        badges={[`${completion}% complete`]}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">Profile completion</p>
          <p className="text-sm font-medium text-blue-700">{completion}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <WorkspaceStatCard
          label="Membership"
          value={getLabel(memberStatusLabels, fields.membershipStatus)}
          hint="Current status"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Member Type"
          value={getLabel(memberTypeLabels, fields.membershipType)}
          hint="Member category"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Member Code"
          value={fields.memberCode ?? "Not assigned"}
          hint="Church reference"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Joined"
          value={formatDate(fields.dateJoined)}
          hint="Membership date"
          valueClassName="text-xl md:text-2xl"
        />
      </div>

      <WorkspaceSectionCard
        title="Personal Information"
        description="Core identity and contact details."
        contentClassName="grid gap-3 md:grid-cols-2"
      >
        {renderField("Full name", fields.fullName)}
        {renderField("Display name", fields.displayName)}
        {renderField("Email", fields.email)}
        {renderField("Phone", fields.phone)}
        {renderField("Birth date", formatDate(fields.dateOfBirth))}
        {renderField("Gender", getLabel(genderLabels, fields.gender))}
        {renderField("Marital status", getLabel(maritalStatusLabels, fields.maritalStatus))}
        {renderField("Address", fields.address)}
        {renderField("City", fields.city)}
        {renderField("Country", fields.country)}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Church Record"
        description="Membership and household details on file."
        contentClassName="grid gap-3 md:grid-cols-2"
      >
        {renderField("Household", fields.householdName)}
        {renderField("Previous church", fields.previousChurch)}
        {renderField("Baptism date", formatDate(fields.baptismDate))}
        {renderField("Member code", fields.memberCode)}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Account"
        description="Sign out of your member portal account."
        contentClassName="space-y-3"
      >
        <form action={signOutMemberPortalAction}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Sign Out
          </button>
        </form>
      </WorkspaceSectionCard>
    </div>
  );
}

