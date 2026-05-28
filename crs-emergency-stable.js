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

  const redirects = {
    "#/gestion/noticias": "#/noticias",
    "#/gestion/educacion": "#/educacion",
    "#/gestion/paper": "#/paper"
  };

  async function clearOldInstall() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (_) {}
  }

  function show(pageId, active = "") {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", active && link.dataset.routeLink === active));
  }

  function setHead(pageId, eyebrow, title) {
    const page = $(`#${pageId}`);
    const eyebrowNode = $(".page-head .eyebrow", page);
    const titleNode = $(".page-head h1", page);
    if (eyebrowNode) eyebrowNode.textContent = eyebrow;
    if (titleNode) titleNode.textContent = title;
  }

  function addStyle() {
    if ($("#crs-emergency-style")) return;
    const style = document.createElement("style");
    style.id = "crs-emergency-style";
    style.textContent = `
      .stable-shell{display:grid;gap:16px}.stable-hero{padding:clamp(22px,4vw,34px);border-radius:10px;background:#10201c;color:#fff}.stable-hero h2{margin:0 0 8px;color:#fff;font-size:clamp(2rem,5vw,3rem);line-height:1.05}.stable-hero p{margin:0;color:#dcf7ef;line-height:1.45}.stable-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.stable-card{display:grid;gap:10px;overflow:hidden;border:1px solid #dfe8e4;border-radius:10px;background:#fff;box-shadow:0 10px 26px rgba(15,23,42,.08);color:inherit;text-decoration:none}.stable-card-media{min-height:145px;display:grid;align-content:end;padding:14px;background:linear-gradient(135deg,#0f766e,#1d4ed8);color:#fff}.stable-card-media strong{font-size:1.25rem}.stable-card-body{display:grid;gap:8px;padding:14px}.stable-card-body h3{margin:0;color:#10201c}.stable-card-body p{margin:0;color:#52615c;line-height:1.4}.stable-actions{display:flex;gap:10px;flex-wrap:wrap}.stable-paper{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,330px);gap:14px}.stable-feature{padding:18px;border:1px solid #dfe8e4;border-left:6px solid #b45309;border-radius:10px;background:#fff}.stable-feature h2{margin:0 0 10px;color:#10201c}.stable-abstract{padding:12px;border:1px solid #fed7aa;border-radius:8px;background:#fff7ed;color:#5b3415}.stable-repo{padding:14px;border:1px solid #dfe8e4;border-radius:10px;background:#fff}.stable-empty{padding:18px;border:1px dashed #bfc8c0;border-radius:10px;background:#fbfdfc;color:#44504b}@media(max-width:800px){.stable-paper{grid-template-columns:1fr}.stable-actions{display:grid}}
    `;
    document.head.append(style);
  }

  async function getContent(kind) {
    try {
      if (window.CRS_SUPABASE?.enabled?.()) {
        return await window.CRS_SUPABASE.fetchContent(kind);
      }
    } catch (_) {}
    const key = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
    return window.CRS_STATIC_CONTENT?.[key] || [];
  }

  function itemUrl(item) {
    return item.eventUrl || item.url || "";
  }

  function card(item, label) {
    const href = itemUrl(item);
    return `<article class="stable-card"><div class="stable-card-media"><strong>${esc(label)}</strong></div><div class="stable-card-body"><h3>${esc(item.title || "Sin titulo")}</h3><p>${esc(item.description || "Contenido publicado por Jefatura.")}</p><div class="stable-actions">${href ? `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : ""}</div></div></article>`;
  }

  function renderHome() {
    show("homePage", "");
  }

  function renderGestion() {
    addStyle();
    show("managementPage", "gestion");
    setHead("managementPage", "Seguimiento operativo", "Gestion");
    $("#managementContent").innerHTML = `<div class="stable-shell"><section class="stable-hero"><h2>Gestion de casos</h2><p>Seguimiento operativo de pacientes y tareas prioritarias.</p></section><section class="stable-grid"><a class="stable-card" href="#/gestion/pacientes"><div class="stable-card-media"><strong>Gestion pacientes</strong></div><div class="stable-card-body"><p>Casos prioritarios para seguimiento de jefatura.</p></div></a><a class="stable-card" href="#/urgencia"><div class="stable-card-media"><strong>Equipo Urgencia</strong></div><div class="stable-card-body"><p>Flujos, llamados, visita, formularios y directorio.</p></div></a></section></div>`;
  }

  async function renderList(kind, title, pageId = "managementPage") {
    addStyle();
    show(pageId, kind === "education" ? "educacion" : "");
    setHead(pageId, title, title);
    const mount = pageId === "educationPage" ? $("#educationContent") : $("#managementContent");
    const items = await getContent(kind);
    mount.innerHTML = `<div class="stable-shell"><div class="route-actions"><a class="back-link" href="#/inicio">Inicio</a></div><section class="stable-hero"><h2>${esc(title)}</h2><p>Contenido publicado para el equipo.</p></section><section class="stable-grid">${items.length ? items.map((item) => card(item, title)).join("") : `<div class="stable-empty">Aun no hay contenido publicado.</div>`}</section></div>`;
  }

  async function renderPaper() {
    addStyle();
    show("managementPage", "");
    setHead("managementPage", "Paper del mes", "Paper del mes");
    const papers = await getContent("paper");
    const latest = papers[0];
    const older = papers.slice(1);
    $("#managementContent").innerHTML = `<div class="stable-shell"><div class="route-actions"><a class="back-link" href="#/inicio">Inicio</a></div><section class="stable-hero"><h2>Paper del mes</h2><p>Titulo, abstract y repositorio mensual.</p></section><section class="stable-paper"><main>${latest ? `<article class="stable-feature"><h2>${esc(latest.title || "Paper del mes")}</h2><div class="stable-abstract"><strong>Abstract</strong><p>${esc(latest.description || "Sin abstract publicado.")}</p></div><div class="stable-actions">${itemUrl(latest) ? `<a class="document-button" href="${esc(itemUrl(latest))}" target="_blank" rel="noopener noreferrer">Abrir paper</a>` : ""}</div></article>` : `<div class="stable-empty">Aun no hay paper publicado.</div>`}</main><aside class="stable-repo"><h2>Repositorio</h2>${older.length ? older.map((item) => `<p><a href="${esc(itemUrl(item) || "#/paper")}" target="_blank" rel="noopener noreferrer">${esc(item.title || "Paper")}</a></p>`).join("") : `<p>Sin papers previos.</p>`}</aside></section></div>`;
  }

  function cleanJefatura() {
    if (route() !== "#/jefatura") return;
    show("chiefPage", "jefatura");
    setHead("chiefPage", "Espacio jefatura", "Panel restringido");
    $$("#chiefContent a").forEach((link) => {
      if (link.getAttribute("href") === "#/gestion" || /volver\s+a\s+gestion/i.test(link.textContent || "")) link.remove();
    });
  }

  async function render() {
    const current = route();
    if (redirects[current]) {
      location.replace(redirects[current]);
      return;
    }
    if (current === "#/inicio") return renderHome();
    if (current === "#/gestion") return renderGestion();
    if (current === "#/noticias") return renderList("news", "Noticias");
    if (current === "#/educacion") return renderList("education", "Educacion medica", "educationPage");
    if (current === "#/paper") return renderPaper();
    if (current === "#/jefatura") return cleanJefatura();
  }

  function schedule() {
    clearOldInstall();
    setTimeout(() => render().catch(console.error), 0);
    setTimeout(() => render().catch(console.error), 400);
    setTimeout(() => render().catch(console.error), 1400);
  }

  window.addEventListener("hashchange", schedule);
  window.addEventListener("crs:supabase-ready", schedule);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();
