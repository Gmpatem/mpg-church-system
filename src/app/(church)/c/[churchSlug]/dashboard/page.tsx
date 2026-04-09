import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceHero } from "@/components/workspace";
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
    redirect("/create-church");
  }

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Church Dashboard"
        title={church.name ?? churchSlug}
        description="Central operations view for members, departments, treasury, events, and reporting."
        badges={["Live workspace"]}
        actions={[
          { label: "Manage Members", href: `/c/${churchSlug}/members`, variant: "primary" },
          { label: "Open Events", href: `/c/${churchSlug}/events`, variant: "secondary" },
          { label: "Open Reports", href: `/c/${churchSlug}/reports`, variant: "secondary" },
        ]}
      />

      <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-slate-200" />}>
        <OfficeAttentionStripAsync churchSlug={churchSlug} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Quick Links</h3>
          <div className="mt-4 grid gap-3">
            <a 
              href={`/c/${churchSlug}/members`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Members</p>
                <p className="text-sm text-slate-500">Manage church membership</p>
              </div>
            </a>
            <a 
              href={`/c/${churchSlug}/treasury`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Treasury</p>
                <p className="text-sm text-slate-500">Manage finances</p>
              </div>
            </a>
            <a 
              href={`/c/${churchSlug}/events`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Events</p>
                <p className="text-sm text-slate-500">Church events & calendar</p>
              </div>
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">System Status</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Database</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Storage</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Authentication</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
