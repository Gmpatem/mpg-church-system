import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Cross-request cache for church lookup by slug.
 * HIGH IMPACT: Church metadata is stable reference data that rarely changes.
 * 
 * Safety rationale:
 * - Scoped to specific churchSlug (tenant isolation)
 * - No user-specific data (same for all users of this church)
 * - Stable reference data (church settings don't change frequently)
 * - Narrow select (12 fields) minimizes payload
 * 
 * Cache configuration:
 * - Scope: Cross-request (unstable_cache)
 * - TTL: 5 minutes (300 seconds) - balances freshness with performance
 * - Tags: ['churches'] for targeted invalidation when needed
 * 
 * @param churchSlug - Unique church identifier (tenant scope)
 * @returns Church metadata or null if not found
 */
export const getChurchBySlug = unstable_cache(
  async (churchSlug: string) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("churches")
      .select("id, slug, name, is_active, default_language, timezone, country, city, address, phone, email, logo_url")
      .eq("slug", churchSlug)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return data;
  },
  // Cache key parts - enables cache key generation per church
  ['church-by-slug'],
  // Cache options
  { 
    revalidate: 300, // 5 minutes
    tags: ['churches'] 
  }
);
