(() => {
  const cfg = window.CRS_SUPABASE_CONFIG || {};
  const tables = {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    calls: "crs_call_schedules",
    ...(cfg.tables || {})
  };
  const bucket = cfg.bucket || "crs-public";
  let client = null;
  let publicRenderTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const clean = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const slug = (value) => clean(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
  const route = () => location.hash.split("?")[0] || "#/inicio";

  function enabled() {
    return Boolean(cfg.enabled && cfg.url && cfg.anonKey && window.supabase?.createClient);
  }

  function sb() {
    if (!enabled()) return null;
    if (!client) {
      client = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return client;
  }

  function addStyle() {
    if ($("#supabase-backend-style")) return;
    const style = document.createElement("style");
    style.id = "supabase-backend-style";
    style.textContent = `
      .sb-ok{border:1px solid #bbf7d0;background:#f0fdf4;color:#14532d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}
      .sb-error{border:1px solid #fecaca;background:#fff1f2;color:#7f1d1d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}
      .sb-toast{position:fixed;right:18px;bottom:18px;z-index:50;max-width:min(420px,calc(100vw - 36px));padding:12px 14px;border-radius:12px;background:#0f172a;color:#fff;font-weight:800;box-shadow:0 16px 40px rgba(15,23,42,.25)}
      .sb-toast.error{background:#991b1b}
      .sb-global-panel{margin-top:14px}
      .sb-global-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
      @media(max-width:680px){.sb-toast{left:18px;right:18px}}
    `;
    document.head.append(style);
  }

  function toast(message, isError = false) {
    const old = $(".sb-toast");
    if (old) old.remove();
    const box = document.createElement("div");
    box.className = `sb-toast${isError ? " error" : ""}`;
    box.textContent = message;
    document.body.append(box);
    setTimeout(() => box.remove(), 5600);
  }

  function errorText(error) {
    const msg = String(error?.message || error || "Error desconocido");
    if (/row-level security|permission denied/i.test(msg)) {
      return "Tu usuario no tiene permiso activo para publicar en CRS.";
    }
    if (/relation.*does not exist/i.test(msg)) {
      return "Falta actualizar el esquema de Supabase para CRS.";
    }
    return msg;
  }

  async function currentUser() {
    const api = sb();
    if (!api) return null;
    const { data, error } = await api.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user) throw new Error("Inicia sesion en Jefatura antes de publicar globalmente.");
    return user;
  }

  function filePublicUrl(path) {
    const api = sb();
    if (!api || !path) return "";
    return api.storage.from(bucket).getPublicUrl(path).data?.publicUrl || "";
  }

  async function uploadFile(file, folder) {
    if (!file || !file.name) return {};
    const api = sb();
    if (!api) throw new Error("Supabase no esta conectado.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;
    const { error } = await api.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    return {
      file_path: path,
      file_name: file.name,
      file_type: file.type || "",
      file_size: file.size || 0,
      url: filePublicUrl(path)
    };
  }

  async function fetchContent(kind) {
    const api = sb();
    if (!api) return [];
    const { data, error } = await api
      .from(tables.content)
      .select("*")
      .eq("kind", kind)
      .eq("status", "published")
      .order(kind === "paper" ? "month" : "created_at", { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      month: item.month,
      eventUrl: item.event_url,
      url: item.url || filePublicUrl(item.file_path),
      imageUrl: item.image_url || "",
      createdAt: item.created_at
    }));
    const staticKey = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
    const staticItems = window.CRS_STATIC_CONTENT?.[staticKey] || [];
    return [...mapped, ...staticItems];
  }

  async function fetchDocuments(groupNames = []) {
    const api = sb();
    if (!api) return [];
    let query = api
      .from(tables.documents)
      .select("*")
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (groupNames.length) query = query.in("group_name", groupNames);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function fetchFlows() {
    const api = sb();
    if (!api) return [];
    const { data, error } = await api
      .from(tables.flows)
      .select("*")
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  function documentButton(row, label = "Abrir") {
    const href = row.url || filePublicUrl(row.file_path);
    if (!href) return "";
    return `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  }

  async function patchFormsPage() {
    if (!enabled() || route() !== "#/formularios") return;
    const list = $("#turnFormsList");
    if (!list) return;
    const old = $("[data-sb-forms-panel]");
    if (old) old.remove();
    const docs = await fetchDocuments(["formulario-base", "formulario-extra"]);
    if (!docs.length) return;
    const section = document.createElement("section");
    section.className = "document-panel sb-global-panel";
    section.dataset.sbFormsPanel = "true";
    section.innerHTML = `<h2>Actualizaciones globales de Jefatura</h2><p>Documentos publicados desde Supabase y visibles para todo el equipo.</p><div class="sb-global-grid">${docs.map((doc) => `<article class="public-card blue"><strong>${esc(doc.title)}</strong><span>${esc(doc.description)}</span><div class="public-actions">${documentButton(doc)}</div></article>`).join("")}</div>`;
    list.prepend(section);
  }

  async function patchCallsPage() {
    if (!enabled() || route() !== "#/llamados") return;
    const docs = await fetchDocuments(["llamados"]);
    ["especialistas", "uhd"].forEach((type) => {
      const panel = type === "especialistas"
        ? $("#callsDocumentAction")?.closest(".document-panel")
        : $("#uhdDocumentAction")?.closest(".document-panel");
      if (!panel) return;
      const old = panel.querySelector(`[data-sb-call-panel="${type}"]`);
      if (old) old.remove();
      const item = docs.find((doc) => doc.key === type);
      if (!item) return;
      panel.insertAdjacentHTML("beforeend", `<div class="sb-global-panel" data-sb-call-panel="${type}"><div class="sb-ok">Documento global actualizado por Jefatura.</div><div class="public-actions" style="margin-top:10px">${documentButton(item, "Abrir version global")}</div></div>`);
    });
  }

  async function patchFlowsPage() {
    if (!enabled() || route() !== "#/especialidades") return;
    const target = $("#specialtyGroups");
    if (!target) return;
    const old = $("[data-sb-flows-panel]", target);
    if (old) old.remove();
    const flows = await fetchFlows();
    if (!flows.length) return;
    const section = document.createElement("section");
    section.className = "document-panel sb-global-panel";
    section.dataset.sbFlowsPanel = "true";
    section.innerHTML = `<h2>Flujos publicados por Jefatura</h2><p>Actualizaciones globales agregadas desde Supabase.</p><div class="sb-global-grid">${flows.map((flow) => `<article class="public-card red"><span class="public-tag">${esc(flow.category)}</span><strong>${esc(flow.title)}</strong><span>${esc(flow.summary)}</span><div class="public-actions">${documentButton(flow, "Abrir")}</div></article>`).join("")}</div>`;
    target.append(section);
  }

  function pdfJs() {
    if (window.pdfjsLib?.getDocument) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const old = document.querySelector("script[data-pdfjs]");
      if (old) {
        old.addEventListener("load", () => resolve(window.pdfjsLib), { once: true });
        old.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.dataset.pdfjs = "true";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = reject;
      document.head.append(script);
    }).then((lib) => {
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      }
      return lib;
    });
  }

  async function extractPaperMeta(file) {
    if (!file || !/pdf/i.test(file.type || file.name || "")) return {};
    try {
      const lib = await pdfJs();
      const buffer = await file.arrayBuffer();
      const pdf = await lib.getDocument({ data: buffer }).promise;
      const pages = Math.min(pdf.numPages || 1, 3);
      let text = "";
      for (let pageNo = 1; pageNo <= pages; pageNo += 1) {
        const page = await pdf.getPage(pageNo);
        const content = await page.getTextContent();
        text += " " + content.items.map((item) => item.str || "").join(" ");
      }
      const normalized = text.replace(/\s+/g, " ").trim();
      const abstractMatch = normalized.match(/\babstract\b[:\s-]*(.{120,1600}?)(?:\bkeywords\b|\bintroduction\b|\bbackground\b|\bmethods\b|$)/i);
      const firstTitle = normalized.split(/[.!?]\s/)[0]?.slice(0, 180).trim();
      return {
        title: firstTitle || "",
        description: abstractMatch ? abstractMatch[1].trim() : ""
      };
    } catch (error) {
      console.warn("No se pudo extraer titulo/abstract del PDF", error);
      return {};
    }
  }

  function patchJefatura(force = false) {
    if (route() !== "#/jefatura") return;
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(force ? 0 : 30);
  }

  async function publishContent(form) {
    const api = sb();
    const user = await requireUser();
    const formData = new FormData(form);
    const kind = form.dataset.content === "paper"
      ? "paper"
      : form.dataset.content === "procedure"
        ? "procedure"
        : String(formData.get("kind") || "news");
    const file = form.file?.files?.[0] || null;
    const extracted = kind === "paper" ? await extractPaperMeta(file) : {};
    const uploaded = await uploadFile(file, kind);
    const row = {
      kind,
      title: formData.get("title") || extracted.title || "Sin titulo",
      description: formData.get("description") || formData.get("summary") || extracted.description || "",
      category: formData.get("category") || "",
      month: formData.get("month") || "",
      event_url: formData.get("eventUrl") || "",
      url: formData.get("url") || uploaded.url || "",
      file_path: uploaded.file_path || null,
      file_name: uploaded.file_name || null,
      file_type: uploaded.file_type || null,
      file_size: uploaded.file_size || null,
      status: "published",
      created_by: user.id,
      created_by_email: user.email || ""
    };
    const { error } = await api.from(tables.content).insert(row);
    if (error) throw error;
    form.reset();
    toast("Publicado globalmente en Supabase.");
    patchJefatura(true);
  }

  function cardText(form, selector) {
    return form.closest("article")?.querySelector(selector)?.textContent?.trim() || "";
  }

  async function upsertDocument(form) {
    const api = sb();
    const user = await requireUser();
    const formData = new FormData(form);
    const file = form.file?.files?.[0] || null;
    const isBase = form.hasAttribute("data-form-base");
    const isCall = form.hasAttribute("data-upload-call");
    const title = formData.get("title") || cardText(form, "h3") || "Documento";
    const description = formData.get("description") || cardText(form, "p") || "";
    const key = isBase
      ? form.dataset.formKey
      : isCall
        ? form.dataset.callType
        : `${slug(title)}-${Date.now()}`;
    const groupName = isCall ? "llamados" : isBase ? "formulario-base" : "formulario-extra";
    const uploaded = await uploadFile(file, groupName);
    const row = {
      key,
      group_name: groupName,
      title,
      description,
      url: formData.get("url") || uploaded.url || "",
      file_path: uploaded.file_path || null,
      file_name: uploaded.file_name || null,
      file_type: uploaded.file_type || null,
      file_size: uploaded.file_size || null,
      status: "published",
      created_by: user.id,
      created_by_email: user.email || ""
    };
    const { error } = await api.from(tables.documents).upsert(row, { onConflict: "key" });
    if (error) throw error;
    form.reset();
    toast("Documento publicado globalmente.");
    patchJefatura(true);
  }

  async function publishFlow(form) {
    const api = sb();
    const user = await requireUser();
    const formData = new FormData(form);
    const file = form.file?.files?.[0] || null;
    const uploaded = await uploadFile(file, "flujos");
    const row = {
      category: formData.get("category") || "Flujo",
      title: formData.get("title") || "Sin titulo",
      summary: formData.get("summary") || "",
      url: formData.get("url") || uploaded.url || "",
      file_path: uploaded.file_path || null,
      file_name: uploaded.file_name || null,
      file_type: uploaded.file_type || null,
      file_size: uploaded.file_size || null,
      status: "published",
      created_by: user.id,
      created_by_email: user.email || ""
    };
    const { error } = await api.from(tables.flows).insert(row);
    if (error) throw error;
    form.reset();
    toast("Flujo publicado globalmente.");
    patchJefatura(true);
  }

  async function archiveItem(type, id) {
    const api = sb();
    await requireUser();
    const table = type === "content"
      ? tables.content
      : type === "document"
        ? tables.documents
        : type === "flow"
          ? tables.flows
          : tables.calls;
    const { error } = await api.from(table).update({ status: "archived" }).eq("id", id);
    if (error) throw error;
    toast("Elemento ocultado de la web publica.");
    patchJefatura(true);
    schedulePublicRoute(0);
  }

  function handledForm(form) {
    return form?.matches?.("[data-content],[data-upload-call],[data-form-base],[data-new-form],[data-new-flow]");
  }

  document.addEventListener("submit", async (ev) => {
    const form = ev.target;
    if (!enabled() || !handledForm(form)) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try {
      if (form.matches("[data-content]")) await publishContent(form);
      else if (form.matches("[data-upload-call],[data-form-base],[data-new-form]")) await upsertDocument(form);
      else if (form.matches("[data-new-flow]")) await publishFlow(form);
    } catch (error) {
      console.error(error);
      toast(errorText(error), true);
    }
  }, true);

  document.addEventListener("click", async (ev) => {
    const archive = ev.target.closest?.("[data-sb-archive]");
    if (!archive) return;
    ev.preventDefault();
    try {
      await archiveItem(archive.dataset.sbArchive, archive.dataset.sbId);
    } catch (error) {
      console.error(error);
      toast(errorText(error), true);
    }
  }, true);

  async function renderPublicRoute() {
    if (!enabled()) return;
    const current = route();
    try {
      if (current === "#/gestion/noticias") return location.replace("#/noticias");
      if (current === "#/gestion/educacion") return location.replace("#/educacion");
      if (current === "#/gestion/paper") return location.replace("#/paper");
      if (current === "#/gestion/procedimientos") return location.replace("#/procedimientos");
      if (current === "#/formularios") await patchFormsPage();
      else if (current === "#/llamados") await patchCallsPage();
      else if (current === "#/especialidades") await patchFlowsPage();
    } catch (error) {
      console.error("No se pudo sincronizar contenido publico desde Supabase", error);
    }
  }

  function schedulePublicRoute(delay = 120) {
    clearTimeout(publicRenderTimer);
    publicRenderTimer = setTimeout(renderPublicRoute, delay);
  }

  function runAfterRender() {
    addStyle();
    schedulePublicRoute(120);
  }

  window.CRS_SUPABASE = {
    enabled,
    client: sb,
    fetchContent,
    fetchDocuments,
    fetchFlows,
    patchJefatura,
    renderPublicRoute
  };

  window.addEventListener("hashchange", runAfterRender);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runAfterRender, { once: true });
  else runAfterRender();
})();
