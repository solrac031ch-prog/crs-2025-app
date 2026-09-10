(() => {
  const STORAGE_KEY = "crs_quick_access_v1";
  const MAX_RECENTS = 5;
  const MAX_RESULTS = 9;

  const routeItems = [
    ["Especialidades", "#/especialidades", "Flujos, CRS, policlínicos, hospitalizados y protocolos", "Derivar"],
    ["Llamados y UHD", "#/llamados", "Especialistas de llamado y hospitalización domiciliaria", "Turno"],
    ["Visita diaria", "#/visita", "Planilla AM/PM compartida", "Visita"],
    ["Formularios", "#/formularios", "Documentos frecuentes del turno", "Documentos"],
    ["Directorio telefónico", "#/telefonos", "Anexos y contactos frecuentes", "Directorio"],
    ["Noticias", "#/noticias", "Avisos y publicaciones vigentes", "Comunidad"],
    ["Educación médica", "#/educacion", "Material docente y recursos", "Docencia"],
    ["Paper del mes", "#/paper", "Lectura y repositorio mensual", "Lectura"],
    ["Casos prioritarios", "#/gestion", "Seguimiento operativo de pacientes y tareas", "Gestión"],
    ["Jefatura", "#/jefatura", "Publicaciones, documentos y usuarios", "Admin"]
  ].map(([title, href, summary, kicker]) => ({ type: "route", title, href, summary, kicker }));

  const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  function safeRead() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        counts: parsed.counts && typeof parsed.counts === "object" ? parsed.counts : {},
        recents: Array.isArray(parsed.recents) ? parsed.recents : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : []
      };
    } catch (_) { return { counts: {}, recents: [], favorites: [] }; }
  }
  function safeWrite(value) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {} }

  function protocolItems() {
    return (window.CRS_PROTOCOLS || []).filter((item) => item?.title && item.category !== "Regla general").map((item) => {
      const display = String(item.title).replace(/^Poli Choque\s+/i, "").replace(/^Flujo\s+/i, "");
      return {
        type: "protocol", title: display, href: `#/especialidad/${slugify(display)}`,
        summary: item.summary || item.category || "Protocolo", kicker: item.category || "Protocolo",
        haystack: normalize([item.title, item.category, item.summary, ...(item.tags || []), ...(item.fields || []).flat(), ...(item.flow || []), ...((item.moments || []).flatMap((m) => [m.title, m.text, m.alert || "", ...(m.steps || [])])), ...((item.pathologies || []).flat(2)), item.warning || ""].join(" "))
      };
    });
  }

  function formItems() {
    return (window.CRS_FORMS_DATA?.turnForms || []).map((item) => ({
      type: "form", title: item.title, href: "#/formularios", summary: item.description || "Formulario de turno", kicker: "Formulario",
      haystack: normalize(`${item.title} ${item.description || ""} ${item.actionLabel || ""}`)
    }));
  }

  function notificationItems() {
    return (window.CRS_FORMS_DATA?.mandatoryNotificationDiseases || []).map((item) => ({
      type: "notification", title: item.name, href: "#/formularios", summary: `${item.type}: ${item.trigger}`, kicker: "ENO",
      haystack: normalize(`${item.name} ${item.aliases || ""} ${item.type} ${item.trigger}`)
    }));
  }

  function lawItems() {
    const source = window.CRS_FORMS_DATA;
    if (!source) return [];
    return (source.emergencyLawGroups || []).map((item) => ({
      type: "law", title: `Ley de urgencias · ${item.title}`, href: "#/formularios", summary: item.description || "Criterios Ley de Urgencias", kicker: "Ley de urgencias",
      haystack: normalize(`${item.title} ${item.description || ""} ${(item.categories || []).join(" ")} ${Object.entries(source.emergencyLawSearchExpansions || {}).flat().join(" ")}`)
    }));
  }

  function onCallItems() {
    const schedule = window.CRS_APP_OPERATIONAL?.onCallSchedule;
    return (schedule?.rows || []).map((item) => ({
      type: "oncall", title: item.specialty, href: "#/llamados", summary: `Especialista de llamado · ${schedule.label || "turno"}`, kicker: "Llamado",
      haystack: normalize(`${item.specialty} ${(item.aliases || []).join(" ")} ${Object.values(item.days || {}).join(" ")}`)
    }));
  }

  function operationalItems() {
    const operational = window.CRS_APP_OPERATIONAL || {};
    const items = [];
    if (operational.externalDocs?.uhdDisponibilidadUrl || routeItems.length) items.push({ type: "operational", title: "UHD", href: "#/llamados", summary: "Unidad de Hospitalización Domiciliaria y disponibilidad", kicker: "Turno", haystack: "uhd hospitalizacion domiciliaria disponibilidad medico" });
    if (operational.externalDocs?.telefonosUrgenciaUrl) items.push({ type: "directory", title: "Teléfonos y anexos HPH", href: "#/telefonos", summary: "Directorio telefónico de Urgencia HPH", kicker: "Directorio", haystack: "telefono telefonos anexo anexos contacto contactos urgencia hph" });
    return items;
  }

  function allItems() { return [...routeItems, ...protocolItems(), ...formItems(), ...notificationItems(), ...lawItems(), ...onCallItems(), ...operationalItems()]; }
  function findItem(href) { return allItems().find((item) => item.href === href) || null; }

  function recordVisit(href) {
    if (!href || href === "#/inicio") return;
    const item = findItem(href.split("?")[0]); if (!item) return;
    const state = safeRead(); state.counts[item.href] = (Number(state.counts[item.href]) || 0) + 1;
    state.recents = [item.href, ...state.recents.filter((v) => v !== item.href)].slice(0, MAX_RECENTS); safeWrite(state);
  }
  function toggleFavorite(href) {
    const item = findItem(href); if (!item) return; const state = safeRead(); const active = state.favorites.includes(href);
    state.favorites = active ? state.favorites.filter((v) => v !== href) : [href, ...state.favorites.filter((v) => v !== href)].slice(0, 8);
    safeWrite(state); renderPersonalized(); const input = document.querySelector("#homeQuickSearch"); if (input) renderResults(input.value);
  }
  function makeQuickLink(item) {
    const link = document.createElement("a"); link.className = "quick-access-chip"; link.href = item.href;
    const kicker = document.createElement("span"); kicker.textContent = item.kicker || "Acceso"; const title = document.createElement("strong"); title.textContent = item.title; link.append(kicker, title); return link;
  }
  function renderCollection(host, items, emptyText) {
    host.innerHTML = ""; if (!items.length) { const empty = document.createElement("span"); empty.className = "quick-access-empty"; empty.textContent = emptyText; host.append(empty); return; }
    items.forEach((item) => host.append(makeQuickLink(item)));
  }
  function renderPersonalized() {
    const frequentHost = document.querySelector("#homeFrequent"), recentHost = document.querySelector("#homeRecent"), favoriteHost = document.querySelector("#homeFavorites"); if (!frequentHost || !recentHost || !favoriteHost) return;
    const state = safeRead(); const ranked = Object.entries(state.counts).sort((a,b) => b[1]-a[1]).map(([href]) => findItem(href)).filter(Boolean).slice(0,4);
    renderCollection(frequentHost, ranked.length ? ranked : routeItems.slice(0,4), "Se ajustará según tu uso.");
    renderCollection(recentHost, state.recents.map(findItem).filter(Boolean).slice(0,4), "Aparecerán después de abrir tus primeros flujos.");
    renderCollection(favoriteHost, state.favorites.map(findItem).filter(Boolean).slice(0,4), "Marca ☆ en una búsqueda para fijar un acceso.");
  }

  function searchItems(query) {
    const q = normalize(query.trim()); if (!q) return []; const terms = q.split(/\s+/).filter(Boolean);
    return allItems().map((item) => {
      const title = normalize(item.title), haystack = item.haystack || normalize(`${item.title} ${item.summary} ${item.kicker}`); let score = 0;
      if (title === q) score += 120; if (title.startsWith(q)) score += 70; if (title.includes(q)) score += 40;
      terms.forEach((term) => { if (title.includes(term)) score += 18; if (haystack.includes(term)) score += 6; });
      if (item.type === "protocol") score += 2; return { item, score };
    }).filter((e) => e.score > 0).sort((a,b) => b.score-a.score || a.item.title.localeCompare(b.item.title,"es")).slice(0,MAX_RESULTS).map((e) => e.item);
  }

  function renderResults(query) {
    const resultsHost = document.querySelector("#homeQuickResults"), status = document.querySelector("#homeQuickStatus"); if (!resultsHost || !status) return;
    const results = searchItems(query), state = safeRead(); resultsHost.innerHTML = ""; resultsHost.hidden = !query.trim();
    if (!query.trim()) { status.textContent = "Busca en todo MASTER: flujo, formulario, llamado, ENO, Ley de Urgencias o anexo."; return; }
    status.textContent = results.length ? `${results.length} coincidencias en MASTER` : "Sin coincidencias";
    results.forEach((item) => {
      const row = document.createElement("div"); row.className = "quick-search-row"; const link = document.createElement("a"); link.className = "quick-search-result"; link.href = item.href;
      const type = document.createElement("span"); type.className = "quick-search-type"; type.textContent = item.kicker || "MASTER"; const title = document.createElement("strong"); title.textContent = item.title; const summary = document.createElement("span"); summary.textContent = item.summary || ""; link.append(type,title,summary);
      const favorite = document.createElement("button"), active = state.favorites.includes(item.href); favorite.type="button"; favorite.className="quick-favorite-button"; favorite.dataset.favoriteHref=item.href; favorite.setAttribute("aria-label",active?`Quitar ${item.title} de favoritos`:`Agregar ${item.title} a favoritos`); favorite.setAttribute("aria-pressed",String(active)); favorite.textContent=active?"★":"☆"; row.append(link,favorite); resultsHost.append(row);
    });
  }

  function setup() {
    const input = document.querySelector("#homeQuickSearch"); if (!input) return;
    input.placeholder = "Buscar en MASTER: TVP, VIH, neuro, transfusión, UHD, anexo…";
    input.addEventListener("input",()=>renderResults(input.value));
    input.addEventListener("keydown",(event)=>{ if(event.key==="Escape"&&input.value){input.value="";renderResults("");} if(event.key==="Enter"){const first=document.querySelector("#homeQuickResults .quick-search-result");if(first){event.preventDefault();first.click();}} });
    document.addEventListener("keydown",(event)=>{const target=event.target,typing=target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target?.isContentEditable;if(event.key==="/"&&!typing&&(window.location.hash||"#/inicio").startsWith("#/inicio")){event.preventDefault();input.focus();}});
    document.addEventListener("click",(event)=>{const favorite=event.target.closest("[data-favorite-href]");if(favorite){toggleFavorite(favorite.dataset.favoriteHref);return;}const link=event.target.closest("a[href^='#/']");if(link)recordVisit(link.getAttribute("href"));});
    window.addEventListener("hashchange",()=>{recordVisit(window.location.hash);if((window.location.hash||"#/inicio").startsWith("#/inicio"))renderPersonalized();}); renderPersonalized();renderResults("");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();