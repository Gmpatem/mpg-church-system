import { getDepartmentOperationsData } from "@/features/ministry-operations/queries";
import { MinistryOperationsMobileWorkspace } from "@/features/ministry-operations/components/MinistryOperationsMobileWorkspace";

type PageProps = {
  params: Promise<{ churchSlug: string; departmentId: string }>;
};

export default async function DepartmentOperationsPage({ params }: PageProps) {
  const { churchSlug, departmentId } = await params;
  const data = await getDepartmentOperationsData(churchSlug, departmentId);
  return <MinistryOperationsMobileWorkspace data={data} />;
}