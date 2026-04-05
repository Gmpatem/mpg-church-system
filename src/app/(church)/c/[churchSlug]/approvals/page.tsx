import { ApprovalsInbox } from "@/features/approvals/components/ApprovalsInbox";
import { getApprovalsInboxData } from "@/features/approvals/inbox";

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

export default async function ApprovalsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};

  const data = await getApprovalsInboxData(params.churchSlug, {
    module: searchParams.module,
    status: searchParams.status,
    stage: searchParams.stage,
  });

  return (
    <ApprovalsInbox
      churchSlug={params.churchSlug}
      data={data}
    />
  );
}
