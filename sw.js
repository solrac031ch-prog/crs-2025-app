const CACHE_NAME = "crs-hph-2025-v38";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css?v=38",
  "./ley-urgencias-data.js?v=38",
  "./app.js?v=38",
  "./logo-urgencia-hph.svg",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./protocol-docs/decreto-34-25-oct-2022.pdf",
  "./form-docs/examenes-hph.pdf",
  "./form-docs/examenes-hph-rellenable.pdf",
  "./form-docs/ley-urgencia-activacion.pdf",
  "./form-docs/ley-urgencia-activacion-rellenable.pdf",
  "./form-docs/ley-urgencia-consentimiento.pdf",
  "./form-docs/ley-urgencia-consentimiento-rellenable.pdf",
  "./form-docs/mayo.pdf",
  "./form-docs/medicamentos-uso-ocasional.pdf",
  "./form-docs/medicamentos-uso-ocasional-rellenable.pdf",
  "./form-docs/telefonos-hph.pdf",
  "./form-docs/transfusion.pdf",
  "./form-docs/transfusion-rellenable.pdf"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const isNavigation = request.mode === "navigate";
  const isGet = request.method === "GET";
  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (isNavigation) {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  if (isGet && isSameOrigin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
