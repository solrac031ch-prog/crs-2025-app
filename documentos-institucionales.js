(() => {
  const MANAGED = [
    {
      key: "antimicrobianosHph",
      title: "Antimicrobianos H. Padre Hurtado",
      description: "Formulario institucional vigente para solicitudes relacionadas con antimicrobianos del Hospital Padre Hurtado.",
      publicTitle: "Antimicrobianos H. Padre Hurtado",
      publicLabel: "Abrir formulario antimicrobianos"
    },
    {
      key: "examenesManualesHph",
      title: "Orden de examenes manuales HPH",
      description: "Formato manual vigente para completar, imprimir o guardar como PDF.",
      publicTitle: "Orden de examenes manuales HPH",
      publicLabel: "Abrir orden de examenes"
    },
    {
      key: "transfusion",
      title: "Transfusion",
      description: "Documento manual vigente para transfusión y respaldo operativo asociado.",
      publicTitle: "Transfusion",
      publicLabel: "Abrir documento de transfusion"
    },
    {
      key: "medicamentosUsoOcasional",
      title: "Medicamentos de uso ocasional",
      description: "Formulario vigente para solicitud de fármaco no considerado en arsenal.",
      publicTitle: "Medicamentos de uso ocasional",
      publicLabel: "Abrir formulario medicamentos"
    },
    {
      key: "solicitudVih",
      title: "Solicitud de VIH",
      description: "Formulario institucional vigente para solicitud de VIH.",
      publicTitle: "Solicitud de VIH",
      publicLabel: "Abrir solicitud de VIH"
    },
    {
      key: "notificacionObligatoria",
      title: "Notificación obligatoria",
      description: "Enlace institucional vigente para notificación obligatoria / EPIVIGILA.",
      publicTitle: "Formularios de notificación obligatoria",
      publicLabel: "Abrir EPIVIGILA",
      linkOnly: true
    },
    {
      key: "leyUrgenciasDecreto",
      title: "Ley de Urgencias · Decreto 34",
      description: "PDF completo del Decreto 34 usado como respaldo normativo."
    },
    {
      key: "leyUrgenciasActivacion",
      title: "Ley de Urgencias · Formulario de activación",
      description: "Formulario vigente para activación de Ley de Urgencias."
    },
    {
      key: "leyUrgenciasConsentimiento",
      title: "Ley de Urgencias · Consentimiento",
      description: "Consentimiento vigente asociado a traslado / Ley de Urgencias."
    }
  ];

  const LEGACY_JEFATURA_TITLES = new Set([
    "Medicamentos de uso ocasional",
    "Ley de Urgencias",
    "Notificación obligatoria"
  ]);
  const MANAGED_TITLES = new Set([
    ...MANAGED.map((item) => item.title),
    ...MANAGED.map((item) => item.publicTitle).filter(Boolean),
    "Ley de Urgencias"
  ]);
  let renderTimer = 0;
  let observer = null;
  let rendering = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const route = () => String(location.hash || "#/inicio").split("?")[0] || "#/inicio";
  const clean = (value) => String(value || "").trim();

  function supabaseApi() {
    return window.CRS_SUPABASE || null;
  }

  function publicUrl(doc) {
    if (!doc) return "";
    if (clean(doc.url)) return clean(doc.url);
    if (!doc.file_path) return "";
    const client = supabaseApi()?.client?.();
    const bucket = window.CRS_SUPABASE_CONFIG?.bucket || "crs-public";
    return client?.storage?.from(bucket)?.getPublicUrl(doc.file_path)?.data?.publicUrl || "";
  }

  function signature(doc) {
    return [doc?.id, doc?.key, doc?.updated_at, doc?.url, doc?.file_path].filter(Boolean).join(":");
  }

  async function fetchBaseDocuments() {
    const api = supabaseApi();
    if (!api?.enabled?.() || !api.fetchDocuments) return [];
    try {
      return await api.fetchDocuments(["formulario-base"]);
    } catch (error) {
      console.warn("No se pudieron leer documentos institucionales", error);
      return [];
    }
  }

  function byKey(items = []) {
    const map = new Map();
    items.forEach((item) => {
      if (item?.key && !map.has(item.key)) map.set(item.key, item);
    });
    return map;
  }

  function addStyle() {
    if ($("#documentos-institucionales-style")) return;
    const style = document.createElement("style");
    style.id = "documentos-institucionales-style";
    style.textContent = `
      .institutional-manager{display:grid;gap:14px}
      .institutional-manager-head{display:grid;gap:5px}
      .institutional-manager-head h3{margin:0}
      .institutional-manager-head p{margin:0;color:#52615c;line-height:1.45}
      .institutional-doc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .institutional-doc-item{display:grid;gap:10px;padding:14px;border:1px solid #dbe6e1;border-left:5px solid #0f766e;border-radius:12px;background:#fbfdfc}
      .institutional-doc-item h4{margin:0;color:#10201c;font-size:1rem}
      .institutional-doc-item p{margin:0;color:#61706b;font-size:.86rem;line-height:1.4}
      .institutional-doc-item form{display:grid;gap:9px}
      .institutional-doc-item label{display:grid;gap:5px;color:#33413d;font-size:.82rem;font-weight:750}
      .institutional-doc-item input[type=file],.institutional-doc-item input[type=url]{width:100%;min-width:0}
      .institutional-current{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:9px;background:#ecfdf5;color:#166534;font-size:.78rem;font-weight:750}
      .institutional-current.pending{background:#f8fafc;color:#64748b}
      .institutional-public-badge{display:grid;gap:8px;margin-bottom:10px;padding:10px 12px;border:1px solid #a7f3d0;border-radius:10px;background:#ecfdf5;color:#166534;font-size:.86rem;font-weight:750}
      @media(max-width:760px){.institutional-doc-grid{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  function editorItem(definition, current) {
    const article = document.createElement("article");
    article.className = "institutional-doc-item";
    article.dataset.institutionalKey = definition.key;

    const heading = document.createElement("h4");
    heading.textContent = definition.title;
    const description = document.createElement("p");
    description.textContent = definition.description;

    const currentBox = document.createElement("div");
    const href = publicUrl(current);
    currentBox.className = `institutional-current${href ? "" : " pending"}`;
    const currentText = document.createElement("span");
    currentText.textContent = href
      ? `Versión vigente${current?.file_name ? `: ${current.file_name}` : " publicada"}`
      : "Usando versión incluida en la app / pendiente";
    currentBox.append(currentText);
    if (href) {
      const open = document.createElement("a");
      open.href = href;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "Abrir";
      currentBox.append(open);
    }

    const form = document.createElement("form");
    form.dataset.formBase = "true";
    form.dataset.formKey = definition.key;

    const title = document.createElement("input");
    title.type = "hidden";
    title.name = "title";
    title.value = definition.title;
    const hiddenDescription = document.createElement("input");
    hiddenDescription.type = "hidden";
    hiddenDescription.name = "description";
    hiddenDescription.value = definition.description;

    const fileLabel = document.createElement("label");
    fileLabel.append(definition.linkOnly ? "Archivo opcional" : "Nueva versión (PDF / documento)");
    const file = document.createElement("input");
    file.type = "file";
    file.name = "file";
    file.accept = ".pdf,.doc,.docx,.odt,.xls,.xlsx,image/*";
    fileLabel.append(file);

    const urlLabel = document.createElement("label");
    urlLabel.append(definition.linkOnly ? "Enlace vigente" : "O pegar enlace vigente");
    const url = document.createElement("input");
    url.type = "url";
    url.name = "url";
    url.placeholder = "https://...";
    urlLabel.append(url);

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "document-button";
    button.textContent = href ? "Reemplazar versión vigente" : "Publicar versión vigente";

    form.append(title, hiddenDescription, fileLabel, urlLabel, button);
    article.append(heading, description, currentBox, form);
    return article;
  }

  async function patchJefatura(documents) {
    if (route() !== "#/jefatura") return;
    const body = $('[data-jefatura-section="documentos-institucionales"] .jefatura-dropdown-body');
    if (!body) return;

    $$(':scope > .crs-access-card', body).forEach((card) => {
      const title = clean(card.querySelector("h3")?.textContent);
      if (LEGACY_JEFATURA_TITLES.has(title)) card.hidden = true;
    });

    const map = byKey(documents);
    const managerSignature = MANAGED.map((item) => `${item.key}:${signature(map.get(item.key))}`).join("|");
    let manager = $("[data-institutional-manager]", body);
    if (manager?.dataset.signature === managerSignature) return;
    manager?.remove();

    manager = document.createElement("article");
    manager.className = "crs-access-card full institutional-manager";
    manager.dataset.institutionalManager = "true";
    manager.dataset.signature = managerSignature;

    const head = document.createElement("div");
    head.className = "institutional-manager-head";
    const title = document.createElement("h3");
    title.textContent = "Documentos institucionales editables";
    const copy = document.createElement("p");
    copy.textContent = "Administra desde aquí todos los documentos y enlaces publicados en Formularios. La nueva publicación pasa a ser la versión vigente para el equipo; si la carga falla, se conserva la versión anterior.";
    head.append(title, copy);

    const grid = document.createElement("div");
    grid.className = "institutional-doc-grid";
    MANAGED.forEach((definition) => grid.append(editorItem(definition, map.get(definition.key))));
    manager.append(head, grid);
    body.append(manager);

    const count = body.closest("details")?.querySelector(".jefatura-dropdown-count");
    if (count) count.textContent = String(MANAGED.length);
  }

  function findPanel(title) {
    return $$("#turnFormsList > section").find((panel) => clean(panel.querySelector("h2")?.textContent) === title) || null;
  }

  function replacePublicAction(panel, doc, label) {
    const href = publicUrl(doc);
    if (!panel || !href) return;
    const action = $(".document-action", panel);
    if (!action) return;
    const nextSignature = signature(doc);
    if (action.dataset.institutionalVersion === nextSignature) return;
    action.dataset.institutionalVersion = nextSignature;
    action.replaceChildren();

    const badge = document.createElement("div");
    badge.className = "institutional-public-badge";
    badge.textContent = "Versión institucional vigente publicada por Jefatura.";
    const link = document.createElement("a");
    link.className = "document-button";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    action.append(badge, link);
  }

  function patchLinkByText(text, doc) {
    const href = publicUrl(doc);
    if (!href) return;
    $$("#turnFormsList a").forEach((link) => {
      if (clean(link.textContent) !== text) return;
      link.href = href;
      link.dataset.institutionalVersion = signature(doc);
    });
  }

  function patchLawMenuCard(doc) {
    const href = publicUrl(doc);
    if (!href) return;
    const card = $$("#turnFormsList a.law-menu-card").find((item) => clean(item.querySelector("strong")?.textContent) === "Decreto 34");
    if (!card) return;
    card.href = href;
    card.dataset.institutionalVersion = signature(doc);
    const detail = card.querySelector("span:last-child");
    if (detail) detail.textContent = "Versión vigente publicada por Jefatura";
  }

  function cleanGenericPanel() {
    const panel = $("[data-sb-forms-panel]");
    if (!panel) return;
    $$("article", panel).forEach((article) => {
      const title = clean(article.querySelector("strong")?.textContent);
      if (MANAGED_TITLES.has(title)) article.remove();
    });
    if (!panel.querySelector("article")) panel.remove();
  }

  function patchPublishedForm(definition, map) {
    if (!definition.publicTitle || !definition.publicLabel) return;
    const doc = map.get(definition.key);
    if (!doc) return;
    if (definition.key === "notificacionObligatoria") {
      patchLinkByText(definition.publicLabel, doc);
      return;
    }
    replacePublicAction(findPanel(definition.publicTitle), doc, definition.publicLabel);
  }

  async function patchForms(documents) {
    if (!route().startsWith("#/formularios")) return;
    const map = byKey(documents);
    const legacyLaw = map.get("leyUrgencias");

    if (route() === "#/formularios") {
      MANAGED.forEach((definition) => patchPublishedForm(definition, map));
      patchLinkByText("Abrir EPIVIGILA", map.get("notificacionObligatoria"));
      cleanGenericPanel();
      return;
    }

    if (route().startsWith("#/formularios/notificacion-obligatoria")) {
      patchLinkByText("Abrir EPIVIGILA", map.get("notificacionObligatoria"));
      return;
    }

    if (!route().startsWith("#/formularios/ley-urgencias")) return;
    const decree = map.get("leyUrgenciasDecreto");
    const activation = map.get("leyUrgenciasActivacion") || legacyLaw;
    const consent = map.get("leyUrgenciasConsentimiento");

    patchLawMenuCard(decree);
    patchLinkByText("Abrir Decreto 34", decree);
    patchLinkByText("Abrir activación", activation);
    patchLinkByText("Abrir consentimiento", consent);
  }

  async function render() {
    if (rendering) return;
    const current = route();
    if (current !== "#/jefatura" && !current.startsWith("#/formularios")) return;
    rendering = true;
    try {
      addStyle();
      const documents = await fetchBaseDocuments();
      await patchJefatura(documents);
      await patchForms(documents);
    } finally {
      rendering = false;
    }
  }

  function schedule(delay = 40) {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, delay);
  }

  function observeActiveArea() {
    observer?.disconnect();
    observer = new MutationObserver(() => schedule(50));
    const target = route() === "#/jefatura" ? $("#chiefContent") : $("#turnFormsList");
    if (target) observer.observe(target, { childList: true, subtree: true });
  }

  function routeChanged() {
    observeActiveArea();
    schedule(20);
    window.setTimeout(() => schedule(0), 250);
  }

  window.addEventListener("hashchange", routeChanged);
  window.addEventListener("crs:supabase-ready", () => schedule(10));
  window.addEventListener("crs:auth-changed", () => schedule(20));
  document.addEventListener("DOMContentLoaded", routeChanged, { once: true });

  if (document.readyState !== "loading") routeChanged();
})();
