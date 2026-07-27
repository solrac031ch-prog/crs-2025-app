const CACHE_PREFIX = "crs-hph-";
const CACHE_NAME = "crs-hph-disabled-v71";

async function clearCrsCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key === CACHE_NAME || key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(clearCrsCaches());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    clearCrsCaches()
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
