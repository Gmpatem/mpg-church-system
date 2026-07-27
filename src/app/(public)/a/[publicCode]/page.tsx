import { PublicAttendanceScan } from "@/features/attendance/components/PublicAttendanceScan";
import { getPublicAttendanceScanData } from "@/features/attendance/queries";
import { normalizeAttendancePublicCode } from "@/features/attendance/qr";

export const dynamic = "force-dynamic";

interface PublicAttendancePageProps {
  params: Promise<{ publicCode: string }>;
}

export default async function PublicAttendancePage({ params }: PublicAttendancePageProps) {
  const { publicCode } = await params;
  const data = await getPublicAttendanceScanData(normalizeAttendancePublicCode(publicCode));

  return <PublicAttendanceScan data={data} />;
}
