import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MemberOnboardingChurchSummary, MemberOnboardingPageData } from "./types";

type ChurchRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  default_language: "en" | "fr";
  is_active: boolean;
};

export async function getMemberOnboardingPageData(
  churchSlug: string
): Promise<MemberOnboardingPageData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("id, slug, name, city, country, email, phone, logo_url, default_language, is_active")
    .eq("slug", churchSlug)
    .eq("is_active", true)
    .maybeSingle<ChurchRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Church not found.");
  }

  const church: MemberOnboardingChurchSummary = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    city: data.city,
    country: data.country,
    email: data.email,
    phone: data.phone,
    logo_url: data.logo_url,
    default_language: data.default_language,
  };

  return { church };
}
