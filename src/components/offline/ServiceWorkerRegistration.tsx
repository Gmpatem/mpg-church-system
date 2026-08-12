"use client";

import { useEffect } from "react";

const CHURCH_CACHE_PREFIX = "mpg-church-";

function clearChurchCaches() {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  void window.caches
    .keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CHURCH_CACHE_PREFIX))
          .map((key) => window.caches.delete(key))
      )
    )
    .catch(() => {
      // Cache cleanup is best-effort only.
    });
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let aborted = false;

    if (process.env.NODE_ENV !== "production") {
      clearChurchCaches();
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (aborted) return;
        console.log("[PWA] Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        if (aborted) return;
        console.warn("[PWA] Service Worker registration failed:", error);
      });

    return () => {
      aborted = true;
    };
  }, []);

  return null;
}
