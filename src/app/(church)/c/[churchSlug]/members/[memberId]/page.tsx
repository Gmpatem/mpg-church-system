import Link from "next/link";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { WorkspaceHero } from "@/components/workspace";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import { getMemberById } from "@/features/members/queries";
import { getMemberFinancialProfile } from "@/features/treasury/queries";
import { AttendanceSummaryCard } from "@/features/attendance/components/AttendanceSummaryCard";
import { getMemberAttendanceSummary } from "@/features/attendance/queries";
import { MemberDepartmentsPanel } from "@/features/departments/components/MemberDepartmentsPanel";
import {
  getMemberDepartmentAssignments,
  getMemberDepartmentOptions,
} from "@/features/departments/queries";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface MemberDetailPageProps {
  params: Promise<{ churchSlug: string; memberId: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function getMemberLabel(member: any) {
  return (
    member?.display_name ||
    [member?.first_name, member?.last_name].filter(Boolean).join(" ") ||
    member?.member_code ||
    "Member"
  );
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { churchSlug, memberId } = await params;
  const t = await getTranslations();

  const [member, finance, attendanceSummary, memberDepartmentAssignments, memberDepartmentOptions] = await Promise.all([
    getMemberById(churchSlug, memberId),
    getMemberFinancialProfile(churchSlug, memberId),
    getMemberAttendanceSummary(churchSlug, memberId),
    getMemberDepartmentAssignments(churchSlug, memberId),
    getMemberDepartmentOptions(churchSlug, memberId),
  ]);

  if (!member) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 px-6 py-10 text-sm text-red-700">
        {t.pages.memberDetail.notFound}
      </div>
    );
  }

  const memberLabel = getMemberLabel(member);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="hidden sm:block">
        <Breadcrumb
          items={[
            { label: t.navigation.members, href: `/c/${churchSlug}/members` },
            { label: memberLabel },
          ]}
        />
      </div>
      <WorkspaceHero
        size="compact"
        title={memberLabel}
        description={t.members.memberDetails}
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/c/${churchSlug}/members`}
          className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t.pages.memberDetail.backToMembers}
        </Link>
        <Link
          href={`/c/${churchSlug}/members/${memberId}/edit`}
          className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {t.pages.memberDetail.editMember}
        </Link>
      </div>

      <div className="mobile-stagger grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.memberCode}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{member.member_code ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.status}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{getLabel(memberStatusLabels, member.membership_status)}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.phone}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{member.phone ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.email}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{member.email ?? "—"}</div>
        </div>
      </div>

      <div className="mobile-fade-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">{t.pages.memberDetail.financeOverview}</h3>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.totalTithe}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatMoney(finance?.totalTithe)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.totalOffering}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatMoney(finance?.totalOffering)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.totalGiving}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatMoney(finance?.totalGiving)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{t.pages.memberDetail.recentContributions}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {Array.isArray(finance?.recentContributions) ? finance.recentContributions.length : 0}
            </div>
          </div>
        </div>
      </div>

      <AttendanceSummaryCard
        title="Attendance"
        description="Recent Sabbath attendance for this member."
        summary={attendanceSummary}
      />

      <MemberDepartmentsPanel
        churchSlug={churchSlug}
        memberId={member.id}
        memberLabel={memberLabel}
        assignments={memberDepartmentAssignments}
        departments={memberDepartmentOptions.departments}
      />
    </div>
  );
}
