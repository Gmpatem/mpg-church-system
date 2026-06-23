import { getTreasuryWorkspaceBootstrap, getMembersAlreadyTithedThisWeek } from "@/features/treasury/queries";
import { TreasuryWorkspace } from "./components/TreasuryWorkspace";

interface TreasuryPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function TreasuryPage({ params, searchParams }: TreasuryPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};

  const [data, alreadyTithedIds] = await Promise.all([
    getTreasuryWorkspaceBootstrap(churchSlug),
    getMembersAlreadyTithedThisWeek(churchSlug),
  ]);

  return (
    <div className="min-w-0">
      <TreasuryWorkspace
        churchSlug={churchSlug}
        data={data}
        alreadyTithedIds={alreadyTithedIds}
        initialTab={pickSingle(filters.tab)}
        initialView={pickSingle(filters.view)}
        initialPeriod={pickSingle(filters.period)}
        initialFrom={pickSingle(filters.from)}
        initialTo={pickSingle(filters.to)}
        initialEntityId={pickSingle(filters.entityId)}
        initialRequestSearch={pickSingle(filters.q)}
        initialRequestStatus={pickSingle(filters.status)}
        initialAuditSearch={pickSingle(filters.q)}
        initialAuditEntityType={pickSingle(filters.entityType)}
        initialAuditActionType={pickSingle(filters.actionType)}
        initialAuditChangedBy={pickSingle(filters.changedBy)}
      />
    </div>
  );
}
