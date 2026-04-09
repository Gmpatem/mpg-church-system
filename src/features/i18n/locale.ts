import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "./I18nProvider";

/**
 * Locale resolution priority:
 * 1. Cookie (manual user choice)
 * 2. User profile preferred_language (if authenticated)
 * 3. Church default_language (if church context exists)
 * 4. Accept-Language header
 * 5. Fallback to "en"
 */

// Parse Accept-Language header to find best match
function parseAcceptLanguage(acceptLanguage: string | null): Language {
  if (!acceptLanguage) return "en";
  
  // Parse languages with quality values
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, quality = "1"] = lang.trim().split(";q=");
      return { code: code.trim().toLowerCase(), quality: parseFloat(quality) };
    })
    .sort((a, b) => b.quality - a.quality);
  
  // Find first French or English match
  for (const { code } of languages) {
    if (code.startsWith("fr")) return "fr";
    if (code.startsWith("en")) return "en";
  }
  
  return "en";
}

// Get locale from cookie
async function getLocaleFromCookie(): Promise<Language | null> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("preferred_language")?.value;
  
  if (langCookie && (langCookie === "en" || langCookie === "fr")) {
    return langCookie;
  }
  
  // Also check localStorage indicator cookie
  const localStorageLang = cookieStore.get("ls_preferred_language")?.value;
  if (localStorageLang && (localStorageLang === "en" || localStorageLang === "fr")) {
    return localStorageLang;
  }
  
  return null;
}

// Get locale from Accept-Language header
async function getLocaleFromHeader(): Promise<Language> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  return parseAcceptLanguage(acceptLanguage);
}

// Get user's preferred language from profile
async function getUserPreferredLanguage(): Promise<Language | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .maybeSingle();
    
    if (error || !data?.preferred_language) return null;
    
    const lang = data.preferred_language;
    if (lang === "en" || lang === "fr") return lang;
    
    return null;
  } catch {
    return null;
  }
}

// Get church default language
export async function getChurchDefaultLanguage(churchSlug: string): Promise<Language | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("churches")
      .select("default_language")
      .eq("slug", churchSlug)
      .maybeSingle();
    
    if (error || !data?.default_language) return null;
    
    const lang = data.default_language;
    if (lang === "en" || lang === "fr") return lang;
    
    return null;
  } catch {
    return null;
  }
}

// Main locale resolver
export async function resolveLocale(options?: {
  churchSlug?: string;
}): Promise<{
  language: Language;
  source: "cookie" | "profile" | "church" | "header" | "default";
}> {
  // 1. Check cookie first (manual user choice)
  const cookieLocale = await getLocaleFromCookie();
  if (cookieLocale) {
    return { language: cookieLocale, source: "cookie" };
  }
  
  // 2. Check user profile (if authenticated)
  const userLocale = await getUserPreferredLanguage();
  if (userLocale) {
    return { language: userLocale, source: "profile" };
  }
  
  // 3. Check church default (if church context exists)
  if (options?.churchSlug) {
    const churchLocale = await getChurchDefaultLanguage(options.churchSlug);
    if (churchLocale) {
      return { language: churchLocale, source: "church" };
    }
  }
  
  // 4. Check Accept-Language header
  const headerLocale = await getLocaleFromHeader();
  if (headerLocale) {
    return { language: headerLocale, source: "header" };
  }
  
  // 5. Fallback to English
  return { language: "en", source: "default" };
}

// Utility to update user preferred language
export async function updateUserPreferredLanguage(language: Language): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: language, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    
    if (error) {
      return { ok: false, error: error.message };
    }
    
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
