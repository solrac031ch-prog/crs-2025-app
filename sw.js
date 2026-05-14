const CACHE_NAME = "crs-hph-2025-consultoria-flujos-2026-v50";
const CONSULTORIA_SCRIPT = '<script src="./consultoria-estabilidad-2026.js?v=1"></script>\n<script src="./consultoria-llamado-2026.js?v=2"></script>\n<script src="./consultoria-flujos-2026.js?v=1"></script>';

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

function shouldInject(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/crs-2025-app/");
}

async function fetchWithConsultoria(request) {
  const response = await fetch(request, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes("consultoria-estabilidad-2026.js")) {
    html = html.replace("</body>", `${CONSULTORIA_SCRIPT}\n  </body>`);
  }
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" }
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (shouldInject(request)) {
    event.respondWith(fetchWithConsultoria(request).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(
    fetch(request, { cache: "no-store" }).catch(() => caches.match(request))
  );
});
