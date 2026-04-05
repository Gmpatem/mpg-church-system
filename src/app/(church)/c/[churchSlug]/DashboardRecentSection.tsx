import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function DashboardRecentSection({
  churchId,
  churchSlug,
}: {
  churchId: string;
  churchSlug: string;
}) {
  const supabase = await createClient();

  const { data: recentMembers } = await supabase
    .from("members")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Recent Members</h2>
          <p className="mt-1 text-sm text-slate-500">Newest member records in this church workspace.</p>
        </div>

        <div className="p-5">
          {!recentMembers || recentMembers.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
              No members yet. Seed or create member records to activate the dashboard.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {[member.first_name, member.last_name].filter(Boolean).join(" ") || "Unnamed member"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {member.email || member.phone || "No contact info"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {member.created_at ? new Date(member.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Jump into the core workspaces.</p>

          <div className="mt-4 grid gap-3">
            <Link href={`/c/${churchSlug}/members`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Open Members Workspace
            </Link>
            <Link href={`/c/${churchSlug}/treasury`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Open Treasury Control Center
            </Link>
            <Link href={`/c/${churchSlug}/events`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Open Events Workspace
            </Link>
            <Link href={`/c/${churchSlug}/reports`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Open Reports Workspace
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Workspace Status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dashboard sections are now streamed separately so the page feels alive sooner.
          </p>
        </div>
      </div>
    </section>
  );
}
