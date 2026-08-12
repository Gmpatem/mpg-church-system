import { getMemberDutyDetail } from "@/features/ministry-operations/queries";
import { MemberDutyDetail } from "@/features/ministry-operations/components/MemberDutyDetail";

type PageProps = {
  params: Promise<{ churchSlug: string; assignmentId: string }>;
};

export default async function MemberDutyDetailPage({ params }: PageProps) {
  const { churchSlug, assignmentId } = await params;
  const data = await getMemberDutyDetail(churchSlug, assignmentId);
  return <MemberDutyDetail data={data} />;
}