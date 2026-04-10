import { createClient } from "@/lib/supabase/server";
import { 
  UserPlus, 
  Calendar, 
  Wallet, 
  Building2,
  Home,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface DashboardActivityFeedProps {
  churchId: string;
  churchSlug: string;
}

interface ActivityItem {
  id: string;
  type: "member" | "event" | "treasury" | "department" | "household";
  title: string;
  description: string;
  timestamp: string;
  link: string;
}

const activityIcons = {
  member: { icon: UserPlus, color: "bg-blue-100 text-blue-600" },
  event: { icon: Calendar, color: "bg-amber-100 text-amber-600" },
  treasury: { icon: Wallet, color: "bg-emerald-100 text-emerald-600" },
  department: { icon: Building2, color: "bg-violet-100 text-violet-600" },
  household: { icon: Home, color: "bg-cyan-100 text-cyan-600" },
};

function formatActivityTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 5) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function DashboardActivityFeed({ churchId, churchSlug }: DashboardActivityFeedProps) {
  const supabase = await createClient();

  // Fetch recent activity from multiple sources
  const [
    { data: recentMembers },
    { data: recentEvents },
    { data: recentTreasury },
    { data: recentDepartments },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("id, first_name, last_name, created_at")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("church_events")
      .select("id, title, created_at, start_datetime")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("treasury_inflows")
      .select("id, description, amount, created_at")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("church_departments")
      .select("id, department_name, created_at")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  // Combine and sort activities
  const activities: ActivityItem[] = [
    ...(recentMembers?.map((m) => ({
      id: `member-${m.id}`,
      type: "member" as const,
      title: "New member added",
      description: `${m.first_name} ${m.last_name}`,
      timestamp: m.created_at,
      link: `/c/${churchSlug}/members/${m.id}`,
    })) ?? []),
    ...(recentEvents?.map((e) => ({
      id: `event-${e.id}`,
      type: "event" as const,
      title: "Event scheduled",
      description: e.title,
      timestamp: e.created_at,
      link: `/c/${churchSlug}/events`,
    })) ?? []),
    ...(recentTreasury?.map((t) => ({
      id: `treasury-${t.id}`,
      type: "treasury" as const,
      title: "Treasury entry recorded",
      description: t.description || "Unnamed entry",
      timestamp: t.created_at,
      link: `/c/${churchSlug}/treasury`,
    })) ?? []),
    ...(recentDepartments?.map((d) => ({
      id: `dept-${d.id}`,
      type: "department" as const,
      title: "Department created",
      description: d.department_name,
      timestamp: d.created_at,
      link: `/c/${churchSlug}/departments`,
    })) ?? []),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <div className="mobile-fade-up rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Recent Activity</h2>
          <p className="mt-0.5 text-sm text-slate-500">Latest actions across your church</p>
        </div>
      </div>

      <div className="p-5">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ArrowRight className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">No recent activity</p>
            <p className="mt-1 text-xs text-slate-400">Actions will appear here as you use the system</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const { icon: Icon, color } = activityIcons[activity.type];
              return (
                <Link
                  key={activity.id}
                  href={activity.link}
                  className="mobile-touch-feedback group flex items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-950">{activity.title}</p>
                    <p className="truncate text-xs text-slate-500">{activity.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatActivityTime(activity.timestamp)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
