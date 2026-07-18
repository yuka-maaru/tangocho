const CACHE_NAME = "tangocho-cache-v2";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Never cache API calls — always go straight to the network.
  if (req.url.includes("api.anthropic.com") || req.url.includes("generativelanguage.googleapis.com")) {
    return;
  }

  // App shell: network-first, so updated files (like this one, or index.html)
  // are picked up on the very next reload instead of being stuck behind a
  // stale cache. Falls back to the cache only when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && req.method === "GET") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
