const CACHE_PREFIX = "mpg-church-";
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const IS_LOCALHOST = LOCAL_HOSTNAMES.has(self.location.hostname);
const STATIC_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname);
}

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

  // Known public app assets: cache-first. Do not cache arbitrary same-origin images.
  if (isStaticAsset(url)) {
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

  // HTML navigations: network-first with an offline shell only.
  // Do not cache authenticated member/admin pages or private church data.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() =>
          caches
            .match("/offline.html")
            .then((fallback) => fallback || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // Everything else: network only. Private app data must not be written to Cache Storage.
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 })))
  );
});
