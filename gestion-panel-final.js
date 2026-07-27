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

  const OLD_ROUTES = {
    "#/gestion/noticias": "#/noticias",
    "#/gestion/educacion": "#/educacion",
    "#/gestion/paper": "#/paper"
  };

  const VISUALS = {
    news: ["#155e75", "#7c2d12", "Noticias"],
    education: ["#166534", "#4338ca", "Educacion"],
    paper: ["#92400e", "#164e63", "Paper"],
    procedure: ["#991b1b", "#115e59", "Procedimiento"]
  };

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
    const href = item.eventUrl || item.url || "";
    const media = `<div class="gf-media" style="--gf-a:${a};--gf-b:${b}">${image ? `<img src="${esc(image)}" alt="" loading="lazy">` : ""}<span class="gf-tag">${esc(label)}</span><strong>${esc(item.title || label)}</strong></div>`;
    const body = `<div class="gf-body"><h3>${esc(item.title || label)}</h3><p>${esc(item.description || "")}</p>${action(item, "Abrir")}</div>`;
    return href
      ? `<article class="gf-card">${media}${body}</article>`
      : `<article class="gf-card">${media}${body}</article>`;
  }

  function monthLabel(item) {
    const value = item.month || String(item.createdAt || "").slice(0, 7);
    const [year, month] = String(value || "").split("-");
    return year && month ? `${month}/${year}` : "Sin mes";
  }

  function sortItems(items = []) {
    return [...items].sort((a, b) => String(b.createdAt || b.month || "").localeCompare(String(a.createdAt || a.month || "")));
  }

  function staticContent(kind) {
    const staticKey = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
    return sortItems(window.CRS_STATIC_CONTENT?.[staticKey] || []);
  }

  function withTimeout(promise, ms = 1200) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase tardo demasiado; usando contenido local.")), ms))
    ]);
  }

  async function remoteContent(kind) {
    const api = window.CRS_SUPABASE;
    if (!api?.enabled?.()) return null;
    try {
      return sortItems(await withTimeout(api.fetchContent(kind)));
    } catch (error) {
      console.warn(error?.message || error);
      return null;
    }
  }

  function listBody(items, kind, empty) {
    return items.length
      ? `<section class="gf-grid">${items.map((item) => card(item, kind)).join("")}</section>`
      : `<div class="gf-empty">${esc(empty)}</div>`;
  }

  function paperBody(papers) {
    const latest = papers[0];
    const older = papers.slice(1);
    const featured = latest
      ? `<main class="gf-paper-main"><article class="gf-paper-featured"><span class="gf-tag">${esc(monthLabel(latest))}</span><h2>${esc(latest.title)}</h2><div class="gf-abstract"><strong>Abstract</strong><p>${esc(latest.description || "Al publicar el PDF desde Jefatura, la app intentara extraer el abstract automaticamente.")}</p></div><div class="gf-actions">${action(latest, "Abrir paper")}</div></article></main>`
      : `<main class="gf-paper-main"><div class="gf-empty">Aun no hay paper del mes publicado. Cuando Jefatura suba un PDF, aqui se mostrara el titulo y abstract.</div></main>`;
    const repo = older.length
      ? `<div class="gf-repo-list">${older.map((paper) => `<a class="gf-repo-item" href="${esc(paper.url || "#/paper")}" ${paper.url ? `target="_blank" rel="noopener noreferrer"` : ""}><strong>${esc(paper.title)}</strong><span>${esc(monthLabel(paper))}</span></a>`).join("")}</div>`
      : `<div class="gf-empty">Sin papers previos.</div>`;
    return `<section class="gf-paper-layout">${featured}<aside class="gf-repo"><h2>Repositorio</h2>${repo}</aside></section>`;
  }

  function pageShell(title, text, body, pageId = "managementPage", activeRoute = "") {
    activate(pageId, activeRoute, title);
    const titleEl = pageId === "educationPage" ? $("#educationTitle") : $("#managementTitle");
    const contentEl = pageId === "educationPage" ? $("#educationContent") : $("#managementContent");
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = `<div class="gf-shell"><section class="gf-hero"><h2>${esc(title)}</h2><p>${esc(text)}</p></section>${body}</div>`;
  }

  async function renderList(kind, title, text, empty, pageId = "managementPage", activeRoute = "") {
    const expectedRoute = route();
    pageShell(title, text, listBody(staticContent(kind), kind, empty), pageId, activeRoute);
    const items = await remoteContent(kind);
    if (route() !== expectedRoute || !items) return;
    pageShell(title, text, listBody(items, kind, empty), pageId, activeRoute);
  }

  async function renderPaper() {
    const expectedRoute = route();
    pageShell("Paper del mes", "Lectura destacada con titulo, abstract y repositorio mensual al lado derecho.", paperBody(staticContent("paper")));
    const papers = await remoteContent("paper");
    if (route() !== expectedRoute || !papers) return;
    pageShell("Paper del mes", "Lectura destacada con titulo, abstract y repositorio mensual al lado derecho.", paperBody(papers));
  }

  function renderGestion() {
    activate("managementPage", "gestion", "Seguimiento operativo");
    const title = $("#managementTitle");
    const contentEl = $("#managementContent");
    if (title) title.textContent = "Gestion";
    if (!contentEl) return;
    contentEl.innerHTML = `<div class="gf-shell"><section class="gf-hero"><h2>Gestion de casos</h2><p>Panel operativo para seguimiento de pacientes y tareas prioritarias.</p></section><section class="gf-grid"><a class="gf-home-card teal" href="#/gestion/pacientes"><strong>Gestion pacientes</strong><span>Seguimiento de casos prioritarios para jefatura.</span></a></section></div>`;
  }

  function renderUrgencia() {
    activate("doctorsPage", "gestion", "Equipo Urgencia");
    const contentEl = $("#doctorsContent");
    if (!contentEl) return;
    contentEl.innerHTML = `<div class="gf-shell"><div class="gf-route"><a class="back-link" href="#/inicio">Inicio</a><a class="back-link" href="#/gestion">Gestion</a></div><section class="gf-hero"><h2>Equipo Urgencia</h2><p>Accesos de lectura para el equipo durante el turno.</p><div class="gf-actions"><a class="document-button" href="#/especialidades">Flujos clinicos</a><a class="document-button" href="#/llamados">Especialistas / UHD</a><a class="document-button" href="#/visita">Visita diaria</a><a class="document-button" href="#/formularios">Formularios</a><a class="document-button" href="#/telefonos">Directorio</a></div></section></div>`;
  }

  function renderJefaturaShell() {
    activate("chiefPage", "jefatura", "Espacio jefatura");
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(20);
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
    if (current === "#/noticias") return renderList("news", "Noticias", "Avisos y publicaciones vigentes con una tarjeta visual destacada.", "Aun no hay noticias publicadas.");
    if (current === "#/educacion") return renderList("education", "Educacion medica", "Material docente publicado para el equipo.", "Aun no hay material docente publicado.", "educationPage", "educacion");
    if (current === "#/paper") return renderPaper();
    if (current === "#/procedimientos") return renderList("procedure", "Procedimientos medicos", "Repositorio visual de procedimientos y material practico.", "Aun no hay procedimientos publicados.");
  }

  let renderTimer = null;
  function schedule(delay = 0) {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderTimer = null;
      render().catch(console.error);
    }, delay);
  }

  window.CRS_GESTION_FINAL = { render, schedule };
  window.addEventListener("hashchange", () => schedule());
  window.addEventListener("crs:supabase-ready", () => schedule(20));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => schedule());
  else schedule();
})();