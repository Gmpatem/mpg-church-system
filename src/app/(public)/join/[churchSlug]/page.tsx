import { notFound } from "next/navigation";
import { getPublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { RegistrationWizard } from "./components/RegistrationWizard";
import { RegistrationUnavailable } from "./components/RegistrationUnavailable";

type PageProps = {
  params: Promise<{ churchSlug: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
};

function pickSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return undefined;
  return value;
}

const REGISTRATION_KEY_PATTERN = /^reg_[1-9A-HJ-NP-Za-km-z]{43,44}$/;
const MALFORMED_REGISTRATION_KEY = "__malformed_registration_key__";

function normalizeRegistrationKey(value: string | string[] | undefined) {
  const rawValue = pickSingle(value);
  if (typeof rawValue !== "string") return Array.isArray(value) ? MALFORMED_REGISTRATION_KEY : "";

  const key = rawValue.trim();

  if (!key) return "";
  if (key.length > 80) return MALFORMED_REGISTRATION_KEY;
  if (!REGISTRATION_KEY_PATTERN.test(key)) return MALFORMED_REGISTRATION_KEY;

  return key;
}

export default async function MemberJoinPage(props: PageProps) {
  const { churchSlug } = await props.params;
  const searchParams = await props.searchParams;
  const key = normalizeRegistrationKey(searchParams.k);

  const data = await getPublicRegistrationPageData(churchSlug, key);

  if (!data.ok && data.reason === "church_not_found") {
    notFound();
  }

  if (!data.ok || !data.church) {
    return (
      <main className="min-h-dvh bg-[#faf8f3]">
        <div
          className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-8"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <RegistrationUnavailable church={data.church} reason={data.reason ?? "configuration_error"} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#faf8f3]">
      <div
        className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-8"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <RegistrationWizard church={data.church} settings={data.settings} departments={data.departments} registrationKey={key} />
      </div>
    </main>
  );
}
