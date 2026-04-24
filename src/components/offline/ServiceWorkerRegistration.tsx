"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let aborted = false;

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
