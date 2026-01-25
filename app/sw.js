const CACHE_NAME = "fd-app-v9"
const CORE = [
  "/app/",
  "/app/index.html",
  "/app/manifest.webmanifest",
  "/app/logo.png"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin /app requests
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/app/")) return;

  // Network-first for navigations so updates always show up
  const isNav = req.mode === "navigate" || url.pathname === "/app/" || url.pathname === "/app/index.html";
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/app/index.html")))
    );
    return;
  }

  // Cache-first for other app assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
