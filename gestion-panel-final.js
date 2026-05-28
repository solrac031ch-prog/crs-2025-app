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

  const VISUALS = {
    news: ["#1d4ed8", "#0f766e", "Noticias"],
    education: ["#7c3aed", "#0f766e", "Educacion"],
    paper: ["#b45309", "#1d4ed8", "Paper"],
    procedure: ["#dc2626", "#0f766e", "Procedimiento"]
  };

  function addStyle() {
    if ($("#gestion-final-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-final-style";
    style.textContent = `
      .gf-shell{display:grid;gap:16px}.gf-hero{display:grid;gap:12px;padding:clamp(22px,4vw,36px);border-radius:8px;background:#10201c;color:#fff;box-shadow:0 18px 42px rgba(15,23,42,.18);overflow:hidden}.gf-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.4rem);line-height:1.02}.gf-hero p{margin:0;color:#d8f4ee;max-width:900px;line-height:1.45}.gf-actions,.gf-route{display:flex;gap:10px;flex-wrap:wrap}.gf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.gf-card{display:grid;grid-template-rows:auto 1fr;min-height:320px;border:1px solid #dfe8e4;border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);overflow:hidden;color:inherit;text-decoration:none}.gf-media{position:relative;min-height:138px;display:grid;align-content:end;padding:14px;color:#fff;background:linear-gradient(135deg,var(--gf-a),var(--gf-b));overflow:hidden}.gf-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.gf-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.56))}.gf-media strong,.gf-tag{position:relative;z-index:1}.gf-media strong{font-size:1.35rem;line-height:1.08;max-width:14ch}.gf-tag{width:max-content;max-width:100%;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.92);color:#10201c;font-size:.78rem;font-weight:900;text-transform:uppercase}.gf-body{display:grid;align-content:start;gap:10px;padding:14px}.gf-body h3{margin:0;color:#10201c;font-size:1.14rem;line-height:1.16}.gf-body p{margin:0;color:#52615c;line-height:1.42}.gf-empty{padding:18px;border:1px dashed #bfc8c0;border-radius:8px;background:#fbfdfc;color:#44504b}.gf-paper-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,340px);gap:16px;align-items:start}.gf-paper-main{display:grid;gap:14px}.gf-paper-featured{display:grid;gap:14px;padding:18px;border:1px solid #dfe8e4;border-left:6px solid #b45309;border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.gf-paper-featured h2{margin:0;color:#10201c;font-size:clamp(1.65rem,3vw,2.4rem);line-height:1.08}.gf-abstract{display:grid;gap:8px;padding:14px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;color:#431407}.gf-abstract strong{font-size:.82rem;text-transform:uppercase}.gf-abstract p{margin:0;line-height:1.5;color:#5b3415}.gf-repo{position:sticky;top:92px;display:grid;gap:10px;padding:14px;border:1px solid #dfe8e4;border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.gf-repo h2{margin:0;font-size:1rem;color:#10201c}.gf-repo-list{display:grid;gap:8px}.gf-repo-item{display:grid;gap:4px;padding:10px;border:1px solid #e5ebe8;border-radius:8px;color:inherit;text-decoration:none}.gf-repo-item strong{font-size:.95rem;color:#10201c}.gf-repo-item span{font-size:.82rem;color:#64748b}.gf-home-card{display:grid;gap:10px;min-height:170px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);color:inherit;text-decoration:none}.gf-home-card strong{font-size:1.2rem;color:#10201c}.gf-home-card span{color:#52615c}.gf-home-card.blue{border-left-color:#2563eb}.gf-home-card.purple{border-left-color:#7c3aed}.gf-home-card.amber{border-left-color:#b45309}.gf-home-card.red{border-left-color:#dc2626}.gf-home-card.teal{border-left-color:#0f766e}@media(max-width:840px){.gf-paper-layout{grid-template-columns:1fr}.gf-repo{position:static;order:-1}}@media(max-width:680px){.gf-actions,.gf-route{display:grid}.gf-actions .document-button,.gf-route .back-link{width:100%;justify-content:center}.gf-card{min-height:0}.gf-media{min-height:118px}}
    `;
    document.head.append(style);
  }

  function activate(pageId, activeRoute = "gestion") {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", link.dataset.routeLink === activeRoute));
  }

  function nav() {
    return `<div class="gf-route"><a class="back-link" href="#/gestion">Volver a Gestion</a><a class="back-link" href="#/inicio">Inicio</a></div>`;
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
    const url = item.url || item.eventUrl || "";
    if (isImageUrl(url)) return url;
    if (kind === "education" && url) return favicon(url);
    return "";
  }

  function action(item, label) {
    const href = item.eventUrl || item.url || "";
    return href ? `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : "";
  }

  function monthLabel(item) {
    const value = item.month || String(item.createdAt || "").slice(0, 7);
    const [year, month] = String(value || "").split("-");
    return year && month ? `${month}/${year}` : "Sin mes";
  }

  function sortItems(items = []) {
    return [...items].sort((a, b) => String(b.createdAt || b.month || "").localeCompare(String(a.createdAt || a.month || "")));
  }

  async function content(kind) {
    const api = window.CRS_SUPABASE;
    if (api?.enabled?.()) return sortItems(await api.fetchContent(kind));
    const staticKey = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
    return sortItems(window.CRS_STATIC_CONTENT?.[staticKey] || []);
  }

  function card(item, kind) {
    const [a, b, fallback] = VISUALS[kind] || VISUALS.news;
    const image = visualImage(item, kind);
    const label = item.category || fallback;
    const actionLabel = kind === "paper" ? "Abrir paper" : kind === "procedure" ? "Abrir procedimiento" : kind === "education" ? "Abrir material" : item.eventUrl ? "Inscripcion / publicidad" : "Abrir";
    return `<article class="gf-card" style="--gf-a:${a};--gf-b:${b}"><div class="gf-media">${image ? `<img src="${esc(image)}" alt="">` : ""}<span class="gf-tag">${esc(label)}</span><strong>${esc(kind === "news" ? "Ultimo aviso" : fallback)}</strong></div><div class="gf-body"><h3>${esc(item.title)}</h3><p>${esc(item.description || "Contenido publicado por Jefatura.")}</p><div class="gf-actions">${action(item, actionLabel)}</div></div></article>`;
  }

  function pageShell(title, text, body, pageId = "managementPage") {
    activate(pageId, pageId === "educationPage" ? "educacion" : "gestion");
    const titleEl = pageId === "educationPage" ? $("#educationTitle") : $("#managementTitle");
    const contentEl = pageId === "educationPage" ? $("#educationContent") : $("#managementContent");
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = `<div class="gf-shell">${pageId === "educationPage" ? `<div class="gf-route"><a class="back-link" href="#/inicio">Inicio</a><a class="back-link" href="#/gestion/educacion">Abrir en Gestion</a></div>` : nav()}<section class="gf-hero"><h2>${esc(title)}</h2><p>${esc(text)}</p></section>${body}</div>`;
  }

  async function renderList(kind, title, text, empty, pageId = "managementPage") {
    addStyle();
    const items = await content(kind);
    const body = items.length
      ? `<section class="gf-grid">${items.map((item) => card(item, kind)).join("")}</section>`
      : `<div class="gf-empty">${esc(empty)}</div>`;
    pageShell(title, text, body, pageId);
  }

  async function renderPaper() {
    addStyle();
    const papers = await content("paper");
    const latest = papers[0];
    const older = papers.slice(1);
    const featured = latest
      ? `<main class="gf-paper-main"><article class="gf-paper-featured"><span class="gf-tag">${esc(monthLabel(latest))}</span><h2>${esc(latest.title)}</h2><div class="gf-abstract"><strong>Encabezado y abstract</strong><p>${esc(latest.description || "Agrega el abstract al publicar el paper para mostrarlo aqui.")}</p></div><div class="gf-actions">${action(latest, "Abrir paper")}</div></article></main>`
      : `<main class="gf-paper-main"><div class="gf-empty">Aun no hay paper del mes publicado. Cuando Jefatura publique uno, aqui se mostrara el encabezado y abstract.</div></main>`;
    const repo = older.length
      ? `<div class="gf-repo-list">${older.map((paper) => `<a class="gf-repo-item" href="${esc(paper.url || "#/gestion/paper")}" ${paper.url ? `target="_blank" rel="noopener noreferrer"` : ""}><strong>${esc(paper.title)}</strong><span>${esc(monthLabel(paper))}</span></a>`).join("")}</div>`
      : `<div class="gf-empty">Sin papers previos.</div>`;
    pageShell("Paper del mes", "Lectura destacada de Jefatura, con encabezado, abstract y repositorio historico al lado derecho.", `<section class="gf-paper-layout">${featured}<aside class="gf-repo"><h2>Repositorio</h2>${repo}</aside></section>`);
  }

  function renderGestion() {
    addStyle();
    activate("managementPage", "gestion");
    const title = $("#managementTitle");
    const contentEl = $("#managementContent");
    if (title) title.textContent = "Gestion";
    if (!contentEl) return;
    contentEl.innerHTML = `<div class="gf-shell"><section class="gf-hero"><h2>Gestion de Urgencia</h2><p>Panel unico para publicaciones, educacion, paper del mes, procedimientos y seguimiento operativo.</p><div class="gf-actions"><a class="document-button" href="#/jefatura">Modulo Jefatura</a><a class="document-button" href="#/gestion/noticias">Noticias</a><a class="document-button" href="#/gestion/educacion">Educacion</a><a class="document-button" href="#/gestion/paper">Paper del mes</a><a class="document-button" href="#/gestion/procedimientos">Procedimientos</a></div></section><section class="gf-grid"><a class="gf-home-card blue" href="#/gestion/noticias"><strong>Noticias</strong><span>Tarjetas visuales para avisos, posters, cursos e inscripciones.</span></a><a class="gf-home-card purple" href="#/gestion/educacion"><strong>Educacion medica</strong><span>Material publicado con imagenes, iconos y enlaces claros.</span></a><a class="gf-home-card amber" href="#/gestion/paper"><strong>Paper del mes</strong><span>Encabezado, abstract y repositorio lateral.</span></a><a class="gf-home-card red" href="#/jefatura"><strong>Modulo Jefatura</strong><span>Publicar contenido, documentos y administrar usuarios.</span></a><a class="gf-home-card teal" href="#/gestion/pacientes"><strong>Gestion pacientes</strong><span>Seguimiento de casos prioritarios para jefatura.</span></a></section></div>`;
  }

  async function render() {
    const current = route();
    if (current === "#/gestion") return renderGestion();
    if (current === "#/gestion/noticias") return renderList("news", "Noticias", "Avisos, cursos, posters y enlaces publicados por Jefatura en una vista visual.", "Aun no hay noticias publicadas.");
    if (current === "#/gestion/educacion") return renderList("education", "Educacion medica", "Canales, podcast, procedimientos y material docente con vista visual.", "Aun no hay material docente publicado.");
    if (current === "#/educacion") return renderList("education", "Educacion medica", "Material docente disponible para el equipo.", "Aun no hay material docente publicado.", "educationPage");
    if (current === "#/gestion/paper") return renderPaper();
    if (current === "#/gestion/procedimientos") return renderList("procedure", "Procedimientos medicos", "Repositorio visual de procedimientos y material practico.", "Aun no hay procedimientos publicados.");
  }

  function schedule() {
    setTimeout(() => render().catch(console.error), 60);
    setTimeout(() => render().catch(console.error), 360);
  }

  window.CRS_GESTION_FINAL = { render, schedule };
  window.addEventListener("hashchange", schedule);
  window.addEventListener("crs:supabase-ready", schedule);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();
