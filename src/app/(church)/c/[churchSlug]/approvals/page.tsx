import { ApprovalsInbox } from "@/features/approvals/components/ApprovalsInbox";
import { getApprovalsInboxData } from "@/features/approvals/inbox";
import { WorkspaceHero } from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

type PageProps = {
  params: Promise<{
    churchSlug: string;
  }>;
  searchParams?: Promise<{
    module?: string;
    status?: string;
    stage?: string;
  }>;
};

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function ApprovalsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const t = await getTranslations();

  const data = await getApprovalsInboxData(params.churchSlug, {
    module: searchParams.module,
    status: searchParams.status,
    stage: searchParams.stage,
  });

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title={t.pages.approvals.title}
        description={t.pages.approvals.description}
      />
      <ApprovalsInbox
        churchSlug={params.churchSlug}
        data={data}
      />
    </div>
  );
}
