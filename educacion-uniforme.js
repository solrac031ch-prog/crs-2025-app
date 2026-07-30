(() => {
  const EDUCATION_ROUTE = "#/educacion";
  const SPOTIFY_SHOW_ID = "4Yyb5LH2H6mj9NyDVajUMQ";
  const SPOTIFY_URL = `https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`;
  const SPOTIFY_EMBED = `https://open.spotify.com/embed/show/${SPOTIFY_SHOW_ID}?utm_source=generator&theme=0`;
  const YOUTUBE_HPH = "https://youtube.com/@hospitalpadrehurtado9819";
  const CACHE_KEY = "crsPublicContentCacheV2:education";
  const CACHE_TTL = 5 * 60 * 1000;

  let remotePromise = null;
  let renderTimer = 0;

  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const clean = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const currentRoute = () => String(location.hash || "#/inicio").split("?")[0];
  const itemUrl = (item) => String(item?.eventUrl || item?.url || "").trim();

  function isPodcast(item) {
    const url = itemUrl(item);
    const text = clean(`${item?.title || ""} ${item?.category || ""}`);
    return url.includes(SPOTIFY_SHOW_ID) || text.includes("los urgencistas") || text.includes("podcast hospital padre hurtado");
  }

  function isYouTube(item) {
    const url = itemUrl(item);
    const text = clean(`${item?.title || ""} ${item?.category || ""}`);
    return /youtu\.be|youtube\.com/i.test(url) || text.includes("youtube") || text === "canal";
  }

  function sortItems(items = []) {
    return [...items].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  function staticItems() {
    return sortItems(window.CRS_STATIC_CONTENT?.education || []);
  }

  function cachedItems() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!Array.isArray(cached?.items) || Date.now() - Number(cached.savedAt || 0) > CACHE_TTL) return null;
      return sortItems(cached.items);
    } catch (_) {
      return null;
    }
  }

  function cacheItems(items) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
    } catch (_) {}
  }

  async function fetchRemoteItems() {
    if (remotePromise) return remotePromise;
    const api = window.CRS_SUPABASE;
    if (!api?.enabled?.()) return null;
    remotePromise = api.fetchContent("education")
      .then((items) => sortItems(items || []))
      .catch((error) => {
        console.warn(error?.message || error);
        return null;
      })
      .finally(() => { remotePromise = null; });
    return remotePromise;
  }

  function additionalMaterial(items) {
    return items.filter((item) => item?.title && !isPodcast(item) && !isYouTube(item));
  }

  function additionalHtml(items) {
    if (!items.length) return "";
    return `<section class="edu-section"><div class="edu-section-head"><div><span>Biblioteca docente</span><h3>Otros recursos publicados</h3><p>Material agregado desde el Centro de Gestión Jefatura.</p></div></div><div class="edu-extra-grid">${items.map((item) => {
      const href = itemUrl(item);
      return `<article class="edu-extra-card"><span>${esc(item.category || "Educación")}</span><div><h4>${esc(item.title)}</h4>${item.description ? `<p>${esc(item.description)}</p>` : ""}</div>${href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">Abrir recurso →</a>` : ""}</article>`;
    }).join("")}</div></section>`;
  }

  function markup(items) {
    const youtube = items.find(isYouTube);
    const youtubeUrl = itemUrl(youtube) || YOUTUBE_HPH;
    const extras = additionalMaterial(items);
    const procedureCount = "Videos";
    const resourceCount = Math.max(2, items.length + 1);

    return `<div class="edu-uniform-shell">
      <section class="edu-uniform-hero">
        <div class="edu-uniform-copy">
          <span class="edu-uniform-kicker">Educación médica · Urgencia Adulto HPH</span>
          <h2>Aprender rápido. Aplicar mejor.</h2>
          <p>Acceso ordenado a procedimientos, material audiovisual institucional y el podcast Los Urgencistas.</p>
        </div>
        <div class="edu-uniform-stats" aria-label="Resumen de recursos">
          <div class="edu-stat"><span>Procedimientos</span><strong>${procedureCount}</strong></div>
          <div class="edu-stat"><span>Accesos docentes</span><strong>${resourceCount}</strong></div>
        </div>
      </section>

      <section class="edu-section">
        <div class="edu-section-head"><div><span>Accesos principales</span><h3>Recursos para el turno</h3><p>Dos rutas directas, sin información innecesaria.</p></div></div>
        <div class="edu-access-grid">
          <a class="edu-access-card" href="#/procedimientos">
            <span class="edu-access-icon" aria-hidden="true">🩺</span>
            <span class="edu-access-copy"><span>Videos prácticos</span><strong>Procedimientos de urgencias</strong><small>Listado ordenado de procedimientos publicados por Jefatura.</small></span>
            <span class="edu-access-arrow" aria-hidden="true">→</span>
          </a>
          <a class="edu-access-card youtube" href="${esc(youtubeUrl)}" target="_blank" rel="noopener noreferrer">
            <span class="edu-access-icon" aria-hidden="true">▶</span>
            <span class="edu-access-copy"><span>Canal institucional</span><strong>Hospital Padre Hurtado</strong><small>Contenido audiovisual disponible en YouTube.</small></span>
            <span class="edu-access-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section class="edu-section">
        <div class="edu-section-head"><div><span>Podcast recomendado</span><h3>Los Urgencistas</h3><p>Medicina interna y decisiones clínicas durante las primeras horas de la urgencia.</p></div></div>
        <article class="edu-podcast-card">
          <div class="edu-podcast-copy">
            <span class="edu-podcast-label">● Disponible en Spotify</span>
            <h3>Los Urgencistas</h3>
            <p>Podcast docente del equipo vinculado al Hospital Padre Hurtado.</p>
            <div class="edu-podcast-actions"><a class="edu-spotify-button" href="${SPOTIFY_URL}" target="_blank" rel="noopener noreferrer">Abrir en Spotify</a></div>
          </div>
          <div class="edu-podcast-player">
            <iframe src="${SPOTIFY_EMBED}" title="Los Urgencistas en Spotify" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>
        </article>
      </section>

      ${additionalHtml(extras)}
    </div>`;
  }

  function render(items) {
    if (currentRoute() !== EDUCATION_ROUTE) return;
    const title = document.querySelector("#educationTitle");
    const eyebrow = document.querySelector("#educationPage .page-head .eyebrow");
    const content = document.querySelector("#educationContent");
    if (!content) return;

    if (title) title.textContent = "Educación médica";
    if (eyebrow) eyebrow.textContent = "Docencia y actualización";

    const signature = JSON.stringify((items || []).map((item) => [item.id, item.title, item.url, item.eventUrl, item.createdAt]));
    if (content.dataset.eduUniformSignature === signature && content.querySelector(".edu-uniform-shell")) return;
    content.innerHTML = markup(items || []);
    content.dataset.eduUniformSignature = signature;
    content.dataset.gfReadyRoute = EDUCATION_ROUTE;
  }

  async function refresh() {
    if (currentRoute() !== EDUCATION_ROUTE) return;
    const initial = cachedItems() || staticItems();
    render(initial);
    const remote = await fetchRemoteItems();
    if (currentRoute() !== EDUCATION_ROUTE || !remote) return;
    cacheItems(remote);
    render(remote);
  }

  function schedule(delay = 0) {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      renderTimer = 0;
      refresh().catch(console.error);
    }, delay);
  }

  window.addEventListener("hashchange", () => schedule());
  window.addEventListener("crs:supabase-ready", () => schedule(20));
  window.addEventListener("crs:ui-section-ready", (event) => {
    if (event.detail?.route === EDUCATION_ROUTE) schedule(0);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => schedule(), { once: true });
  else schedule();
})();