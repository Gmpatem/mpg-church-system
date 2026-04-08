import Link from "next/link";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import { getMemberById } from "@/features/members/queries";
import { getMemberFinancialProfile } from "@/features/treasury/queries";
import { MemberDepartmentsPanel } from "@/features/departments/components/MemberDepartmentsPanel";
import {
  getMemberDepartmentAssignments,
  getMemberDepartmentOptions,
} from "@/features/departments/queries";

interface MemberDetailPageProps {
  params: Promise<{ churchSlug: string; memberId: string }>;
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

  const [member, finance, memberDepartmentAssignments, memberDepartmentOptions] = await Promise.all([
    getMemberById(churchSlug, memberId),
    getMemberFinancialProfile(churchSlug, memberId),
    getMemberDepartmentAssignments(churchSlug, memberId),
    getMemberDepartmentOptions(churchSlug, memberId),
  ]);

  if (!member) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 px-6 py-10 text-sm text-red-700">
        Member not found.
      </div>
    );
  }

  const memberLabel = getMemberLabel(member);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Members", href: `/c/${churchSlug}/members` },
          { label: memberLabel },
        ]}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{memberLabel}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Member profile, finance overview, and department assignments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/c/${churchSlug}/members`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Members
          </Link>
          <Link
            href={`/c/${churchSlug}/members/${memberId}/edit`}
            className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Edit Member
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Member Code</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{member.member_code ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{getLabel(memberStatusLabels, member.membership_status)}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Phone</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{member.phone ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{member.email ?? "—"}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Finance Overview</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Tithe</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatMoney(finance?.totalTithe)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Offering</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatMoney(finance?.totalOffering)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Giving</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {formatMoney(finance?.totalGiving)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Recent Contributions</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {Array.isArray(finance?.recentContributions) ? finance.recentContributions.length : 0}
            </div>
          </div>
        </div>
      </div>

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
