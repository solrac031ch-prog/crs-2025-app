(function () {
  const PDF_URL = "./protocol-docs/Decreto-34_25-OCT-2022.pdf";
  const FORM_URL = "";
  const MODULE_ID = "leyUrgenciasModule";
  const SEARCH_ID = "leyUrgenciasSearchScreen";
  const OPEN_CLASS = "law-search-mode";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9ñ\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function page() {
    return document.querySelector("#formsPage");
  }

  function list() {
    return document.querySelector("#turnFormsList");
  }

  function isFormsPageVisible() {
    const forms = page();
    return Boolean(forms && forms.classList.contains("active"));
  }

  function conditions() {
    return Array.isArray(window.emergencyLawConditions) ? window.emergencyLawConditions : [];
  }

  function addStyles() {
    if (document.querySelector("#ley-urgencias-ui-style")) return;
    const style = document.createElement("style");
    style.id = "ley-urgencias-ui-style";
    style.textContent = `
      #formsPage .ley-law-module,
      #formsPage .ley-search-screen{width:100%;box-sizing:border-box}
      .ley-law-module{display:grid;gap:12px;margin:14px 0;padding:16px;background:#fff;border:1px solid #dbe4df;border-left:7px solid #be123c;border-radius:14px;box-shadow:0 14px 28px rgba(15,23,42,.10)}
      .ley-law-module[hidden]{display:none!important}
      .ley-law-head{display:grid;gap:4px}.ley-law-kicker{color:#be123c;font-size:.76rem;font-weight:950;text-transform:uppercase;letter-spacing:.04em}.ley-law-head h2{margin:0;color:#111827;font-size:clamp(1.22rem,2.4vw,1.7rem);line-height:1.05}.ley-law-head p{margin:0;color:#4b5563;line-height:1.38}
      .ley-law-alert{display:grid;gap:3px;padding:11px 12px;background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;color:#7f1d1d;line-height:1.34}.ley-law-alert strong{font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}.ley-law-alert p{margin:0}
      .ley-law-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ley-law-action{min-height:78px;display:grid;align-content:center;gap:4px;padding:12px;color:#111827;background:#f8fafc;border:1px solid #dbe4df;border-radius:12px;text-align:left;text-decoration:none;font-weight:900;cursor:pointer;transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease}.ley-law-action:hover,.ley-law-action:focus-visible{transform:translateY(-1px);border-color:#be123c;box-shadow:0 10px 20px rgba(15,23,42,.12);outline:none}.ley-law-action span{color:#64748b;font-size:.82rem;font-weight:750;line-height:1.25}.ley-law-action.primary{color:#fff;background:#be123c;border-color:#be123c}.ley-law-action.primary span{color:#ffe4e6}.ley-law-action.pending{background:#fff7ed;border-color:#fed7aa}.ley-law-action.pending span{color:#9a3412}
      .ley-law-pending-note{margin:0;padding:10px 12px;color:#7c2d12;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-weight:800;line-height:1.35}.ley-law-pending-note[hidden]{display:none!important}
      #formsPage.law-search-mode #turnFormsList{display:none!important}.ley-search-screen{display:grid;gap:14px}.ley-search-screen[hidden]{display:none!important}.ley-search-top{display:grid;gap:8px;padding:16px;color:#fff;background:linear-gradient(135deg,#be123c,#111827);border-radius:14px;border-bottom:6px solid #fecdd3;box-shadow:0 14px 28px rgba(15,23,42,.14)}.ley-search-top h2{margin:0;font-size:clamp(1.3rem,2.6vw,1.9rem);line-height:1.05}.ley-search-top p{margin:0;color:#ffe4e6;line-height:1.35}.ley-search-back{justify-self:start;min-height:36px;display:inline-flex;align-items:center;gap:6px;padding:0 11px;color:#7f1d1d;background:#fff;border:1px solid rgba(255,255,255,.3);border-radius:999px;font-weight:950;text-decoration:none;cursor:pointer}
      .ley-search-box{display:grid;gap:8px;padding:13px;background:#fff;border:1px solid #dbe4df;border-radius:12px;box-shadow:0 10px 22px rgba(15,23,42,.08)}.ley-search-box label{display:grid;gap:7px;color:#334155;font-size:.82rem;font-weight:950;text-transform:uppercase}.ley-search-box input{min-height:50px;width:100%;box-sizing:border-box;padding:0 13px;background:#fbfdff;border:2px solid #cbd5e1;border-radius:10px;font-size:1rem;outline:none}.ley-search-box input:focus{border-color:#be123c;box-shadow:0 0 0 4px rgba(190,18,60,.12)}.ley-search-meta{margin:0;color:#64748b;font-weight:850;line-height:1.35}
      .ley-results{display:grid;gap:10px}.ley-empty{padding:13px;color:#475569;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;font-weight:800;line-height:1.4}.ley-result-card{display:grid;gap:8px;padding:14px;background:#fff;border:1px solid #dbe4df;border-left:6px solid #be123c;border-radius:12px;box-shadow:0 10px 20px rgba(15,23,42,.07)}.ley-result-card h3{margin:0;color:#111827;font-size:1.05rem;line-height:1.18}.ley-result-category{justify-self:start;padding:4px 8px;color:#7f1d1d;background:#ffe4e6;border-radius:999px;font-size:.72rem;font-weight:950;text-transform:uppercase}.ley-result-card p{margin:0;color:#334155;line-height:1.38}.ley-result-match{color:#64748b;font-size:.82rem;font-weight:850}
      @media(max-width:760px){.ley-law-actions{grid-template-columns:1fr}.ley-law-action{min-height:64px}.ley-search-top,.ley-law-module{border-radius:12px}}
    `;
    document.head.append(style);
  }

  function closestCard(node) {
    return node?.closest?.(".document-card,.document-item,.form-card,.card,li,a,button") || node;
  }

  function isLeyText(text) {
    const clean = normalize(text);
    return clean.includes("ley de urgencias") || clean.includes("ley urgencias");
  }

  function isNotaText(text) {
    const clean = normalize(text);
    return clean === "nota" || clean === "ver nota" || clean.includes("nota ley de urgencias") || clean.includes("nota ley urgencias");
  }

  function findLeyTrigger() {
    const root = list();
    if (!root) return null;
    const candidates = root.querySelectorAll("a,button,[role='button'],.document-card,.document-item,.form-card,.card,li");
    for (const candidate of candidates) {
      if (candidate.closest(`#${MODULE_ID}`) || candidate.closest(`#${SEARCH_ID}`)) continue;
      if (isLeyText(candidate.textContent)) return candidate.matches("a,button,[role='button']") ? candidate : candidate.querySelector("a,button,[role='button']") || candidate;
    }
    return null;
  }

  function hideLegacyNota(scope) {
    const root = scope || list();
    if (!root) return;
    root.querySelectorAll("a,button,[role='button']").forEach((element) => {
      if (element.closest(`#${MODULE_ID}`) || element.closest(`#${SEARCH_ID}`)) return;
      if (isNotaText(element.textContent)) {
        element.hidden = true;
        element.setAttribute("aria-hidden", "true");
      }
    });
  }

  function moduleMarkup() {
    return `
      <div class="ley-law-head">
        <span class="ley-law-kicker">Ley de Urgencias · Decreto 34</span>
        <h2>Herramienta rápida para activación</h2>
        <p>Usa el buscador para orientar la condición clínica y deja el PDF como respaldo legal completo.</p>
      </div>
      <div class="ley-law-alert" role="alert">
        <strong>Alerta automática</strong>
        <p>La Ley de Urgencias no se activa por diagnóstico aislado: debe existir condición clínica grave, riesgo vital o secuela funcional grave según Decreto 34 y juicio clínico documentado.</p>
      </div>
      <div class="ley-law-actions" aria-label="Acciones Ley de Urgencias">
        <a class="ley-law-action primary" href="${PDF_URL}" target="_blank" rel="noopener noreferrer" data-law-action="pdf">
          Decreto 34
          <span>Abrir PDF completo</span>
        </a>
        <button class="ley-law-action" type="button" data-law-action="search">
          Buscador
          <span>Buscar patología o criterio clínico</span>
        </button>
        <button class="ley-law-action pending" type="button" data-law-action="forms" aria-disabled="true">
          Formularios Ley de Urgencias
          <span>Pendiente de carga</span>
        </button>
      </div>
      <p class="ley-law-pending-note" data-law-pending hidden>Formulario de activación y consentimiento informado aún no configurado. Cuando subas los documentos, conectamos este botón.</p>
    `;
  }

  function ensureModule(trigger) {
    addStyles();
    const root = list();
    if (!root) return null;
    let module = document.getElementById(MODULE_ID);
    if (!module) {
      module = document.createElement("section");
      module.id = MODULE_ID;
      module.className = "ley-law-module";
      module.hidden = true;
      module.innerHTML = moduleMarkup();
      const anchor = closestCard(trigger || findLeyTrigger());
      if (anchor && anchor.parentNode) anchor.insertAdjacentElement("afterend", module);
      else root.prepend(module);
    } else if (!module.innerHTML.trim()) {
      module.innerHTML = moduleMarkup();
    }
    return module;
  }

  function openModule(trigger) {
    clearSearchScreen(false);
    const module = ensureModule(trigger);
    if (!module) return;
    module.hidden = false;
    hideLegacyNota(list());
    module.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function tokenList(query) {
    return normalize(query).split(" ").filter((token) => token.length >= 2);
  }

  function scoreCondition(condition, query) {
    const q = normalize(query);
    const tokens = tokenList(query);
    if (!q || tokens.length === 0) return null;

    const title = normalize(condition.title);
    const category = normalize(condition.category);
    const criteria = normalize(condition.criteria);
    const aliases = (condition.aliases || []).map(normalize);
    let score = 0;
    const matched = [];

    if (title.includes(q)) { score += 80; matched.push("título"); }
    if (category.includes(q)) { score += 35; matched.push("categoría"); }
    if (criteria.includes(q)) { score += 28; matched.push("criterio"); }
    if (aliases.some((alias) => alias.includes(q))) { score += 55; matched.push("sinónimo"); }

    tokens.forEach((token) => {
      if (title.includes(token)) score += 18;
      if (category.includes(token)) score += 8;
      if (criteria.includes(token)) score += 6;
      if (aliases.some((alias) => alias.includes(token))) score += 12;
    });

    return score > 0 ? { condition, score, matched: Array.from(new Set(matched)) } : null;
  }

  function searchConditions(query) {
    return conditions()
      .map((condition) => scoreCondition(condition, query))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.condition.title.localeCompare(b.condition.title, "es"))
      .slice(0, 8);
  }

  function resultCard(match) {
    const item = match.condition;
    const source = match.matched.length ? match.matched.join(", ") : "texto del decreto";
    return `
      <article class="ley-result-card">
        <span class="ley-result-category">${item.category || "Condición clínica"}</span>
        <h3>${item.title}</h3>
        <p>${item.criteria}</p>
        <span class="ley-result-match">Coincidencia por: ${source}</span>
      </article>
    `;
  }

  function renderResults(screen, query) {
    const results = screen.querySelector("[data-law-results]");
    const meta = screen.querySelector("[data-law-meta]");
    if (!results || !meta) return;

    const clean = query.trim();
    if (clean.length < 2) {
      meta.textContent = "Escribe al menos 2 caracteres para buscar.";
      results.innerHTML = `<div class="ley-empty">El buscador compara título, categoría, criterio clínico y sinónimos cargados del Decreto 34.</div>`;
      return;
    }

    const matches = searchConditions(clean);
    meta.textContent = `${matches.length} coincidencia${matches.length === 1 ? "" : "s"} para “${clean}”`;
    results.innerHTML = matches.length
      ? matches.map(resultCard).join("")
      : `<div class="ley-empty">Sin coincidencias claras. Revisa el PDF completo o reformula la búsqueda con otro término clínico.</div>`;
  }

  function searchMarkup() {
    return `
      <div class="ley-search-top">
        <button class="ley-search-back" type="button" data-law-back>← Volver a Ley de Urgencias</button>
        <h2>Buscador Decreto 34</h2>
        <p>Pantalla limpia para buscar una patología, diagnóstico o criterio clínico sin saturar la vista de turno.</p>
      </div>
      <div class="ley-search-box">
        <label>
          Buscar condición clínica
          <input type="search" data-law-search-input autocomplete="off" placeholder="Buscar diagnóstico, patología o criterio clínico" />
        </label>
        <p class="ley-search-meta" data-law-meta></p>
      </div>
      <div class="ley-results" data-law-results aria-live="polite"></div>
    `;
  }

  function showSearchScreen(initialQuery) {
    addStyles();
    const forms = page();
    if (!forms) return;
    let screen = document.getElementById(SEARCH_ID);
    if (!screen) {
      screen = document.createElement("section");
      screen.id = SEARCH_ID;
      screen.className = "ley-search-screen";
      screen.innerHTML = searchMarkup();
      const head = forms.querySelector(".page-head");
      if (head) head.insertAdjacentElement("afterend", screen);
      else forms.prepend(screen);
    }

    forms.classList.add(OPEN_CLASS);
    screen.hidden = false;
    const input = screen.querySelector("[data-law-search-input]");
    if (input && typeof initialQuery === "string") input.value = initialQuery;
    renderResults(screen, input?.value || "");
    setTimeout(() => input?.focus({ preventScroll: true }), 40);
    screen.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearSearchScreen(showHub) {
    const forms = page();
    const screen = document.getElementById(SEARCH_ID);
    if (forms) forms.classList.remove(OPEN_CLASS);
    if (screen) screen.hidden = true;
    if (showHub) {
      const module = ensureModule(findLeyTrigger());
      if (module) {
        module.hidden = false;
        module.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function wireEvents() {
    if (document.body.dataset.leyUrgenciasUiWired) return;
    document.body.dataset.leyUrgenciasUiWired = "true";

    document.addEventListener("click", (event) => {
      const moduleAction = event.target.closest(`#${MODULE_ID} [data-law-action]`);
      if (moduleAction) {
        const action = moduleAction.dataset.lawAction;
        if (action === "pdf") return;
        event.preventDefault();
        if (action === "search") showSearchScreen("");
        if (action === "forms") {
          const note = document.querySelector(`#${MODULE_ID} [data-law-pending]`);
          if (note) note.hidden = false;
        }
        return;
      }

      if (event.target.closest(`#${SEARCH_ID} [data-law-back]`)) {
        event.preventDefault();
        clearSearchScreen(true);
        return;
      }

      const searchInput = event.target.closest(`#${SEARCH_ID} [data-law-search-input]`);
      if (searchInput) return;

      const trigger = event.target.closest("#formsPage a,#formsPage button,#formsPage [role='button'],#formsPage .document-card,#formsPage .document-item,#formsPage .form-card,#formsPage .card");
      if (trigger && !trigger.closest(`#${MODULE_ID}`) && !trigger.closest(`#${SEARCH_ID}`) && isLeyText(trigger.textContent)) {
        event.preventDefault();
        openModule(trigger);
      }
    }, true);

    document.addEventListener("input", (event) => {
      const input = event.target.closest(`#${SEARCH_ID} [data-law-search-input]`);
      if (!input) return;
      const screen = document.getElementById(SEARCH_ID);
      if (screen) renderResults(screen, input.value);
    });
  }

  function patch() {
    addStyles();
    wireEvents();
    if (!isFormsPageVisible()) return;
    hideLegacyNota(list());
    if (document.getElementById(MODULE_ID)) ensureModule(findLeyTrigger());
  }

  const observer = new MutationObserver(() => patch());
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => setTimeout(patch, 80));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
