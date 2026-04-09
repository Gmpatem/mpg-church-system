"use client";

import { useEffect, useState } from "react";

export interface TreasuryMemberOption {
  id: string;
  display_name?: string | null;
  first_name: string;
  last_name: string;
  member_code?: string | null;
}

export function useTreasuryMembers(churchSlug: string, enabled: boolean) {
  const [members, setMembers] = useState<TreasuryMemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || loaded || loading) return;

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/churches/${churchSlug}/treasury/members`, {
          method: "GET",
          credentials: "same-origin",
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.error || "Failed to load treasury members");
        }

        if (!cancelled) {
          const fetched = json.members ?? [];
          setMembers(fetched);
          if (fetched.length > 0) {
            setLoaded(true);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load treasury members");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [churchSlug, enabled, loaded, loading]);

  return {
    members,
    loading,
    loaded,
    error,
  };
}
