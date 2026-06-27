import { redirect } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { churchSlug } = await params;
  redirect(`/c/${churchSlug}/dashboard`);
}

