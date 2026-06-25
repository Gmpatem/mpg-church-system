import { notFound } from "next/navigation";
import { getPublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { RegistrationWizard } from "./components/RegistrationWizard";
import { RegistrationUnavailable } from "./components/RegistrationUnavailable";

type PageProps = {
  params: Promise<{ churchSlug: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
};

function pickSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MemberJoinPage(props: PageProps) {
  const { churchSlug } = await props.params;
  const searchParams = await props.searchParams;
  const key = pickSingle(searchParams.k);

  const data = await getPublicRegistrationPageData(churchSlug);

  if (!data.church) {
    notFound();
  }

  if (!data.settings.isEnabled || !key) {
    return <RegistrationUnavailable church={data.church} hasKey={!!key} />;
  }

  return (
    <main className="min-h-screen bg-[#faf8f3]">
      <RegistrationWizard church={data.church} settings={data.settings} departments={data.departments} registrationKey={key} />
    </main>
  );
}
