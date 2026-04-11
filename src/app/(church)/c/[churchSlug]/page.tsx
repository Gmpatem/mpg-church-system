import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceHero } from "@/components/workspace";
import { DashboardStatsSection } from "./DashboardStatsSection";
import { DashboardRecentSection } from "./DashboardRecentSection";
import { DashboardActivityFeed } from "./DashboardActivityFeed";
import { PageSpinner } from "@/components/feedback/PageSpinner";
import { OfficeAttentionStrip } from "@/features/office/components/OfficeAttentionStrip";

interface OfficeAttentionStripData {
  stats: {
    pendingAccessRequests: number;
    pendingLeadershipRequests: number;
    announcementsNeedingPublish: number;
    departmentEventsAwaitingApproval: number;
    todaysEvents: number;
  };
  queue: Array<{
    id: string;
    title: string;
    href: string;
  }>;
}

interface DashboardPageProps {
  params: Promise<{ churchSlug: string }>;
}

async function OfficeAttentionStripAsync({ churchSlug }: { churchSlug: string }) {
  const supabase = await createClient();
  const { data: church } = await supabase
    .from("churches")
    .select("id")
    .eq("slug", churchSlug)
    .single();

  if (!church) return null;

  // Lightweight attention data - only counts, not full workspace
  const [
    { count: pendingAccessRequests },
    { count: pendingLeadershipRequests },
    { count: announcementsNeedingPublish },
    { count: departmentEventsAwaitingApproval },
  ] = await Promise.all([
    supabase
      .from("church_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("church_id", church.id)
      .eq("status", "pending"),
    supabase
      .from("department_leadership_requests")
      .select("id", { count: "exact", head: true })
      .eq("church_id", church.id)
      .eq("status", "pending"),
    supabase
      .from("church_announcements")
      .select("id", { count: "exact", head: true })
      .eq("church_id", church.id)
      .in("status", ["draft", "pending_approval"]),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .eq("church_id", church.id)
      .in("workflow_state", ["pending_approval", "draft"]),
  ]);

  const now = new Date().toISOString();
  const startOfDay = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
  const endOfDay = new Date().toISOString().split("T")[0] + "T23:59:59.999Z";

  const { data: todaysEvents } = await supabase
    .from("church_events")
    .select("id, title, start_datetime, status")
    .eq("church_id", church.id)
    .eq("status", "scheduled")
    .gte("start_datetime", startOfDay)
    .lte("start_datetime", endOfDay)
    .order("start_datetime", { ascending: true })
    .limit(5);

  const data: OfficeAttentionStripData = {
    stats: {
      pendingAccessRequests: pendingAccessRequests ?? 0,
      pendingLeadershipRequests: pendingLeadershipRequests ?? 0,
      announcementsNeedingPublish: announcementsNeedingPublish ?? 0,
      departmentEventsAwaitingApproval: departmentEventsAwaitingApproval ?? 0,
      todaysEvents: (todaysEvents ?? []).length,
    },
    queue: [],
  };

  return <OfficeAttentionStrip churchSlug={churchSlug} data={data} />;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { churchSlug } = await params;
  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("id, name, slug")
    .eq("slug", churchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!church) {
    // Church not found or not active - redirect to create-church for consistent handling
    redirect("/create-church");
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Church Dashboard"
        title={church.name ?? churchSlug}
        description="Executive operations view for members, ministry activity, events, and church follow-up work."
        badges={["Live workspace", "Operations overview"]}
        actions={[
          { label: "Manage Members", href: `/c/${churchSlug}/members`, variant: "primary" },
          { label: "Open Events", href: `/c/${churchSlug}/events`, variant: "secondary" },
          { label: "Open Reports", href: `/c/${churchSlug}/reports`, variant: "secondary" },
        ]}
      />

      <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-slate-200" />}>
        <OfficeAttentionStripAsync churchSlug={churchSlug} />
      </Suspense>

      <Suspense fallback={<PageSpinner />}>
        <DashboardStatsSection churchId={church.id} churchSlug={churchSlug} />
      </Suspense>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Suspense fallback={<PageSpinner />}>
          <DashboardRecentSection churchId={church.id} churchSlug={churchSlug} />
        </Suspense>

        <Suspense fallback={<PageSpinner />}>
          <DashboardActivityFeed churchId={church.id} churchSlug={churchSlug} />
        </Suspense>
      </div>
    </div>
  );
}

