export type MemberOnboardingChurchSummary = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  default_language: "en" | "fr";
};

export type MemberOnboardingPageData = {
  church: MemberOnboardingChurchSummary;
};
