const CACHE_NAME = "fd-app-v12"

const SCOPE = new URL(self.registration.scope)
const CORE = [
  SCOPE.href,
  new URL("index.html", SCOPE).href,
  new URL("manifest.webmanifest", SCOPE).href,
  new URL("logo.png", SCOPE).href,
  new URL("android-chrome-192x192.png", SCOPE).href,
  new URL("android-chrome-512x512.png", SCOPE).href,
  new URL("apple-touch-icon.png", SCOPE).href
]

const preCache = async () => {
  const cache = await caches.open(CACHE_NAME)
  await Promise.all(CORE.map(async (u) => {
    try{
      const res = await fetch(u, { cache: "no-cache" })
      if (res && res.ok) await cache.put(u, res.clone())
    }catch{}
  }))
}

self.addEventListener("install", (event) => {
  event.waitUntil(preCache().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle same-origin and inside scope
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith(SCOPE.pathname)) return

  const indexUrl = new URL("index.html", SCOPE).href
  const scopePath = SCOPE.pathname.endsWith("/") ? SCOPE.pathname : (SCOPE.pathname + "/")

  // Network-first for navigations so updates show up
  const isNav = req.mode === "navigate" || url.pathname === scopePath || url.href === indexUrl
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(indexUrl)))
    )
    return
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(req, copy))
        return res
      })
    })
  )
})
