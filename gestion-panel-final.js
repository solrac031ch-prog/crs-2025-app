(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const route = () => location.hash.split("?")[0] || "#/inicio";
  const CACHE_PREFIX = "crsPublicContentCacheV2:";
  const CACHE_TTL = 5 * 60 * 1000;
  const remotePromises = new Map();

  const OLD_ROUTES = {
    "#/gestion/noticias": "#/noticias",
    "#/gestion/educacion": "#/educacion",
    "#/gestion/paper": "#/paper",
    "#/gestion/procedimientos": "#/procedimientos"
  };

  const VISUALS = {
    news: ["#155e75", "#7c2d12", "Noticias"],
    education: ["#166534", "#4338ca", "Educación"],
    paper: ["#92400e", "#164e63", "Paper"],
    procedure: ["#991b1b", "#115e59", "Procedimiento"]
  };

  function notifyReady(current) {
    window.dispatchEvent(new CustomEvent("crs:ui-section-ready", {
      detail: { route: current }
    }));
  }

  function activate(pageId, activeRoute = "", eyebrowText = "") {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$('[data-route-link]').forEach((link) => link.classList.toggle("active", Boolean(activeRoute) && link.dataset.routeLink === activeRoute));
    const eyebrow = pageId === "educationPage" ? $("#educationPage .page-head .eyebrow") : $(`#${pageId} .page-head .eyebrow`);
    if (eyebrow && eyebrowText) eyebrow.textContent = eyebrowText;
  }

  function isImageUrl(url = "") {
    return /\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i.test(String(url));
  }

  function favicon(url = "") {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
    } catch (_) {
      return "";
    }
  }

  function visualImage(item, kind) {
    const candidates = [item.imageUrl, item.image_url, item.url, item.eventUrl].filter(Boolean);
    const direct = candidates.find(isImageUrl);
    if (direct) return direct;
    const linked = candidates.find((url) => /^https?:\/\//i.test(String(url)));
    if (linked && (kind === "education" || kind === "news")) return favicon(linked);
    return "";
  }

  function action(item, label) {
    const href = item.eventUrl || item.url || "";
    return href ? `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : "";
  }

  function card(item, kind) {
    const [a, b, label] = VISUALS[kind] || VISUALS.news;
    const image = visualImage(item, kind);
    const media = `<div class="gf-media" style="--gf-a:${a};--gf-b:${b}">${image ? `<img src="${esc(image)}" alt="" loading="lazy" decoding="async">` : ""}<span class="gf-tag">${esc(label)}</span><strong>${esc(item.title || label)}</strong></div>`;
    const body = `<div class="gf-body"><h3>${esc(item.title || label)}</h3><p>${esc(item.description || "")}</p>${action(item, "Abrir")}</div>`;
    return `<article class="gf-card">${media}${body}</article>`;
  }

  function monthLabel(item) {
    const value = item.month || String(item.createdAt || "").slice(0, 7);
    const [year, month] = String(value || "").split("-");
    return year && month ? `${month}/${year}` : "Sin mes";
  }

  function sortItems(items = []) {
    return [...items].sort((a, b) => String(b.createdAt || b.month || "").localeCompare(String(a.createdAt || a.month || "")));
  }

  function sortProcedures(items = []) {
    return [...items].sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "es", { sensitivity: "base" }));
  }

  function staticContent(kind) {
    const staticKey = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
    return sortItems(window.CRS_STATIC_CONTENT?.[staticKey] || []);
  }

  function readCache(kind) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(`${CACHE_PREFIX}${kind}`) || "null");
      if (!cached?.items || Date.now() - Number(cached.savedAt || 0) > CACHE_TTL) return null;
      return sortItems(cached.items);
    } catch (_) {
      return null;
    }
  }

  function writeCache(kind, items) {
    try {
      sessionStorage.setItem(`${CACHE_PREFIX}${kind}`, JSON.stringify({ savedAt: Date.now(), items }));
    } catch (_) {}
  }

  function fingerprint(items = []) {
    return JSON.stringify(items.map((item) => [
      item.id || "", item.title || "", item.description || "", item.month || "",
      item.url || "", item.eventUrl || "", item.imageUrl || item.image_url || "", item.createdAt || ""
    ]));
  }

  async function remoteContent(kind) {
    const api = window.CRS_SUPABASE;
    if (!api?.enabled?.()) return null;
    if (remotePromises.has(kind)) return remotePromises.get(kind);
    const promise = api.fetchContent(kind)
      .then((items) => sortItems(items || []))
      .catch((error) => {
        console.warn(error?.message || error);
        return null;
      })
      .finally(() => remotePromises.delete(kind));
    remotePromises.set(kind, promise);
    return promise;
  }

  function listBody(items, kind, empty) {
    return items.length
      ? `<section class="gf-grid">${items.map((item) => card(item, kind)).join("")}</section>`
      : `<div class="gf-empty">${esc(empty)}</div>`;
  }

  function educationBody(items) {
    return `<section class="gf-education-entry"><div><span>Videos prácticos</span><strong>Procedimientos de urgencias</strong></div><a class="document-button" href="#/procedimientos">Ver procedimientos</a></section>${listBody(items, "education", "Aún no hay material docente publicado.")}`;
  }

  function procedureBody(items) {
    const procedures = sortProcedures(items).filter((item) => item.title);
    if (!procedures.length) return `<div class="gf-empty">Aún no hay procedimientos publicados.</div>`;
    return `<section class="gf-procedure-list" aria-label="Procedimientos de urgencias">${procedures.map((item) => {
      const href = item.eventUrl || item.url || "";
      return href
        ? `<a class="gf-procedure-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a>`
        : `<span class="gf-procedure-button disabled" aria-disabled="true">${esc(item.title)}</span>`;
    }).join("")}</section>`;
  }

  function paperBody(papers) {
    const latest = papers[0];
    const older = papers.slice(1);
    const featured = latest
      ? `<main class="gf-paper-main"><article class="gf-paper-featured"><span class="gf-tag">${esc(monthLabel(latest))}</span><h2>${esc(latest.title)}</h2><div class="gf-abstract"><strong>Abstract</strong><p>${esc(latest.description || "Al publicar el PDF desde Jefatura, la app intentará extraer el abstract automáticamente.")}</p></div><div class="gf-actions">${action(latest, "Abrir paper")}</div></article></main>`
      : `<main class="gf-paper-main"><div class="gf-empty">Aún no hay paper del mes publicado.</div></main>`;
    const repo = older.length
      ? `<div class="gf-repo-list">${older.map((paper) => `<a class="gf-repo-item" href="${esc(paper.url || "#/paper")}" ${paper.url ? `target="_blank" rel="noopener noreferrer"` : ""}><strong>${esc(paper.title)}</strong><span>${esc(monthLabel(paper))}</span></a>`).join("")}</div>`
      : `<div class="gf-empty">Sin papers previos.</div>`;
    return `<section class="gf-paper-layout">${featured}<aside class="gf-repo"><h2>Repositorio</h2>${repo}</aside></section>`;
  }

  function pageShell(title, text, body, pageId = "managementPage", activeRoute = "", signature = "") {
    activate(pageId, activeRoute, title);
    const titleEl = pageId === "educationPage" ? $("#educationTitle") : $("#managementTitle");
    const contentEl = pageId === "educationPage" ? $("#educationContent") : $("#managementContent");
    if (titleEl) titleEl.textContent = title;
    if (!contentEl) return;
    const nextSignature = `${route()}:${signature}`;
    if (contentEl.dataset.gfSignature !== nextSignature) {
      contentEl.innerHTML = `<div class="gf-shell"><section class="gf-hero"><h2>${esc(title)}</h2><p>${esc(text)}</p></section>${body}</div>`;
      contentEl.dataset.gfSignature = nextSignature;
    }
    contentEl.dataset.gfReadyRoute = route();
    notifyReady(route());
  }

  async function renderList(kind, title, text, empty, pageId = "managementPage", activeRoute = "") {
    const expectedRoute = route();
    const initial = readCache(kind) || staticContent(kind);
    const initialFingerprint = fingerprint(initial);
    pageShell(title, text, listBody(initial, kind, empty), pageId, activeRoute, initialFingerprint);

    const remote = await remoteContent(kind);
    if (route() !== expectedRoute || !remote) return;
    writeCache(kind, remote);
    const remoteFingerprint = fingerprint(remote);
    if (remoteFingerprint !== initialFingerprint) {
      pageShell(title, text, listBody(remote, kind, empty), pageId, activeRoute, remoteFingerprint);
    }
  }

  async function renderEducation() {
    const expectedRoute = route();
    const initial = readCache("education") || staticContent("education");
    const initialFingerprint = fingerprint(initial);
    pageShell("Educación médica", "Material docente publicado para el equipo.", educationBody(initial), "educationPage", "educacion", `education:${initialFingerprint}`);

    const remote = await remoteContent("education");
    if (route() !== expectedRoute || !remote) return;
    writeCache("education", remote);
    const remoteFingerprint = fingerprint(remote);
    if (remoteFingerprint !== initialFingerprint) {
      pageShell("Educación médica", "Material docente publicado para el equipo.", educationBody(remote), "educationPage", "educacion", `education:${remoteFingerprint}`);
    }
  }

  async function renderProcedures() {
    const expectedRoute = route();
    const initial = readCache("procedure") || staticContent("procedure");
    const initialFingerprint = fingerprint(initial);
    pageShell("Procedimientos de urgencias", "Videos publicados desde el Centro de Gestión Jefatura.", procedureBody(initial), "managementPage", "", `procedure:${initialFingerprint}`);

    const remote = await remoteContent("procedure");
    if (route() !== expectedRoute || !remote) return;
    writeCache("procedure", remote);
    const remoteFingerprint = fingerprint(remote);
    if (remoteFingerprint !== initialFingerprint) {
      pageShell("Procedimientos de urgencias", "Videos publicados desde el Centro de Gestión Jefatura.", procedureBody(remote), "managementPage", "", `procedure:${remoteFingerprint}`);
    }
  }

  async function renderPaper() {
    const expectedRoute = route();
    const initial = readCache("paper") || staticContent("paper");
    const initialFingerprint = fingerprint(initial);
    pageShell("Paper del mes", "Lectura destacada con título, abstract y repositorio mensual.", paperBody(initial), "managementPage", "", initialFingerprint);

    const remote = await remoteContent("paper");
    if (route() !== expectedRoute || !remote) return;
    writeCache("paper", remote);
    const remoteFingerprint = fingerprint(remote);
    if (remoteFingerprint !== initialFingerprint) {
      pageShell("Paper del mes", "Lectura destacada con título, abstract y repositorio mensual.", paperBody(remote), "managementPage", "", remoteFingerprint);
    }
  }

  function renderGestion() {
    activate("managementPage", "gestion", "Seguimiento operativo");
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestión de casos";
    if (content && !content.querySelector(".gestion-profiles-shell")) content.replaceChildren();
  }

  function renderUrgencia() {
    activate("doctorsPage", "gestion", "Equipo Urgencia");
    const contentEl = $("#doctorsContent");
    if (!contentEl) return;
    const signature = "equipo-urgencia-v1";
    if (contentEl.dataset.gfSignature !== signature) {
      contentEl.innerHTML = `<div class="gf-shell"><div class="gf-route"><a class="back-link" href="#/inicio">Inicio</a><a class="back-link" href="#/gestion">Gestión</a></div><section class="gf-hero"><h2>Equipo Urgencia</h2><p>Accesos de lectura para el equipo durante el turno.</p><div class="gf-actions"><a class="document-button" href="#/especialidades">Flujos clínicos</a><a class="document-button" href="#/llamados">Especialistas / UHD</a><a class="document-button" href="#/visita">Visita diaria</a><a class="document-button" href="#/formularios">Formularios</a><a class="document-button" href="#/telefonos">Directorio</a></div></section></div>`;
      contentEl.dataset.gfSignature = signature;
    }
    contentEl.dataset.gfReadyRoute = route();
    notifyReady(route());
  }

  function renderJefaturaShell() {
    activate("chiefPage", "jefatura", "Espacio jefatura");
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(0);
  }

  async function render() {
    const current = route();
    if (OLD_ROUTES[current]) {
      location.replace(OLD_ROUTES[current]);
      return;
    }
    if (current === "#/gestion") return renderGestion();
    if (["#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(current)) return renderUrgencia();
    if (current === "#/jefatura") return renderJefaturaShell();
    if (current === "#/noticias") return renderList("news", "Noticias", "Avisos y publicaciones vigentes.", "Aún no hay noticias publicadas.");
    if (current === "#/educacion") return renderEducation();
    if (current === "#/paper") return renderPaper();
    if (current === "#/procedimientos") return renderProcedures();
  }

  let renderTimer = 0;
  function schedule(delay = 0) {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      renderTimer = 0;
      render().catch(console.error);
    }, delay);
  }

  window.CRS_GESTION_FINAL = { render, schedule };
  window.addEventListener("hashchange", () => schedule());
  window.addEventListener("crs:supabase-ready", () => schedule());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => schedule(), { once: true });
  else schedule();
})();