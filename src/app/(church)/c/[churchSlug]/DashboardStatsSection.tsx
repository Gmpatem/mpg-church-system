import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { 
  Users, 
  Home, 
  Building2, 
  Calendar, 
  Wallet,
  TrendingUp 
} from "lucide-react";

interface DashboardStatsSectionProps {
  churchId: string;
  churchSlug: string;
}

interface StatCardProps {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color: "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan";
}

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", gradient: "from-blue-600 to-cyan-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", gradient: "from-emerald-600 to-teal-500" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-600", gradient: "from-violet-600 to-purple-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", gradient: "from-amber-600 to-orange-500" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600", gradient: "from-rose-600 to-pink-500" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600", gradient: "from-cyan-600 to-blue-500" },
};

function StatCard({ label, value, href, icon, trend, color }: StatCardProps) {
  const colors = colorMap[color];
  
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Top gradient line */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${colors.gradient}`} />
      
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.text} transition-transform group-hover:scale-110`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
              {trend.value}%
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export async function DashboardStatsSection({ churchId, churchSlug }: DashboardStatsSectionProps) {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: membersCount },
    { count: householdsCount },
    { count: departmentsCount },
    { count: upcomingEventsCount },
    { count: newMembersThisMonth },
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("households").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_departments").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .gte("start_datetime", new Date().toISOString()),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const stats = [
    { 
      label: "Total Members", 
      value: membersCount ?? 0, 
      href: `/c/${churchSlug}/members`,
      icon: <Users className="h-5 w-5" />,
      color: "blue" as const,
    },
    { 
      label: "Households", 
      value: householdsCount ?? 0, 
      href: `/c/${churchSlug}/households`,
      icon: <Home className="h-5 w-5" />,
      color: "emerald" as const,
    },
    { 
      label: "Departments", 
      value: departmentsCount ?? 0, 
      href: `/c/${churchSlug}/departments`,
      icon: <Building2 className="h-5 w-5" />,
      color: "violet" as const,
    },
    { 
      label: "Upcoming Events", 
      value: upcomingEventsCount ?? 0, 
      href: `/c/${churchSlug}/events`,
      icon: <Calendar className="h-5 w-5" />,
      color: "amber" as const,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          href={stat.href}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </section>
  );
}
