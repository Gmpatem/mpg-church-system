import Link from "next/link";
import { WorkspaceStatCard } from "@/components/workspace";
import { createClient } from "@/lib/supabase/server";

interface DashboardStatsSectionProps {
  churchId: string;
  churchSlug: string;
}

export async function DashboardStatsSection({
  churchId,
  churchSlug,
}: DashboardStatsSectionProps) {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: membersCount },
    { count: householdsCount },
    { count: departmentsCount },
    { count: newMembersThisMonth },
    { count: pendingAccessRequests },
    { count: pendingLeadershipRequests },
    { count: announcementsNeedingPublish },
    { count: pendingEventApprovals },
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("households").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_departments").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", churchId).gte("created_at", startOfMonth.toISOString()),
    supabase.from("church_access_requests").select("id", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "pending"),
    supabase.from("department_leadership_requests").select("id", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "pending"),
    supabase.from("church_announcements").select("id", { count: "exact", head: true }).eq("church_id", churchId).in("status", ["draft", "pending_approval"]),
    supabase.from("church_events").select("id", { count: "exact", head: true }).eq("church_id", churchId).in("workflow_state", ["pending_approval", "draft"]),
  ]);

  const pendingWork =
    (pendingAccessRequests ?? 0) +
    (pendingLeadershipRequests ?? 0) +
    (announcementsNeedingPublish ?? 0) +
    (pendingEventApprovals ?? 0);

  const cards = [
    {
      label: "Members",
      value: membersCount ?? 0,
      hint: `+${newMembersThisMonth ?? 0} this month`,
      href: `/c/${churchSlug}/members`,
      tone: "default" as const,
    },
    {
      label: "Households",
      value: householdsCount ?? 0,
      hint: "Family grouping",
      href: `/c/${churchSlug}/households`,
      tone: "default" as const,
    },
    {
      label: "Departments",
      value: departmentsCount ?? 0,
      hint: "Active ministries",
      href: `/c/${churchSlug}/departments`,
      tone: "default" as const,
    },
    {
      label: "Pending Work",
      value: pendingWork,
      hint: "Approvals + requests",
      href: `/c/${churchSlug}/approvals`,
      tone: "attention" as const,
    },
  ];

  return (
    <section className="mobile-fade-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Dashboard Snapshot
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Core Church Metrics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Live member, household, ministry, and pending-work indicators.
          </p>
        </div>
        <Link
          href={`/c/${churchSlug}/reports`}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Open Reports
        </Link>
      </div>

      <div className="mobile-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <WorkspaceStatCard
              label={card.label}
              value={card.value}
              hint={card.hint}
              className={card.tone === "attention" ? "border-amber-200 bg-amber-50/40" : undefined}
              valueClassName={card.tone === "attention" ? "text-amber-900" : undefined}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
