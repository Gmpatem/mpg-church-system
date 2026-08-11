import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { Button } from "@/components/ui/button";
import {
  ChurchContentGrid,
  ChurchPageFrame,
  ChurchRightRail,
  ChurchStatusPill,
  ChurchSummaryStrip,
  ChurchWorkspaceHeader,
  ChurchWorkspacePanel,
} from "@/components/church-workspace";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import {
  getChurchHouseholds,
  getMemberById,
  getMemberLeadershipEditorData,
} from "@/features/members/queries";
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
import { MemberEditorDialog } from "./components/MemberEditorDialog";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";

interface MemberDetailPageProps {
  params: Promise<{ churchSlug: string; memberId: string }>;
  searchParams?: Promise<{ editor?: string | string[] }>;
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

function isEditorOpenParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true" || raw === "open";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-medium text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function FinanceMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

export default async function MemberDetailPage({ params, searchParams }: MemberDetailPageProps) {
  const { churchSlug, memberId } = await params;
  const query = searchParams ? await searchParams : ({} as { editor?: string | string[] });
  const t = await getTranslations();

  const [
    member,
    finance,
    attendanceSummary,
    memberDepartmentAssignments,
    memberDepartmentOptions,
    households,
    leadershipEditorData,
  ] = await Promise.all([
    getMemberById(churchSlug, memberId),
    getMemberFinancialProfile(churchSlug, memberId),
    getMemberAttendanceSummary(churchSlug, memberId),
    getMemberDepartmentAssignments(churchSlug, memberId),
    getMemberDepartmentOptions(churchSlug, memberId),
    getChurchHouseholds(churchSlug),
    getMemberLeadershipEditorData(churchSlug, memberId),
  ]);

  if (!member) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 px-6 py-10 text-sm text-red-700">
        {t.pages.memberDetail.notFound}
      </div>
    );
  }

  const memberLabel = getMemberLabel(member);
  const householdLabel =
    households.find((household: any) => household.id === member.household_id)?.household_name ??
    null;
  const addressLabel = [member.address, member.city, member.country].filter(Boolean).join(", ");
  const activeLeadershipCount = leadershipEditorData.assignments.filter(
    (assignment) => assignment.isActive
  ).length;

  return (
    <ChurchPageFrame className="flex flex-col gap-5 md:gap-6">
      <div className="hidden sm:block">
        <Breadcrumb
          items={[
            { label: t.navigation.members, href: `/c/${churchSlug}/members` },
            { label: memberLabel },
          ]}
        />
      </div>

      <ChurchWorkspaceHeader
        eyebrow={t.navigation.members}
        title={memberLabel}
        description="Profile, giving, attendance, departments, and leadership context for this member."
        meta={
          <>
            <ChurchStatusPill
              status={member.membership_status}
              label={getLabel(memberStatusLabels, member.membership_status)}
            />
            {member.member_code ? (
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {member.member_code}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" className="h-10 gap-2 rounded-lg bg-background">
              <Link href={`/c/${churchSlug}/members`}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t.pages.memberDetail.backToMembers}
              </Link>
            </Button>
            <MemberEditorDialog
              churchSlug={churchSlug}
              member={member}
              households={households}
              departmentAssignments={memberDepartmentAssignments}
              departments={memberDepartmentOptions.departments}
              leadership={leadershipEditorData}
              initialOpen={isEditorOpenParam(query.editor)}
            />
          </>
        }
      />

      <ChurchSummaryStrip
        items={[
          {
            label: t.pages.memberDetail.memberCode,
            value: member.member_code ?? "—",
            icon: <UserRound className="size-4" aria-hidden="true" />,
            muted: !member.member_code,
          },
          {
            label: t.pages.memberDetail.status,
            value: getLabel(memberStatusLabels, member.membership_status),
            icon: <ShieldCheck className="size-4" aria-hidden="true" />,
          },
          {
            label: t.pages.memberDetail.phone,
            value: member.phone ?? "—",
            icon: <Phone className="size-4" aria-hidden="true" />,
            muted: !member.phone,
          },
          {
            label: t.pages.memberDetail.email,
            value: member.email ?? "—",
            icon: <Mail className="size-4" aria-hidden="true" />,
            muted: !member.email,
          },
        ]}
      />

      <ChurchContentGrid>
        <div className="flex min-w-0 flex-col gap-5">
          <ChurchWorkspacePanel
            title={t.pages.memberDetail.financeOverview}
            description="Giving totals and recent contribution activity."
            contentClassName="p-4 sm:p-5"
          >
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FinanceMetric
                label={t.pages.memberDetail.totalTithe}
                value={formatMoney(finance?.totalTithe)}
              />
              <FinanceMetric
                label={t.pages.memberDetail.totalOffering}
                value={formatMoney(finance?.totalOffering)}
              />
              <FinanceMetric
                label={t.pages.memberDetail.totalGiving}
                value={formatMoney(finance?.totalGiving)}
              />
              <FinanceMetric
                label={t.pages.memberDetail.recentContributions}
                value={Array.isArray(finance?.recentContributions) ? finance.recentContributions.length : 0}
              />
            </div>
          </ChurchWorkspacePanel>

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

        <ChurchRightRail className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Member Snapshot</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Core profile and church lifecycle details.
            </p>
          </div>
          <dl className="px-5 py-2">
            <DetailRow label="Household" value={householdLabel ?? "—"} />
            <DetailRow label="Membership" value={member.membership_type ?? "—"} />
            <DetailRow label="Joined" value={formatDate(member.date_joined)} />
            <DetailRow label="Baptized" value={formatDate(member.baptism_date)} />
            <DetailRow label="Department Roles" value={memberDepartmentAssignments.filter((item) => item.is_active).length} />
            <DetailRow label="Leadership" value={activeLeadershipCount} />
          </dl>

          <div className="border-t border-border px-5 py-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Address
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {addressLabel || "No address on file"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              <span>Record updated {formatDate(member.updated_at)}</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <ReceiptText className="size-4" aria-hidden="true" />
              <span>{Array.isArray(finance?.recentContributions) ? finance.recentContributions.length : 0} recent contribution records</span>
            </div>
          </div>
        </ChurchRightRail>
      </ChurchContentGrid>
    </ChurchPageFrame>
  );
}
