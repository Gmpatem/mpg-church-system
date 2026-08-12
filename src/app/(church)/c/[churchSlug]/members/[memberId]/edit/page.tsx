import { redirect } from "next/navigation";
import { requireChurchRole } from "@/features/access/queries";

interface MemberEditPageProps {
  params: Promise<{ churchSlug: string; memberId: string }>;
}

export default async function MemberEditPage({ params }: MemberEditPageProps) {
  const { churchSlug, memberId } = await params;
  await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);

  redirect(`/c/${churchSlug}/members/${memberId}?editor=1`);
}
