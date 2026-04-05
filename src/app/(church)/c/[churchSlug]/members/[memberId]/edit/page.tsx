import { notFound } from "next/navigation";
import { getMemberById, getChurchHouseholds } from "@/features/members/queries";
import { requireChurchRole } from "@/features/access/queries";
import { EditMemberForm } from "./EditMemberForm";

interface MemberEditPageProps {
  params: Promise<{ churchSlug: string; memberId: string }>;
}

export default async function MemberEditPage({ params }: MemberEditPageProps) {
  const { churchSlug, memberId } = await params;
  await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);

  const [member, households] = await Promise.all([
    getMemberById(churchSlug, memberId),
    getChurchHouseholds(churchSlug),
  ]);

  if (!member) {
    notFound();
  }

  return (
    <EditMemberForm
      churchSlug={churchSlug}
      member={member}
      households={households}
    />
  );
}