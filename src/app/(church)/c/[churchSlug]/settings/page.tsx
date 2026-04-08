import { createClient } from "@/lib/supabase/server";
import { WorkspaceHero } from "@/components/workspace";
import { SettingsTabs } from "./SettingsTabs";

interface SettingsPageProps {
  params: { churchSlug: string };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
        title="Church Settings"
        description="Manage your church profile, preferences, and security."
      />
      <SettingsTabs church={church} />
    </div>
  );
}
