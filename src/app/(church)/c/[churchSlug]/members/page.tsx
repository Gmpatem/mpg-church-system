import { getMembersWorkspaceData } from "@/features/members/queries";
import { MembersWorkspaceUnified } from "./components/MembersWorkspaceUnified";

interface MembersPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};

  const data = await getMembersWorkspaceData(churchSlug, {
    q: pickSingle(filters.q),
    status: pickSingle(filters.status),
    departmentId: pickSingle(filters.departmentId),
    departmentAssignmentStatus: pickSingle(filters.departmentAssignmentStatus),
  });

  return <MembersWorkspaceUnified churchSlug={churchSlug} data={data} />;
}




