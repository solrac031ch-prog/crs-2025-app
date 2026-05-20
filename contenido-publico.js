(() => {
  const PUBLISHED_BASE = "https://solrac031ch-prog.github.io/crs-2025-app/";
  const ROUTES = new Set([
    "#/gestion",
    "#/gestion/noticias",
    "#/gestion/educacion",
    "#/gestion/paper",
    "#/gestion/procedimientos",
    "#/educacion",
    "#/jefatura"
  ]);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  let alertPatched = false;

  function data() {
    return {
      news: [],
      education: [],
      papers: [],
      procedures: [],
      ...(window.CRS_STATIC_CONTENT || {})
    };
  }

  function route() {
    return location.hash.split("?")[0] || "#/inicio";
  }

  function activate(pageId) {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => {
      const activeRoute = pageId === "educationPage" ? "educacion" : "gestion";
      link.classList.toggle("active", link.dataset.routeLink === activeRoute);
    });
  }

  function patchAlert() {
    if (alertPatched) return;
    alertPatched = true;
    const nativeAlert = window.alert.bind(window);
    window.alert = (message) => {
      if (String(message || "") === "Publicado.") {
        nativeAlert("Borrador guardado en este navegador. Para que se vea desde cualquier computador/celular, debe publicarse en el repositorio de la web.");
        return;
      }
      nativeAlert(message);
    };
  }

  function addStyle() {
    if ($("#contenido-publico-style")) return;
    const style = document.createElement("style");
    style.id = "contenido-publico-style";
    style.textContent = `
      .public-shell{display:grid;gap:14px}.public-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#0f172a,#0f766e 58%,#2563eb);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.public-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.35rem);line-height:1}.public-hero p{margin:0;color:#dff7ff;max-width:880px;line-height:1.45}.public-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.public-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);text-decoration:none;color:inherit}.public-card.blue{border-left-color:#2563eb}.public-card.amber{border-left-color:#f59e0b}.public-card.purple{border-left-color:#7c3aed}.public-card.red{border-left-color:#dc2626}.public-card strong,.public-card h3{color:#10201c;font-size:1.14rem;margin:0}.public-card p,.public-card span{color:#52615c;line-height:1.4;margin:0}.public-tag{display:inline-flex;width:max-content;border-radius:999px;background:#eef7f5;color:#0b4f49;padding:4px 8px;font-weight:850;font-size:.8rem}.public-actions{display:flex;gap:10px;flex-wrap:wrap}.public-note{padding:12px;border:1px solid #bae6fd;border-radius:10px;background:#f0f9ff;color:#075985;font-weight:750}.public-empty{padding:18px;border:1px dashed #cbd5d1;border-radius:14px;background:#fbfdfc;color:#44504b;line-height:1.45}.public-paper-layout{display:grid;grid-template-columns:minmax(260px,360px) minmax(0,1fr);gap:14px;align-items:start}.public-sidebar{display:grid;gap:10px}.public-featured{display:grid;gap:12px}.public-admin-card{border-left-color:#2563eb!important}.public-draft-card{border-left-color:#f59e0b!important}.public-local-warning{border:1px solid #fecaca;background:#fff1f2;color:#7f1d1d;border-radius:12px;padding:12px;font-weight:800;line-height:1.35}.public-draft-note{border:1px solid #facc15;background:#fffbeb;color:#713f12;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}@media(max-width:820px){.public-paper-layout{grid-template-columns:1fr}}@media(max-width:680px){.public-actions{display:grid}.public-actions .document-button,.public-actions .back-link{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function nav() {
    return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestion</a><a class="back-link" href="#/inicio">Inicio</a></div>`;
  }

  function educationNav() {
    return `<div class="route-actions"><a class="back-link" href="#/inicio">Inicio</a><a class="back-link" href="#/gestion/educacion">Abrir en Gestion</a></div>`;
  }

  function action(item, label = "Abrir") {
    const href = item.url || item.eventUrl || "";
    if (!href) return "";
    return `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  }

  function sorted(items = []) {
    return [...items].sort((a, b) => String(b.createdAt || b.month || "").localeCompare(String(a.createdAt || a.month || "")));
  }

  function renderGestion() {
    activate("managementPage");
    $("#managementTitle").textContent = "Gestion";
    $("#managementContent").innerHTML = `<div class="public-shell"><section class="public-hero"><h2>Gestion de Urgencia</h2><p>Noticias, educacion y paper del mes ahora usan contenido publico incluido en la misma web. Lo publicado aqui se ve desde cualquier navegador sin Drive.</p><div class="public-actions"><a class="document-button" href="#/gestion/noticias">Noticias</a><a class="document-button" href="#/gestion/educacion">Educacion</a><a class="document-button" href="#/gestion/paper">Paper del mes</a><a class="document-button" href="#/gestion/procedimientos">Procedimientos</a></div></section><section class="public-grid"><a class="public-card blue" href="#/gestion/noticias"><strong>Noticias</strong><span>Avisos, posters, cursos y enlaces de inscripcion publicados en el repositorio.</span></a><a class="public-card purple" href="#/gestion/educacion"><strong>Educacion medica</strong><span>Canales, podcast y material docente visible para todo el equipo.</span></a><a class="public-card amber" href="#/gestion/paper"><strong>Paper del mes</strong><span>Ultimo paper destacado y repositorio mensual publico.</span></a></section><div class="public-note">Puedes preparar borradores desde Jefatura. Para publicarlos globalmente, hay que agregarlos a la web publicada.</div></div>`;
  }

  function card(item, kind) {
    const label = kind === "news" ? "Noticia" : kind === "papers" ? "Paper" : kind === "procedures" ? "Procedimiento" : "Educacion";
    const primary = kind === "news" && item.eventUrl ? "Inscripcion / publicidad" : kind === "papers" ? "Abrir paper" : kind === "procedures" ? "Abrir procedimiento" : "Abrir material";
    return `<article class="public-card ${kind === "papers" ? "amber" : kind === "education" ? "purple" : kind === "news" ? "blue" : "red"}"><span class="public-tag">${esc(item.category || label)}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="public-actions">${item.eventUrl ? action({ url: item.eventUrl }, primary) : action(item, primary)}</div></article>`;
  }

  function renderListPage(kind, title, text, emptyText) {
    activate("managementPage");
    $("#managementTitle").textContent = title;
    const items = sorted(data()[kind] || []);
    $("#managementContent").innerHTML = `<div class="public-shell">${nav()}<section class="public-hero"><h2>${esc(title)}</h2><p>${esc(text)}</p></section><section class="public-grid">${items.length ? items.map((item) => card(item, kind)).join("") : `<div class="public-empty">${esc(emptyText)}</div>`}</section></div>`;
  }

  function renderStandaloneEducation() {
    activate("educationPage");
    $("#educationTitle").textContent = "Educacion medica";
    const items = sorted(data().education || []);
    $("#educationContent").innerHTML = `<div class="public-shell">${educationNav()}<section class="public-hero"><h2>Educacion medica</h2><p>Canales, podcast y material docente publico. Esta vista usa la misma fuente que Gestion y se ve desde cualquier navegador.</p></section><section class="public-grid">${items.length ? items.map((item) => card(item, "education")).join("") : `<div class="public-empty">Aun no hay material docente publicado.</div>`}</section></div>`;
  }

  function monthLabel(item) {
    const value = item.month || String(item.createdAt || "").slice(0, 7);
    const [year, month] = value.split("-");
    return year && month ? `${month}/${year}` : "Sin mes";
  }

  function renderPaper() {
    activate("managementPage");
    $("#managementTitle").textContent = "Paper del mes";
    const papers = sorted(data().papers || []);
    const latest = papers[0];
    const older = papers.slice(1);
    const featured = latest
      ? `<article class="public-card amber"><span class="public-tag">Ultimo paper publicado - ${esc(monthLabel(latest))}</span><h3>${esc(latest.title)}</h3><p>${esc(latest.description)}</p><div class="public-actions">${action(latest, "Abrir paper")}</div></article>`
      : `<div class="public-empty">Aun no hay un paper del mes publicado en la web. Cuando me pases el paper o enlace, lo dejo dentro del repositorio y aparecera aqui para todos.</div>`;
    const repo = older.length
      ? older.map((paper) => card(paper, "papers")).join("")
      : `<div class="public-empty">No hay papers previos publicados.</div>`;
    $("#managementContent").innerHTML = `<div class="public-shell">${nav()}<section class="public-hero"><h2>Paper del mes</h2><p>Esta seccion no usa Drive ni almacenamiento del navegador. Lee solo contenido publicado con la web.</p></section><section class="public-paper-layout"><aside class="public-sidebar"><h2>Repositorio</h2>${repo}</aside><main class="public-featured">${featured}</main></section></div>`;
  }

  function renderEducation() {
    renderListPage("education", "Educacion medica", "Canales y material docente publico de la web. Disponible desde cualquier navegador.", "Aun no hay material docente adicional publicado.");
  }

  function renderNews() {
    renderListPage("news", "Noticias", "Avisos, cursos, posters y enlaces publicados como parte de la web. No depende de Drive.", "Aun no hay noticias publicadas en la web. Si me pasas la noticia, la dejo visible para todos.");
  }

  function renderProcedures() {
    renderListPage("procedures", "Procedimientos medicos", "Repositorio publico de procedimientos y material practico incluido en la web.", "Aun no hay procedimientos publicados en la web.");
  }

  function patchJefatura() {
    if (route() !== "#/jefatura") return;
    const content = $("#chiefContent");
    if (!content || content.dataset.publicPatch === "true") return;
    content.dataset.publicPatch = "true";

    const forms = $$('form[data-content]', content);
    const notice = document.createElement("article");
    notice.className = "admin-card public-admin-card";
    notice.innerHTML = `<h3>Publicacion global de noticias, paper y educacion</h3><p>El modulo de jefatura sigue activo para preparar contenido. Sin backend, lo que subas aqui queda como borrador local de este navegador. Para publicarlo mundialmente, enviame el contenido y lo dejo en el repositorio de la web.</p><div class="public-local-warning">Publicacion global = queda en contenido-web.js y se ve desde cualquier computador/celular. Borrador local = queda solo en este navegador.</div><div class="public-actions"><a class="document-button" href="${PUBLISHED_BASE}#/gestion/noticias" target="_blank" rel="noopener noreferrer">Ver noticias publicas</a><a class="document-button" href="${PUBLISHED_BASE}#/gestion/paper" target="_blank" rel="noopener noreferrer">Ver paper del mes</a><a class="document-button" href="${PUBLISHED_BASE}#/gestion/educacion" target="_blank" rel="noopener noreferrer">Ver educacion</a></div>`;
    const grid = $("#chiefContent .gestion-grid");
    if (grid) grid.prepend(notice);

    forms.forEach((form) => {
      const card = form.closest("article");
      if (!card) return;
      card.classList.add("public-draft-card");
      if (!card.querySelector("[data-public-draft-note]")) {
        form.insertAdjacentHTML("beforebegin", `<div class="public-draft-note" data-public-draft-note>Este formulario guarda un borrador local. Sirve para preparar la noticia/paper/material, pero no lo publica para otros navegadores.</div>`);
      }
    });
  }

  function render() {
    patchAlert();
    addStyle();
    const current = route();
    if (!ROUTES.has(current)) return;
    if (current === "#/gestion") renderGestion();
    if (current === "#/gestion/noticias") renderNews();
    if (current === "#/gestion/educacion") renderEducation();
    if (current === "#/gestion/paper") renderPaper();
    if (current === "#/gestion/procedimientos") renderProcedures();
    if (current === "#/educacion") renderStandaloneEducation();
    if (current === "#/jefatura") setTimeout(patchJefatura, 50);
  }

  window.addEventListener("hashchange", () => requestAnimationFrame(render));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
