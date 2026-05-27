(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const route = () => location.hash.split("?")[0] || "#/inicio";

  function addStyle() {
    if ($("#gestion-supabase-home-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-supabase-home-style";
    style.textContent = `
      .gestion-wrap{display:grid;gap:14px}.gestion-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#0f172a,#14532d 55%,#0f766e);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.gestion-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.35rem);line-height:1}.gestion-hero p{margin:0;color:#def7ef;max-width:880px;line-height:1.45}.gestion-actions,.route-actions{display:flex;gap:10px;flex-wrap:wrap}.gestion-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.gestion-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08);text-decoration:none;color:inherit}.gestion-card strong{color:#10201c;font-size:1.08rem}.gestion-card span{color:#52615c;line-height:1.4}.gestion-card.blue{border-left-color:#2563eb}.gestion-card.purple{border-left-color:#7c3aed}.gestion-card.amber{border-left-color:#f59e0b}.gestion-card.red{border-left-color:#dc2626}.gestion-card.teal{border-left-color:#0f766e}@media(max-width:680px){.gestion-actions,.route-actions{display:grid}.document-button,.back-link{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function activate(pageId, activeRoute = "gestion") {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", link.dataset.routeLink === activeRoute));
  }

  function cleanupLegacyCopy(hash = route()) {
    if (hash !== "#/llamados") return;
    const uhdNote = $("#uhdDocumentAction p");
    if (uhdNote && /google\s+drive/i.test(uhdNote.textContent || "")) {
      uhdNote.textContent = "Publicar la disponibilidad vigente desde Jefatura para que quede disponible globalmente.";
    }
  }

  function renderGestion() {
    addStyle();
    activate("managementPage", "gestion");
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestion";
    if (!content) return;
    content.innerHTML = `<div class="gestion-wrap"><section class="gestion-hero"><h2>Gestion de Urgencia</h2><p>Accesos operativos y publicaciones globales conectadas a Supabase.</p><div class="gestion-actions"><a class="document-button" href="#/urgencia">Modulo Equipo Urgencia</a><a class="document-button" href="#/jefatura">Modulo Jefatura</a><a class="document-button" href="#/gestion/noticias">Noticias</a><a class="document-button" href="#/gestion/educacion">Educacion</a><a class="document-button" href="#/gestion/paper">Paper del mes</a><a class="document-button" href="#/gestion/procedimientos">Procedimientos</a></div></section><section class="gestion-grid"><a class="gestion-card blue" href="#/gestion/noticias"><strong>Noticias</strong><span>Avisos, cursos, posters y enlaces publicados globalmente.</span></a><a class="gestion-card purple" href="#/gestion/educacion"><strong>Educacion medica</strong><span>YouTube, podcast, material docente y procedimientos.</span></a><a class="gestion-card amber" href="#/gestion/paper"><strong>Paper del mes</strong><span>Ultimo paper destacado y repositorio mensual.</span></a><a class="gestion-card red" href="#/jefatura"><strong>Modulo Jefatura</strong><span>Publicaciones, documentos, usuarios, especialistas, UHD y flujos.</span></a><a class="gestion-card teal" href="#/gestion/pacientes"><strong>Gestion pacientes</strong><span>Seguimiento de casos prioritarios para jefatura.</span></a></section></div>`;
  }

  function renderUrgencia() {
    addStyle();
    activate("doctorsPage", "gestion");
    const content = $("#doctorsContent");
    if (!content) return;
    content.innerHTML = `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestion</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="gestion-hero"><h2>Modulo Equipo Urgencia</h2><p>Acceso de lectura para el equipo durante el turno.</p><div class="gestion-actions"><a class="document-button" href="#/especialidades">Flujos clinicos</a><a class="document-button" href="#/llamados">Especialistas / UHD</a><a class="document-button" href="#/visita">Visita diaria</a><a class="document-button" href="#/formularios">Formularios</a><a class="document-button" href="#/telefonos">Directorio</a></div></section>`;
  }

  function renderJefaturaShell() {
    addStyle();
    activate("chiefPage", "jefatura");
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(20);
  }

  function run() {
    const hash = route();
    if (hash === "#/gestion") return renderGestion();
    if (["#/urgencia", "#/medicos", "#/equipo-urgencia"].includes(hash)) return renderUrgencia();
    if (hash === "#/jefatura") return renderJefaturaShell();
    if (["#/gestion/noticias", "#/gestion/educacion", "#/gestion/paper", "#/gestion/procedimientos", "#/educacion", "#/formularios", "#/llamados", "#/especialidades"].includes(hash)) {
      window.CRS_SUPABASE?.renderPublicRoute?.();
      cleanupLegacyCopy(hash);
      setTimeout(() => cleanupLegacyCopy(hash), 260);
    }
  }

  window.addEventListener("hashchange", () => setTimeout(run, 0));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
