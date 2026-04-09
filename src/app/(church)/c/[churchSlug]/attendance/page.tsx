import { createClient } from "@/lib/supabase/server";
import { WorkspaceHero } from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface AttendancePageProps {
  params: Promise<{ churchSlug: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { churchSlug } = await params;
  const supabase = await createClient();
  const t = await getTranslations();

  const { data: church } = await supabase
    .from("churches")
    .select("*")
    .eq("slug", churchSlug)
    .single();

  if (!church) {
    return null;
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title={t.pages.attendance.title}
        description={t.pages.attendance.description}
      />

      <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">{t.pages.attendance.comingSoon}</p>
        <p className="mt-1 text-xs text-slate-400">{t.pages.attendance.underDevelopment}</p>
      </div>
    </div>
  );
}
