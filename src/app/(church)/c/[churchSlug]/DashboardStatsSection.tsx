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
    },
    {
      label: "Households",
      value: householdsCount ?? 0,
      hint: "Family grouping",
      href: `/c/${churchSlug}/households`,
    },
    {
      label: "Departments",
      value: departmentsCount ?? 0,
      hint: "Active ministries",
      href: `/c/${churchSlug}/departments`,
    },
    {
      label: "Pending Work",
      value: pendingWork,
      hint: "Approvals + requests",
      href: `/c/${churchSlug}/approvals`,
    },
  ];

  return (
    <section className="mobile-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="block">
          <WorkspaceStatCard
            label={card.label}
            value={card.value}
            hint={card.hint}
          />
        </Link>
      ))}
    </section>
  );
}
