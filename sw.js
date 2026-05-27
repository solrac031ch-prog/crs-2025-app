const CACHE_NAME = "crs-hph-global-v64";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles.css?v=40",
  "./protocolos-agiles.css?v=2",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./logo-urgencia-hph.svg",
  "./compatibilidad-global.js?v=2",
  "./jefatura-usuarios.js?v=1",
  "./ley-urgencias-data.js?v=38",
  "./app.js?v=40",
  "./arsenal-terapeutico.js?v=1",
  "./arsenal-uso-ocasional.js?v=1",
  "./protocolos-2026-ajustes.js?v=3",
  "./protocolos-agiles.js?v=5",
  "./especialidades-ui.js?v=2",
  "./especialidades-estable.js?v=2",
  "./protocolos-detalle-polish.js?v=2",
  "./directorio-telefonico.js?v=2",
  "./contenido-web.js?v=2",
  "./supabase-config.js?v=5",
  "./supabase-backend.js?v=2",
  "./supabase-jefatura-panel.js?v=3",
  "./gestion-supabase-home.js?v=1",
  "./gestion-pacientes-core.js?v=1"
];
const CACHEABLE_EXTENSIONS = /\.(?:html|css|js|mjs|json|webmanifest|svg|png|jpg|jpeg|webp|gif|ico)(?:\?|$)/i;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => (name === CACHE_NAME ? undefined : caches.delete(name)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (!CACHEABLE_EXTENSIONS.test(url.pathname + url.search)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
