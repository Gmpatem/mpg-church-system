import { redirect } from "next/navigation";

interface HouseholdNewPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function HouseholdNewPage({ params }: HouseholdNewPageProps) {
  const { churchSlug } = await params;
  redirect(`/c/${churchSlug}/households?action=new`);
}
