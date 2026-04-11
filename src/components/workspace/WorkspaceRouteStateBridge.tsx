"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface WorkspaceRouteStateBridgeProps {
  churchSlug: string;
  moduleKey: string;
  prefetchHrefs?: string[];
  restoreQueryState?: boolean;
  persistQueryKeys?: string[];
  clearPersistedStateOnEmpty?: boolean;
}

interface PersistedQueryState {
  query: Record<string, string>;
}

function getStorageKey(churchSlug: string, moduleKey: string) {
  return `workspace-query-state:${churchSlug}:${moduleKey}`;
}

export function WorkspaceRouteStateBridge({
  churchSlug,
  moduleKey,
  prefetchHrefs = [],
  restoreQueryState = false,
  persistQueryKeys,
  clearPersistedStateOnEmpty = true,
}: WorkspaceRouteStateBridgeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const restoreAttemptedRef = useRef(false);

  const storageKey = useMemo(
    () => getStorageKey(churchSlug, moduleKey),
    [churchSlug, moduleKey]
  );

  const prefetchKey = useMemo(
    () => prefetchHrefs.join("|"),
    [prefetchHrefs]
  );

  const persistKeysKey = useMemo(
    () => (persistQueryKeys ?? []).join("|"),
    [persistQueryKeys]
  );

  useEffect(() => {
    if (!prefetchHrefs.length) return;

    const hrefs = Array.from(new Set(prefetchHrefs));
    for (const href of hrefs) {
      router.prefetch(href);
    }
  }, [router, prefetchKey, prefetchHrefs]);

  useEffect(() => {
    if (!restoreQueryState) return;

    const allowAllKeys = !persistQueryKeys || persistQueryKeys.length === 0;
    const relevantEntries = Array.from(searchParams.entries()).filter(([key]) =>
      allowAllKeys ? true : persistQueryKeys.includes(key)
    );
    const hasRelevantQuery = relevantEntries.length > 0;

    if (!restoreAttemptedRef.current) {
      restoreAttemptedRef.current = true;

      if (!hasRelevantQuery) {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw) as PersistedQueryState;
            if (parsed?.query && typeof parsed.query === "object") {
              const restoredParams = new URLSearchParams();
              for (const [key, value] of Object.entries(parsed.query)) {
                if (typeof value !== "string" || !value) continue;
                if (!allowAllKeys && !persistQueryKeys?.includes(key)) continue;
                restoredParams.set(key, value);
              }

              const nextQuery = restoredParams.toString();
              if (nextQuery) {
                router.replace(`${pathname}?${nextQuery}`, { scroll: false });
                return;
              }
            }
          }
        } catch {
          // ignore local storage parse/read errors
        }
      }
    }

    try {
      if (!hasRelevantQuery) {
        if (clearPersistedStateOnEmpty) {
          window.localStorage.removeItem(storageKey);
        }
        return;
      }

      const query: Record<string, string> = {};
      for (const [key, value] of relevantEntries) {
        if (!value) continue;
        query[key] = value;
      }

      if (Object.keys(query).length === 0) {
        if (clearPersistedStateOnEmpty) {
          window.localStorage.removeItem(storageKey);
        }
        return;
      }

      window.localStorage.setItem(storageKey, JSON.stringify({ query }));
    } catch {
      // ignore local storage write errors
    }
  }, [
    restoreQueryState,
    searchParams,
    storageKey,
    clearPersistedStateOnEmpty,
    pathname,
    router,
    persistQueryKeys,
    persistKeysKey,
  ]);

  return null;
}

