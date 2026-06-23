import { notFound, redirect } from "next/navigation";
import { requireChurchRole } from "@/features/access/queries";

interface NewMemberPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function NewMemberPage({ params }: NewMemberPageProps) {
  const { churchSlug } = await params;

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  if (!ctx?.churchId) {
    notFound();
  }

  redirect(`/c/${churchSlug}/members?action=new`);
}
