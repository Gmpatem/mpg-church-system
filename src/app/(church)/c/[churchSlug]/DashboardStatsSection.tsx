import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function DashboardStatsSection({
  churchId,
  churchSlug,
}: {
  churchId: string;
  churchSlug: string;
}) {
  const supabase = await createClient();

  const [
    { count: membersCount },
    { count: householdsCount },
    { count: departmentsCount },
    { count: upcomingEventsCount },
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("households").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_departments").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .gte("start_datetime", new Date().toISOString()),
  ]);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Members", value: membersCount ?? 0, href: `/c/${churchSlug}/members` },
        { label: "Households", value: householdsCount ?? 0, href: `/c/${churchSlug}/households` },
        { label: "Departments", value: departmentsCount ?? 0, href: `/c/${churchSlug}/departments` },
        { label: "Upcoming Events", value: upcomingEventsCount ?? 0, href: `/c/${churchSlug}/events` },
      ].map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
