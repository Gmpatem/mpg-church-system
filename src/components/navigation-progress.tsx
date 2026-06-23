"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const visibleRef = useRef(false);
  const mountedRef = useRef(false);
  const startedAtRef = useRef(0);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    if (completeTimer.current) clearTimeout(completeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
  }, []);

  const begin = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    startTimer.current = setTimeout(() => {
      visibleRef.current = true;
      setVisible(true);
      setWidth(18);
      requestAnimationFrame(() => setWidth(82));
    }, 120);
    fallbackTimer.current = setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
      setWidth(0);
    }, 8000);
  }, [clearTimers]);

  const complete = useCallback(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);

    if (!visibleRef.current) {
      setVisible(false);
      setWidth(0);
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const minimumVisibleTime = Math.max(0, 260 - elapsed);

    completeTimer.current = setTimeout(() => {
      setWidth(100);
      hideTimer.current = setTimeout(() => {
        visibleRef.current = false;
        setVisible(false);
        setWidth(0);
      }, 180);
    }, minimumVisibleTime);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target || anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.href === window.location.href) return;

      begin();
    };

    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", begin);

    return () => {
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", begin);
    };
  }, [begin]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    complete();
  }, [pathname, searchKey, complete]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed left-0 top-0 z-50 h-[3px] bg-primary shadow-sm",
        "transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ width: `${width}%` }}
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
