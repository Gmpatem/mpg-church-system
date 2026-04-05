import { redirect } from "next/navigation";

interface DashboardAliasPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function DashboardAliasPage({ params }: DashboardAliasPageProps) {
  const { churchSlug } = await params;
  redirect(`/c/${churchSlug}`);
}
