import { createClient } from "@/lib/supabase/server";
import { ChurchWorkspaceHeader } from "@/components/church-workspace";
import { SettingsTabs } from "./SettingsTabs";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";
import { getStaffSelfProfile } from "@/features/staff-profile/queries";

interface SettingsPageProps {
  params: Promise<{ churchSlug: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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

  const staffProfile = await getStaffSelfProfile(churchSlug);

  return (
    <div className="space-y-6">
      <ChurchWorkspaceHeader
        eyebrow="Settings"
        title={t.pages.settings.title}
        description={t.pages.settings.description}
      />
      <SettingsTabs church={church} staffProfile={staffProfile} />
    </div>
  );
}
