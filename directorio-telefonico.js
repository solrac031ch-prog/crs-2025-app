(() => {
  const title = "Directorio telefónico";
  const sections = [
    ["Gestion de Camas", "hospitalizacion", "Unidad de Gestion de Camas", [["Gestion de Camas", "260778"], ["Ambulancias HPH", "260559"]]],
    ["Informatica", "apoyo", "Departamento de Informatica", [["Mesa de Ayuda", "260597"], ["Informatica Urgencia", "222270"]]],
    ["Operaciones", "apoyo", "Ingenieria y Operaciones", [["Talleres Supervisor", "260558"], ["Talleres", "222257"], ["Calderas", "260560"], ["Biomedica Equipos Medicos", "260756"], ["Guardias", "260551"], ["Roperia", "260580"], ["Empresa de Aseo", "260561"], ["Registro Civil", "226114029"]]],
    ["Alimentacion", "apoyo", "Alimentacion", [["Nutricion", "260571 / 260721"]]],
    ["Abastecimiento", "apoyo", "Abastecimiento", [["Insumos", "265292"]]],
    ["Farmacia", "apoyo", "Farmacia", [["Quimicos Farmaceuticos", "222222"], ["Farmacia", "260585"]]],
    ["Domiciliaria", "hospitalizacion", "Hospitalizacion Domiciliaria", [["Hospitalizacion Domiciliaria", "260769"]]],
    ["Segundo Piso", "hospitalizacion", "Hospitalizacion Segundo Piso", [["Enfermeria CX Basico 2do Piso", "222043"]]],
    ["Cuarto Piso", "hospitalizacion", "Hospitalizacion Cuarto Piso", [["ACE (413 a 418) / Agudo 1 (414 a 417)", "260703"], ["ACE (425 a 426) / Agudo 2 (421 a 424)", "260704"], ["UTAC (427-428-429) / Cuidados Basicos Sur Poniente (430 a 435)", "260705"], ["Cuidados Basicos Nor Poniente (401 a 412)", "222248"]]],
    ["Quinto Piso", "hospitalizacion", "Hospitalizacion Quinto Piso", [["UTI Nor Oriente (513-514)", "222230"], ["UTI Sur Oriente (515-516)", "260720"], ["Cirugia Basico", "260719 / 260764"]]],
    ["Sexto Piso", "hospitalizacion", "Hospitalizacion Sexto Piso", [["Sexto Piso (Geriatria - Agudo) (601-620)", "260873 / 260872"]]],
    ["UPC", "critico", "Cuidados Criticos (UPC)", [["Cuidados Intensivos 1 (104-1 a 104-6)", "260641"], ["Cuidados Intensivos 2 (105-1 a 105-6)", "260642"]]],
    ["Urgencia Maternidad", "urgencia", "Urgencia Maternidad", [["3 Piso Maternidad", "260693"], ["Est. Enfermeria Urgencia", "260654"]]],
    ["Interculturalidad", "ambulatorio", "Interculturalidad", [["Facilitadora Creole", "56932421714"], ["Unidad de Salud Intercultural", "260524"]]],
    ["Ambulatorio", "ambulatorio", "Ambulatorio", [["Dialisis / Endoscopia", "260709 / 260543"], ["Oftalmologia", "260542"], ["Cardiologia", "260752"], ["Otorrinolaringologia", "260532"], ["Cuidados Paliativos", "260545"], ["Salud Mental", "260527"], ["Urologia", "260855"], ["Anatomia Patologica", "260584"]]],
    ["Urgencia Adulto", "urgencia", "Unidad de Emergencia Adulto", [["Enfermera Supervisora", "260782"], ["Enfermera Tecnica", "260765"], ["Secretaria", "260780"], ["Admision", "260767"], ["Informaciones", "260708 / 260865"], ["Observacion 1", "260761 / 260763"], ["Observacion 2", "260267 / 222269"], ["ERA 2", "260864"], ["Box", "260766"], ["REA 1", "260760"], ["REA 2", "260784"], ["Carabinero", "222603 / 9-94269977"]]],
    ["Imagenologia", "diagnostico", "Unidad de Imagenologia", [["Rayos", "260511"], ["Sala Escaner", "260512"], ["Escaner Urgencia", "222089"], ["Ecografia", "222213"]]],
    ["Laboratorio", "diagnostico", "Laboratorio", [["Laboratorio de Microbiologia", "260515"], ["Laboratorio de Hematologia", "260516"], ["Laboratorio Urgencia", "222214"], ["Recepcion de Muestras Hospital", "260518"]]],
    ["Transfusional", "diagnostico", "Medicina Transfusional", [["UMT", "260519"], ["Banco Sangre", "260520"]]],
    ["Pabellones", "critico", "Pabellones y Esterilizacion", [["Pabellon Central", "260631 / 260632"]]],
    ["Dialisis Externa", "externo", "Centro de Dialisis", [["Vespucio - Max Jara 10111, La Granja", "232424170 / 225469373"], ["La Granja - Canto General 050, La Granja", "2-5439958"], ["San Gabriel - Av Gabriela 02540, La Pintana", "22 5429264"], ["San Ramon - Av. Ossa 1891, San Ramon", "22-5436264"], ["Nephrocare - Av Macken 6969, La Florida", "2217141"], ["Dialisis 300 - Duble Almeyda 2911, Nunoa", "3264660"], ["Renacer - Santa Ester 747, San Miguel", "5523967"]]],
    ["Extrasistema", "externo", "Extrasistema", [["Clinica Ensenada", "227900100"], ["Hemodinamia HSR", "262250"], ["Imagenologia HLF", "221361"], ["Imagenologia HSR", "262466"], ["Neurocirugia HSR", "262503 / 262284"], ["Neurologia HSR", "225762779"], ["Maxilo", "262356", "HSR"], ["Reanimador HSR", "262353"]]]
  ];

  const filters = [["todos", "Todos"], ["urgencia", "Urgencia"], ["critico", "Criticos"], ["hospitalizacion", "Hospitalizacion"], ["diagnostico", "Diagnostico"], ["apoyo", "Apoyo"], ["ambulatorio", "Ambulatorio"], ["externo", "Externo"]];
  const quickSearches = [["REA 1 / REA 2", "REA"], ["Laboratorio Urgencia", "Laboratorio Urgencia"], ["Ambulancias HPH", "Ambulancias HPH"], ["Telefonos HSR", "HSR"], ["Telefonos HLF", "HLF"]];
  const state = { query: "", filter: "todos" };
  const totalContacts = sections.reduce((sum, section) => sum + section[3].length, 0);
  let rootObserver = null;
  let observedRoot = null;

  function text(value) { return String(value || "").toLowerCase(); }
  function tel(value) { return value.replace(/[^0-9+]/g, ""); }
  function splitPhones(value) { return value.split("/").map((item) => item.trim()).filter(Boolean); }
  function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function setLabels() {
    const navLink = document.querySelector('[data-route-link="telefonos"]');
    if (navLink) navLink.textContent = title;
    const pageTitle = document.querySelector("#phonesTitle");
    if (pageTitle) pageTitle.textContent = title;
    const pageEyebrow = document.querySelector("#phonesPage .eyebrow");
    if (pageEyebrow) pageEyebrow.textContent = "Telefonos y anexos";
    document.querySelectorAll('a[href="#/telefonos"]').forEach((link) => {
      const kicker = link.querySelector(".action-kicker");
      const strong = link.querySelector("strong");
      const description = Array.from(link.children).find((child) => child.tagName === "SPAN" && !child.classList.contains("action-top"));
      if (kicker) kicker.textContent = "Directorio";
      if (strong) strong.textContent = title;
      if (description) description.textContent = "Anexos y contactos frecuentes.";
    });
  }

  function addStyles() {
    if (document.querySelector("#phone-directory-style")) return;
    const style = document.createElement("style");
    style.id = "phone-directory-style";
    style.textContent = `
      .dt-shell{display:grid;gap:14px}.dt-sos{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:14px;align-items:center;padding:clamp(16px,4vw,24px);color:#fff;background:linear-gradient(135deg,#961f18,#c93328 58%,#b66d08);border-radius:8px;box-shadow:var(--shadow)}
      .dt-sos span,.dt-kicker,.dt-search span,.dt-count span{font-size:.78rem;font-weight:900;text-transform:uppercase;color:inherit}.dt-sos h2{margin:4px 0 0;font-size:clamp(1.45rem,4vw,2.55rem);line-height:1.03}.dt-sos a{min-width:170px;display:grid;gap:4px;justify-items:center;padding:14px;color:#fff;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.38);border-radius:8px;text-decoration:none}.dt-sos strong{font-size:clamp(2rem,5vw,3.1rem);line-height:1}
      .dt-quick{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.dt-quick button{display:grid;gap:9px;min-height:104px;padding:14px;color:var(--ink);text-align:left;background:var(--panel);border:1px solid var(--line);border-left:6px solid var(--danger);border-radius:8px;box-shadow:var(--shadow);cursor:pointer}.dt-quick button:nth-child(2){border-left-color:#b7791f}.dt-quick button:nth-child(3){border-left-color:var(--blue)}.dt-quick button:nth-child(4){border-left-color:var(--accent)}.dt-quick button:nth-child(5){border-left-color:#22577a}.dt-quick small,.dt-kicker,.dt-search span,.dt-count span{color:var(--muted);font-weight:800}
      .dt-tools{display:grid;grid-template-columns:minmax(220px,1fr)auto;gap:10px}.dt-search{display:grid;gap:7px;padding:12px;background:var(--panel);border:1px solid var(--line);border-radius:8px}.dt-search input{min-height:46px;padding:0 13px;color:var(--ink);background:#fbfcfc;border:1px solid var(--line-strong);border-radius:6px;outline:none}.dt-search input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.dt-count{min-width:106px;display:grid;place-items:center;padding:10px;text-align:center;background:var(--panel);border:1px solid var(--line);border-radius:8px}.dt-count strong{font-size:1.65rem;line-height:1}
      .dt-filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}.dt-chip{min-height:38px;flex:0 0 auto;padding:0 12px;color:var(--ink);background:#fff;border:1px solid var(--line-strong);border-radius:6px;cursor:pointer;font-weight:800}.dt-chip.is-active{color:#fff;background:var(--accent-dark);border-color:var(--accent-dark)}.dt-results{display:grid;gap:10px}
      .dt-section{background:var(--panel);border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow);overflow:hidden}.dt-section summary{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:10px;align-items:center;padding:14px;cursor:pointer;list-style:none}.dt-section summary::-webkit-details-marker{display:none}.dt-section small{display:block;margin-top:3px;color:var(--muted);font-weight:700}.dt-section b{min-width:32px;padding:5px 8px;color:var(--accent-dark);background:var(--accent-soft);border-radius:999px;font-size:.78rem;text-align:center}.dt-body{border-top:1px solid var(--line)}
      .dt-row{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:10px;align-items:center;padding:12px 14px;background:#fff}.dt-row+.dt-row{border-top:1px solid #edf0ed}.dt-main{display:grid;gap:7px}.dt-main strong{line-height:1.18;overflow-wrap:anywhere}.dt-phones{display:flex;flex-wrap:wrap;gap:7px}.dt-phone{min-height:32px;display:inline-flex;align-items:center;gap:6px;padding:5px 9px;color:#8a1f17;background:#fff1ef;border:1px solid #ffd1cb;border-radius:999px;font-weight:900;text-decoration:none;white-space:nowrap}.dt-copy{width:38px;height:38px;display:grid;place-items:center;color:var(--muted);background:#fff;border:1px solid var(--line-strong);border-radius:6px;cursor:pointer}.dt-empty{padding:22px;color:var(--muted);background:var(--panel);border:1px dashed var(--line-strong);border-radius:8px}
      .dt-toast{position:fixed;right:16px;bottom:16px;z-index:50;max-width:min(360px,calc(100% - 32px));padding:12px 14px;color:#fff;background:#101214;border-radius:8px;box-shadow:var(--shadow);opacity:0;transform:translateY(12px);transition:opacity 160ms ease,transform 160ms ease;pointer-events:none;font-weight:800}.dt-toast.is-visible{opacity:1;transform:translateY(0)}
      @media(max-width:1080px){.dt-quick{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.dt-quick{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.dt-sos,.dt-tools{grid-template-columns:1fr}.dt-quick{grid-template-columns:1fr}.dt-sos a,.dt-count{width:100%}}
    `;
    document.head.append(style);
  }

  function phoneLinks(phoneText) { return splitPhones(phoneText).map((phone) => `<a class="dt-phone" href="tel:${tel(phone)}"><span aria-hidden="true">&#9742;</span>${escapeHtml(phone)}</a>`).join(""); }
  function filterSections() {
    const query = text(state.query.trim());
    return sections.map((section) => {
      const [label, category, heading, contacts] = section;
      const visible = contacts.filter(([name, phone, tags = ""]) => {
        const inFilter = state.filter === "todos" || category === state.filter;
        const haystack = text(`${heading} ${label} ${name} ${phone} ${tags}`);
        return inFilter && (!query || haystack.includes(query));
      });
      return [label, category, heading, visible];
    }).filter((section) => section[3].length);
  }

  function renderResults(root) {
    if (!hasDirectoryMarkup(root)) { root.dataset.directoryReady = "false"; build(root); return; }
    const matches = filterSections();
    const count = matches.reduce((sum, section) => sum + section[3].length, 0);
    root.querySelector("[data-dt-count]").textContent = count;
    root.querySelector("[data-dt-total]").textContent = `de ${totalContacts}`;
    root.querySelectorAll("[data-dt-filter]").forEach((button) => button.classList.toggle("is-active", button.dataset.dtFilter === state.filter));
    root.querySelector("[data-dt-results]").innerHTML = matches.length ? matches.map((section) => {
      const [, category, heading, contacts] = section;
      const open = state.query.trim() || ["urgencia", "critico", "diagnostico"].includes(category) ? "open" : "";
      return `<details class="dt-section" ${open}><summary><span><strong>${escapeHtml(heading)}</strong><small>${contacts.length} contactos</small></span><b>${contacts.length}</b></summary><div class="dt-body">${contacts.map(([name, phone]) => `<div class="dt-row"><div class="dt-main"><strong>${escapeHtml(name)}</strong><div class="dt-phones">${phoneLinks(phone)}</div></div><button class="dt-copy" type="button" data-dt-copy="${escapeHtml(`${name}: ${phone}`)}" aria-label="Copiar ${escapeHtml(name)}">&#10697;</button></div>`).join("")}</div></details>`;
    }).join("") : '<div class="dt-empty">No hay resultados para esta busqueda.</div>';
  }

  function showToast(root, message) {
    const toast = root.querySelector("[data-dt-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1700);
  }
  function copyText(root, value) {
    const done = () => showToast(root, `Copiado: ${value}`);
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(value).then(done).catch(() => showToast(root, value)); return; }
    showToast(root, value);
  }
  function hasDirectoryMarkup(root) { return Boolean(root.querySelector("[data-dt-count]") && root.querySelector("[data-dt-total]") && root.querySelector("[data-dt-results]")); }
  function watchRoot(root) {
    if (observedRoot === root) return;
    if (rootObserver) rootObserver.disconnect();
    observedRoot = root;
    rootObserver = new MutationObserver(() => {
      if (!location.hash.startsWith("#/telefonos")) return;
      if (hasDirectoryMarkup(root)) return;
      root.dataset.directoryReady = "false";
      build(root);
    });
    rootObserver.observe(root, { childList: true });
  }

  function build(root) {
    if (root.dataset.directoryReady === "true" && hasDirectoryMarkup(root)) { renderResults(root); return; }
    root.dataset.directoryReady = "true";
    root.innerHTML = `<section class="dt-shell"><section class="dt-sos"><div><span>S.O.S.</span><h2>Emergencias, claves rojas y amarilla</h2></div><a href="tel:260745"><small>Anexo directo</small><strong>260745</strong></a></section><section class="dt-quick" aria-label="Accesos rapidos">${quickSearches.map(([label, query]) => `<button type="button" data-dt-quick="${escapeHtml(query)}"><span class="dt-kicker">Acceso rapido</span><strong>${escapeHtml(label)}</strong><small>Ver contactos</small></button>`).join("")}</section><section class="dt-tools"><label class="dt-search"><span>Buscar</span><input data-dt-search type="search" placeholder="Buscar por nombre, area o numero" autocomplete="off" /></label><div class="dt-count"><strong data-dt-count>0</strong><span data-dt-total>de ${totalContacts}</span></div></section><nav class="dt-filters" aria-label="Filtros de directorio">${filters.map(([value, label]) => `<button class="dt-chip" type="button" data-dt-filter="${value}">${escapeHtml(label)}</button>`).join("")}</nav><section class="dt-results" data-dt-results aria-live="polite"></section></section><div class="dt-toast" data-dt-toast role="status" aria-live="polite"></div>`;
    root.addEventListener("input", (event) => { const input = event.target.closest("[data-dt-search]"); if (!input) return; state.query = input.value; renderResults(root); });
    root.addEventListener("click", (event) => {
      const quick = event.target.closest("[data-dt-quick]");
      const filter = event.target.closest("[data-dt-filter]");
      const copy = event.target.closest("[data-dt-copy]");
      if (quick) { state.query = quick.dataset.dtQuick; state.filter = "todos"; const input = root.querySelector("[data-dt-search]"); if (input) { input.value = state.query; input.focus({ preventScroll: true }); } renderResults(root); return; }
      if (filter) { state.filter = filter.dataset.dtFilter; renderResults(root); return; }
      if (copy) copyText(root, copy.dataset.dtCopy);
    });
    renderResults(root);
  }

  function render() {
    setLabels();
    if (!location.hash.startsWith("#/telefonos")) return;
    const root = document.querySelector("#phonesContent");
    if (!root) return;
    addStyles();
    watchRoot(root);
    build(root);
  }
  function scheduleRender() { setTimeout(render, 0); setTimeout(render, 120); setTimeout(render, 500); setTimeout(render, 1200); }
  window.addEventListener("hashchange", scheduleRender);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleRender);
  else scheduleRender();
})();
