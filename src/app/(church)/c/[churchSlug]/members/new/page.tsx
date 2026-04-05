import { notFound } from "next/navigation";
import { requireChurchRole } from "@/features/access/queries";
import { getChurchDepartments } from "@/features/departments/queries";
import { getChurchHouseholds } from "@/features/households/queries";
import { NewMemberForm } from "./NewMemberForm";

interface NewMemberPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function NewMemberPage({ params }: NewMemberPageProps) {
  const { churchSlug } = await params;

  const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
  if (!ctx?.churchId) {
    notFound();
  }

  const [departments, households] = await Promise.all([
    getChurchDepartments(churchSlug),
    getChurchHouseholds(churchSlug),
  ]);

  return (
    <NewMemberForm
      churchSlug={churchSlug}
      departments={departments}
      households={households.map((household) => ({
        id: household.id,
        household_name: household.household_name,
      }))}
    />
  );
}
