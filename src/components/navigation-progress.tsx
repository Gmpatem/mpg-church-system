"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
    setLoading(true);
    completeTimer.current = setTimeout(() => setLoading(false), 100);
    return () => {
      if (completeTimer.current) clearTimeout(completeTimer.current);
    };
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed left-0 top-0 z-50 h-[2px] bg-slate-200",
        "transition-all ease-out",
        loading
          ? "w-4/5 opacity-100 duration-[400ms]"
          : "w-full opacity-0 duration-200",
      ].join(" ")}
    />
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
