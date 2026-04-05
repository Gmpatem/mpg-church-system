import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "./DashboardShell";
import { DashboardStatsSection } from "./DashboardStatsSection";
import { DashboardRecentSection } from "./DashboardRecentSection";
import { DashboardSectionLoading } from "./DashboardSectionLoading";
import { getOfficeAttentionStripData } from "@/features/office/dashboard";
import { OfficeAttentionStrip } from "@/features/office/components/OfficeAttentionStrip";

interface DashboardPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { churchSlug } = await params;
  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("id, name, slug")
    .eq("slug", churchSlug)
    .single();

  if (!church) {
    redirect("/churches");
  }

  const officeAttentionData = await getOfficeAttentionStripData(churchSlug);

  return (
    <div className="space-y-8">
      <DashboardShell churchName={church.name} churchSlug={churchSlug} />

      <OfficeAttentionStrip
        churchSlug={churchSlug}
        data={officeAttentionData}
      />

      <Suspense fallback={<DashboardSectionLoading cards={true} />}>
        <DashboardStatsSection churchId={church.id} churchSlug={churchSlug} />
      </Suspense>

      <Suspense fallback={<DashboardSectionLoading />}>
        <DashboardRecentSection churchId={church.id} churchSlug={churchSlug} />
      </Suspense>
    </div>
  );
}

