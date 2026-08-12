import { getAttendanceSupportData } from "@/features/ministry-operations/queries";
import { AttendanceSupportMobileTool } from "@/features/ministry-operations/components/AttendanceSupportMobileTool";

type PageProps = {
  params: Promise<{ churchSlug: string; assignmentId: string }>;
};

export default async function MemberAttendanceSupportPage({ params }: PageProps) {
  const { churchSlug, assignmentId } = await params;
  const data = await getAttendanceSupportData(churchSlug, assignmentId);
  return <AttendanceSupportMobileTool data={data} />;
}