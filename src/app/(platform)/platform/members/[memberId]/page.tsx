import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ChevronLeft, House, Mail, Phone, UserRound } from "lucide-react";
import {
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformMemberById } from "@/features/platform/queries";

type MemberStatus = "active" | "inactive" | "visitor" | "transferred";

const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  visitor: "Visitor",
  transferred: "Transferred",
};

function getMemberStatusLabel(status: string | null | undefined) {
  if (!status) return "Pending";
  return MEMBER_STATUS_LABELS[status as MemberStatus] ?? "Pending";
}

function getMemberName(member: any) {
  if (member.display_name?.trim()) return member.display_name.trim();
  const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
  return full || "Unnamed member";
}

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
}

interface PageProps {
  params: Promise<{ memberId: string }>;
}

export default async function PlatformMemberDetailPage({ params }: PageProps) {
  const { memberId } = await params;
  const member = await getPlatformMemberById(memberId);

  if (!member) {
    notFound();
  }

  const church = getChurch(member.churches);

  return (
    <div className="space-y-5">
      <Link
        href="/platform/members"
        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Members
      </Link>

      <PlatformMobileHero
        eyebrow="Member Detail"
        title={getMemberName(member)}
        description="Review member contact details, household linkage, and source church context."
        badge={getMemberStatusLabel(member.membership_status)}
        actions={
          church?.slug
            ? [{ href: "/c/" + church.slug + "/members/" + member.id, label: "Open Church Record" }]
            : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Status" value={getMemberStatusLabel(member.membership_status)} hint="Membership state" />
        <PlatformMobileStatCard label="Household" value={member.household_id ? "Linked" : "None"} hint="Household assignment" />
        <PlatformMobileStatCard label="Member Code" value={member.member_code ?? "—"} hint="Internal church reference" />
        <PlatformMobileStatCard label="Joined" value={member.created_at ? new Date(member.created_at).toLocaleDateString("en-US") : "—"} hint="Record creation date" />
      </div>

      <PlatformMobileSectionCard title="Contact Information">
        <div className="space-y-3 text-sm">
          <div className="inline-flex items-center gap-2 text-slate-700">
            <UserRound className="h-4 w-4 text-slate-500" />
            {getMemberName(member)}
          </div>
          <div className="inline-flex items-center gap-2 text-slate-700">
            <Mail className="h-4 w-4 text-slate-500" />
            {member.email ?? "No email on file"}
          </div>
          <div className="inline-flex items-center gap-2 text-slate-700">
            <Phone className="h-4 w-4 text-slate-500" />
            {member.phone ?? "No phone on file"}
          </div>
          <div className="inline-flex items-center gap-2 text-slate-700">
            <House className="h-4 w-4 text-slate-500" />
            {member.household_role ?? "No household role"}
          </div>
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Source Church">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">{church?.name ?? "No church assigned"}</p>
          <p className="text-xs text-slate-500">Member records remain scoped to a specific church context.</p>
          {church?.slug ? (
            <Link
              href={"/c/" + church.slug + "/members"}
              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
            >
              <Building2 className="h-4 w-4" />
              Open Church Members
            </Link>
          ) : null}
        </div>
      </PlatformMobileSectionCard>
    </div>
  );
}
