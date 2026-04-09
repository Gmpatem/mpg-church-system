import { createClient } from "@/lib/supabase/server";
import { WorkspaceHero } from "@/components/workspace";

interface AttendancePageProps {
  params: { churchSlug: string };
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("*")
    .eq("slug", params.churchSlug)
    .single();

  if (!church) {
    return null;
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Attendance"
        description="Track event attendance for your church."
      />

      <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">Attendance tracking coming soon</p>
        <p className="mt-1 text-xs text-slate-400">This feature is under development</p>
      </div>
    </div>
  );
}
