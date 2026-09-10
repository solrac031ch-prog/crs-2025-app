(() => {
  const STORAGE_KEY = "crs_quick_access_v1";
  const MAX_RECENTS = 5;
  const MAX_RESULTS = 7;

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

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  function safeRead() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        counts: parsed.counts && typeof parsed.counts === "object" ? parsed.counts : {},
        recents: Array.isArray(parsed.recents) ? parsed.recents : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : []
      };
    } catch (_) {
      return { counts: {}, recents: [], favorites: [] };
    }
  }

  function safeWrite(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function protocolItems() {
    return (window.CRS_PROTOCOLS || [])
      .filter((item) => item?.title && item.category !== "Regla general")
      .map((item) => {
        const slug = normalize(item.title)
          .replace(/^poli choque\s+/i, "")
          .replace(/^flujo\s+/i, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return {
          type: "protocol",
          title: String(item.title).replace(/^Poli Choque\s+/i, "").replace(/^Flujo\s+/i, ""),
          href: `#/especialidad/${slug}`,
          summary: item.summary || item.category || "Protocolo",
          kicker: item.category || "Protocolo",
          haystack: normalize([
            item.title,
            item.category,
            item.summary,
            ...(item.tags || []),
            ...(item.fields || []).flat(),
            ...(item.flow || [])
          ].join(" "))
        };
      });
  }

  function allItems() {
    return [...routeItems, ...protocolItems()];
  }

  function findItem(href) {
    return allItems().find((item) => item.href === href) || routeItems.find((item) => item.href === href);
  }

  function recordVisit(href) {
    if (!href || href === "#/inicio") return;
    const item = findItem(href.split("?")[0]);
    if (!item) return;
    const state = safeRead();
    state.counts[item.href] = (Number(state.counts[item.href]) || 0) + 1;
    state.recents = [item.href, ...state.recents.filter((value) => value !== item.href)].slice(0, MAX_RECENTS);
    safeWrite(state);
  }

  function makeQuickLink(item, className = "quick-access-chip") {
    const link = document.createElement("a");
    link.className = className;
    link.href = item.href;
    link.innerHTML = `<span>${item.kicker || "Acceso"}</span><strong>${item.title}</strong>`;
    return link;
  }

  function renderPersonalized() {
    const frequentHost = document.querySelector("#homeFrequent");
    const recentHost = document.querySelector("#homeRecent");
    if (!frequentHost || !recentHost) return;

    const state = safeRead();
    const ranked = Object.entries(state.counts)
      .sort((a, b) => b[1] - a[1])
      .map(([href]) => findItem(href))
      .filter(Boolean)
      .slice(0, 4);
    const frequent = ranked.length ? ranked : routeItems.slice(0, 4);
    const recent = state.recents.map(findItem).filter(Boolean).slice(0, 4);

    frequentHost.innerHTML = "";
    recentHost.innerHTML = "";
    frequent.forEach((item) => frequentHost.append(makeQuickLink(item)));
    (recent.length ? recent : routeItems.slice(0, 3)).forEach((item) => recentHost.append(makeQuickLink(item)));
  }

  function searchItems(query) {
    const q = normalize(query.trim());
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return allItems()
      .map((item) => {
        const title = normalize(item.title);
        const haystack = item.haystack || normalize(`${item.title} ${item.summary} ${item.kicker}`);
        let score = 0;
        if (title === q) score += 100;
        if (title.startsWith(q)) score += 60;
        if (title.includes(q)) score += 35;
        terms.forEach((term) => {
          if (title.includes(term)) score += 16;
          if (haystack.includes(term)) score += 5;
        });
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "es"))
      .slice(0, MAX_RESULTS)
      .map((entry) => entry.item);
  }

  function renderResults(query) {
    const resultsHost = document.querySelector("#homeQuickResults");
    const status = document.querySelector("#homeQuickStatus");
    if (!resultsHost || !status) return;
    const results = searchItems(query);
    resultsHost.innerHTML = "";
    resultsHost.hidden = !query.trim();
    if (!query.trim()) {
      status.textContent = "Busca un flujo o abre uno de tus accesos frecuentes.";
      return;
    }
    status.textContent = results.length ? `${results.length} coincidencias` : "Sin coincidencias";
    results.forEach((item) => {
      const link = document.createElement("a");
      link.className = "quick-search-result";
      link.href = item.href;
      const typeLabel = item.type === "protocol" ? item.kicker : "Módulo";
      link.innerHTML = `<span class="quick-search-type">${typeLabel}</span><strong>${item.title}</strong><span>${item.summary || ""}</span>`;
      resultsHost.append(link);
    });
  }

  function setup() {
    const input = document.querySelector("#homeQuickSearch");
    if (!input) return;
    input.addEventListener("input", () => renderResults(input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && input.value) {
        input.value = "";
        renderResults("");
      }
      if (event.key === "Enter") {
        const first = document.querySelector("#homeQuickResults a");
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if (event.key === "/" && !typing && (window.location.hash || "#/inicio").startsWith("#/inicio")) {
        event.preventDefault();
        input.focus();
      }
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#/']");
      if (link) recordVisit(link.getAttribute("href"));
    });
    window.addEventListener("hashchange", () => {
      recordVisit(window.location.hash);
      if ((window.location.hash || "#/inicio").startsWith("#/inicio")) renderPersonalized();
    });

    renderPersonalized();
    renderResults("");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();