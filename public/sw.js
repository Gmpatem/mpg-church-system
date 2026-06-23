const CACHE_PREFIX = "mpg-church-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const IS_LOCALHOST = LOCAL_HOSTNAMES.has(self.location.hostname);
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

// Install: cache shell assets
self.addEventListener("install", (event) => {
  if (IS_LOCALHOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && (IS_LOCALHOST || key !== CACHE_NAME))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for pages
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external origins
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Never intercept local development or Next.js build chunks.
  if (IS_LOCALHOST || url.pathname.startsWith("/_next/") || url.pathname === "/sw.js") {
    return;
  }

  // API routes: always network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Static assets (JS, CSS, fonts, images, SVG): cache-first
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // HTML navigations: network-first, fallback to cache, then offline.html
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"))
            .then((fallback) => fallback || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || fetch(request)))
  );
});
