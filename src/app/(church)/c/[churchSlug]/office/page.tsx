import { getOfficeWorkspaceData } from "@/features/office/queries";
import { OfficeWorkspace } from "@/features/office/components/OfficeWorkspace";
import { WorkspaceHero } from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface OfficePageProps {
  params: Promise<{ churchSlug: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function OfficePage({ params }: OfficePageProps) {
  const { churchSlug } = await params;
  const t = await getTranslations();
  const data = await getOfficeWorkspaceData(churchSlug);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title={t.pages.office.title}
        description={t.pages.office.description}
      />
      <OfficeWorkspace
        churchSlug={churchSlug}
        data={data}
      />
    </div>
  );
}
