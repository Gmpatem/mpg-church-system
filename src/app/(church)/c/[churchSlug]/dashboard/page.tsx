import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceHero } from "@/components/workspace";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";
import { OfficeAttentionStrip } from "@/features/office/components/OfficeAttentionStrip";
import { DashboardStatsSection } from "../DashboardStatsSection";
import { DashboardRecentSection } from "../DashboardRecentSection";
import { DashboardActivityFeed } from "../DashboardActivityFeed";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

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

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

async function OfficeAttentionStripAsync({ churchSlug }: { churchSlug: string }) {
  const supabase = await createClient();
  const { data: church } = await supabase
    .from("churches")
    .select("id")
    .eq("slug", churchSlug)
    .single();

  if (!church) return null;

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
  const t = await getTranslations();

  const { data: church } = await supabase
    .from("churches")
    .select("id, name, slug")
    .eq("slug", churchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!church) {
    redirect("/create-church");
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <WorkspaceRouteStateBridge
        churchSlug={churchSlug}
        moduleKey="dashboard"
        prefetchHrefs={[
          `/c/${churchSlug}/members`,
          `/c/${churchSlug}/treasury`,
          `/c/${churchSlug}/reports`,
          `/c/${churchSlug}/events`,
        ]}
      />

      <WorkspaceHero
        size="compact"
        eyebrow={t.pages.dashboard.eyebrow}
        title={church.name ?? churchSlug}
        description="Executive operations view for members, ministry activity, events, and church follow-up work."
        badges={[t.pages.dashboard.liveWorkspace, "Operations overview"]}
        actions={[
          { label: t.pages.dashboard.manageMembers, href: `/c/${churchSlug}/members`, variant: "primary" },
          { label: t.pages.dashboard.openEvents, href: `/c/${churchSlug}/events`, variant: "secondary" },
          { label: t.pages.dashboard.openReports, href: `/c/${churchSlug}/reports`, variant: "secondary" },
        ]}
      />

      <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-slate-200" />}>
        <OfficeAttentionStripAsync churchSlug={churchSlug} />
      </Suspense>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-slate-200" />}>
        <DashboardStatsSection churchId={church.id} churchSlug={churchSlug} />
      </Suspense>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-slate-200" />}>
          <DashboardRecentSection churchId={church.id} churchSlug={churchSlug} />
        </Suspense>

        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-slate-200" />}>
          <DashboardActivityFeed churchId={church.id} churchSlug={churchSlug} />
        </Suspense>
      </div>
    </div>
  );
}
