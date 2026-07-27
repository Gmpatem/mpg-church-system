import { AttendanceWorkspace } from "@/features/attendance/components/AttendanceWorkspace";
import { getAttendanceWorkspaceData } from "@/features/attendance/queries";

export const dynamic = "force-dynamic";

interface AttendancePageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { churchSlug } = await params;
  const data = await getAttendanceWorkspaceData(churchSlug);

  return (
    <div className="min-w-0">
      <AttendanceWorkspace data={data} churchSlug={churchSlug} />
    </div>
  );
}
