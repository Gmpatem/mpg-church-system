import Link from "next/link";
import { ChevronRight, House, Mail, Phone, ShieldCheck, Users } from "lucide-react";
import {
  PlatformMobileAttentionStrip,
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformMembersSnapshot } from "@/features/platform/queries";

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

function getMemberStatusClass(status: string | null | undefined) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "inactive") return "border-slate-300 bg-slate-100 text-slate-600";
  if (status === "visitor") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "transferred") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-300 bg-slate-100 text-slate-600";
}

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
}

function getMemberName(member: any) {
  if (member.display_name?.trim()) return member.display_name.trim();
  const name = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
  return name || "Unnamed member";
}

export default async function PlatformMembersPage() {
  const snapshot = await getPlatformMembersSnapshot();
  const rows = snapshot.rows;

  const churchCount = new Set(
    rows
      .map((row: any) => getChurch(row.churches)?.id)
      .filter(Boolean)
  ).size;

  return (
    <div className="space-y-5">
      <PlatformMobileHero
        eyebrow="Member Signals"
        title="Cross-Church Membership Intelligence"
        description="Review membership distribution and contact coverage across churches for network oversight."
        badge={snapshot.totals.totalMembers + " members"}
        actions={[
          { href: "/platform", label: "Back to Dashboard" },
          { href: "/platform/households", label: "Open Households" },
        ]}
      />

      <PlatformMobileAttentionStrip>
        <p className="font-medium">
          {snapshot.totals.activeMembers} active members across {churchCount} churches.
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Use this as a network signal surface; member record changes remain church-scoped.
        </p>
      </PlatformMobileAttentionStrip>

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Total Members" value={snapshot.totals.totalMembers} hint="All member records" />
        <PlatformMobileStatCard label="Active" value={snapshot.totals.activeMembers} hint="Currently active" />
        <PlatformMobileStatCard label="Household Linked" value={snapshot.totals.householdLinked} hint="Members with household" />
        <PlatformMobileStatCard label="Churches" value={churchCount} hint="Churches represented" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <span className="whitespace-nowrap rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
          All Members
        </span>
        <span className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Active
        </span>
        <span className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Visitors
        </span>
        <span className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Households
        </span>
      </div>

      <PlatformMobileSectionCard title="Member List">
        <div className="space-y-2">
          {rows.length > 0 ? (
            rows.map((member: any) => {
              const church = getChurch(member.churches);
              return (
                <Link
                  key={member.id}
                  href={"/platform/members/" + member.id}
                  className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{getMemberName(member)}</p>
                      <p className="truncate text-xs text-slate-500">{church?.name ?? "Unassigned church"}</p>
                    </div>
                    <span
                      className={
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                        getMemberStatusClass(member.membership_status)
                      }
                    >
                      {getMemberStatusLabel(member.membership_status)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {member.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {member.email}
                      </span>
                    ) : null}
                    {member.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {member.phone}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <House className="h-3.5 w-3.5" />
                      {member.household_id ? "Linked household" : "No household"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      Open
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No members found in this oversight view.
            </div>
          )}
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Related Oversight Surfaces">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            href="/platform/households"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Households
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/access-control"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Access Control
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </Link>
          <Link
            href="/platform/reports"
            className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Reports
            <Users className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </PlatformMobileSectionCard>
    </div>
  );
}
