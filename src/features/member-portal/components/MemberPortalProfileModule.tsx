import { Bell, Camera, FileText, HelpCircle, LockKeyhole, UserRound, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { signOutMemberPortalAction } from "@/features/member-portal/actions";
import type { MemberPortalProfileData } from "@/features/member-portal/types";
import { cn } from "@/lib/utils/cn";
import {
  MemberPortalAvatar,
  MemberPortalCard,
  MemberPortalListRow,
  MemberPortalSectionHeader,
} from "./MemberPortalAppPrimitives";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatDate } from "./memberPortalUiUtils";

type MemberPortalProfileModuleProps = {
  churchName: string;
  memberName: string;
  data: MemberPortalProfileData;
  unreadNotificationCount?: number;
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

function memberSince(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "Member since this year";
  return `Member since ${parsed.getFullYear()}`;
}

export function MemberPortalProfileModule({
  churchName,
  memberName,
  data,
  unreadNotificationCount = 0,
}: MemberPortalProfileModuleProps) {
  const fields = data.fields;
  const completion = completionPercent(fields);

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero
        title="My Profile"
        description="Your church member information"
        unreadNotificationCount={unreadNotificationCount}
      />

      <MemberPortalCard className="pt-4 text-center">
        <div className="relative mx-auto w-fit">
          <MemberPortalAvatar name={memberName} className="size-24" />
          <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-emerald-950 text-white shadow-sm">
            <Camera className="size-4" />
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">{memberName}</h2>
        <p className="mt-1 text-sm text-slate-600">{memberSince(fields.dateJoined)}</p>

        <div className="mt-6 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Profile completion</p>
            <p className="text-sm font-semibold text-emerald-950">{completion}%</p>
          </div>
          <Progress value={completion} className="mt-2 bg-slate-100" />
        </div>
      </MemberPortalCard>

      <ProfileRowGroup
        title="Account"
        rows={[
          { icon: UserRound, label: "Personal Information", detail: fields.email ?? fields.phone ?? "Member profile" },
          { icon: LockKeyhole, label: "Login & Security", detail: fields.memberCode ? `Code ${fields.memberCode}` : "Account access" },
          { icon: Bell, label: "Notification Preferences", detail: "Church updates" },
        ]}
      />

      <ProfileRowGroup
        title="Church"
        rows={[
          { icon: UserRound, label: "My Membership", detail: fields.membershipType ?? fields.membershipStatus },
          { icon: Users, label: "My Family", detail: fields.householdName ?? "Household not linked" },
          { icon: FileText, label: "My Documents", detail: `Joined ${formatDate(fields.dateJoined)}` },
        ]}
      />

      <ProfileRowGroup
        title="Support & About"
        rows={[{ icon: HelpCircle, label: "Help & Support", detail: churchName }]}
      />

      <form action={signOutMemberPortalAction}>
        <button
          type="submit"
          className="mobile-touch-feedback min-h-[44px] w-full rounded-[18px] border border-rose-100 bg-white px-4 py-3 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

function ProfileRowGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    icon: typeof UserRound;
    label: string;
    detail?: string | null;
  }>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <MemberPortalSectionHeader title={title} />
      <MemberPortalCard className="divide-y divide-amber-50 p-0">
        {rows.map((row) => (
          <div key={row.label} className={cn(!row.detail && "py-1")}>
            <MemberPortalListRow
              icon={row.icon}
              label={row.label}
              detail={row.detail?.trim() ? row.detail : undefined}
            />
          </div>
        ))}
      </MemberPortalCard>
    </section>
  );
}
