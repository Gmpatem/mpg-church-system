import { getTreasuryWorkspaceBootstrap, getMembersAlreadyTithedThisWeek } from "@/features/treasury/queries";
import { TreasuryWorkspace } from "./components/TreasuryWorkspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface TreasuryPageProps {
  params: Promise<{ churchSlug: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function TreasuryPage({ params }: TreasuryPageProps) {
  const { churchSlug } = await params;
  const t = await getTranslations();

  const [data, alreadyTithedIds] = await Promise.all([
    getTreasuryWorkspaceBootstrap(churchSlug),
    getMembersAlreadyTithedThisWeek(churchSlug),
  ]);

  return (
    <div className="space-y-6">
      <TreasuryWorkspace
        churchSlug={churchSlug}
        dashboard={data.dashboard}
        recentInflows={data.recentInflows}
        recentOutflows={data.recentOutflows}
        formOptions={data.formOptions}
        alreadyTithedIds={alreadyTithedIds}
      />
    </div>
  );
}
