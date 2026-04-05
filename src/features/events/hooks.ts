"use client";

import { useEffect, useState } from "react";

export function useEventDepartments(churchSlug: string, enabled: boolean) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded || loading) return;

    let cancelled = false;

    async function run() {
      setLoading(true);

      const res = await fetch(`/api/churches/${churchSlug}/events/departments`);
      const json = await res.json();

      if (!cancelled) {
        setDepartments(json.departments ?? []);
        setLoaded(true);
        setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, loaded, loading, churchSlug]);

  return { departments, loading, loaded };
}
