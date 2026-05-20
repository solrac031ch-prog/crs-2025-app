(() => {
  const cfg = window.CRS_SUPABASE_CONFIG || {};
  const tables = {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    calls: "crs_call_schedules",
    admins: "crs_admins",
    ...(cfg.tables || {})
  };
  const bucket = cfg.bucket || "crs-public";
  let client = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
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
      .sb-panel{border-left-color:#0ea5e9!important}.sb-ok{border:1px solid #bbf7d0;background:#f0fdf4;color:#14532d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.sb-warn{border:1px solid #fde68a;background:#fffbeb;color:#713f12;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.sb-error{border:1px solid #fecaca;background:#fff1f2;color:#7f1d1d;border-radius:12px;padding:10px;font-weight:800;line-height:1.35}.sb-login{display:grid;gap:10px}.sb-login label{display:grid;gap:5px;font-weight:850}.sb-login input{min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px}.sb-list{display:grid;gap:8px}.sb-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border:1px solid #e5ebe8;border-radius:10px;background:#fff}.sb-toast{position:fixed;right:18px;bottom:18px;z-index:50;max-width:min(420px,calc(100vw - 36px));padding:12px 14px;border-radius:12px;background:#0f172a;color:#fff;font-weight:800;box-shadow:0 16px 40px rgba(15,23,42,.25)}.sb-toast.error{background:#991b1b}.sb-global-panel{margin-top:14px}.sb-global-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}@media(max-width:680px){.sb-row{grid-template-columns:1fr}.sb-toast{left:18px;right:18px}}
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
    if (msg.includes("row-level security") || msg.includes("permission denied")) {
      return "Tu usuario no tiene permiso de jefatura en Supabase. Debe estar en la tabla crs_admins.";
    }
    if (msg.includes("relation") && msg.includes("does not exist")) {
      return "Falta ejecutar supabase-setup.sql en Supabase.";
    }
    return msg;
  }

  async function currentUser() {
    const api = sb();
    if (!api) return null;
    const { data } = await api.auth.getUser();
    return data?.user || null;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user) throw new Error("Inicia sesion con Supabase en el modulo de Jefatura antes de publicar globalmente.");
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
      createdAt: item.created_at
    }));
    const staticKey = kind === "paper" ? "papers" : kind === "procedure" ? "procedures" : kind;
    const staticItems = (window.CRS_STATIC_CONTENT?.[staticKey] || []);
    return [...mapped, ...staticItems];
  }

  async function fetchDocuments(groupNames = []) {
    const api = sb();
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
    const { data, error } = await api
      .from(tables.flows)
      .select("*")
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  function activate(pageId, activeRoute = "gestion") {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === pageId));
    $$("[data-route-link]").forEach((link) => link.classList.toggle("active", link.dataset.routeLink === activeRoute));
  }

  function routeNav() {
    return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestion</a><a class="back-link" href="#/inicio">Inicio</a></div>`;
  }

  function publicAction(item, label = "Abrir") {
    const href = item.url || item.eventUrl || "";
    if (!href) return "";
    return `<a class="document-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  }

  function publicCard(item, kind) {
    const color = kind === "paper" ? "amber" : kind === "education" ? "purple" : kind === "news" ? "blue" : "red";
    const label = kind === "paper" ? "Paper" : kind === "procedure" ? "Procedimiento" : kind === "news" ? "Noticia" : "Educacion";
    const actionLabel = kind === "news" && item.eventUrl ? "Inscripcion / publicidad" : kind === "paper" ? "Abrir paper" : kind === "procedure" ? "Abrir procedimiento" : "Abrir material";
    return `<article class="public-card ${color}"><span class="public-tag">${esc(item.category || label)}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="public-actions">${publicAction(item, actionLabel)}</div></article>`;
  }

  async function renderPublicList(kind, title, text, emptyText, standaloneEducation = false) {
    addStyle();
    const items = await fetchContent(kind);
    const pageId = standaloneEducation ? "educationPage" : "managementPage";
    activate(pageId, standaloneEducation ? "educacion" : "gestion");
    const titleEl = standaloneEducation ? $("#educationTitle") : $("#managementTitle");
    const contentEl = standaloneEducation ? $("#educationContent") : $("#managementContent");
    if (!titleEl || !contentEl) return;
    titleEl.textContent = title;
    contentEl.innerHTML = `<div class="public-shell">${standaloneEducation ? `<div class="route-actions"><a class="back-link" href="#/inicio">Inicio</a><a class="back-link" href="#/gestion/educacion">Abrir en Gestion</a></div>` : routeNav()}<section class="public-hero"><h2>${esc(title)}</h2><p>${esc(text)}</p></section><section class="public-grid">${items.length ? items.map((item) => publicCard(item, kind)).join("") : `<div class="public-empty">${esc(emptyText)}</div>`}</section></div>`;
  }

  function monthLabel(item) {
    const value = item.month || String(item.createdAt || "").slice(0, 7);
    const [year, month] = value.split("-");
    return year && month ? `${month}/${year}` : "Sin mes";
  }

  async function renderPaper() {
    addStyle();
    const papers = await fetchContent("paper");
    activate("managementPage", "gestion");
    const latest = papers[0];
    const older = papers.slice(1);
    $("#managementTitle").textContent = "Paper del mes";
    const featured = latest
      ? `<article class="public-card amber"><span class="public-tag">Ultimo paper publicado - ${esc(monthLabel(latest))}</span><h3>${esc(latest.title)}</h3><p>${esc(latest.description)}</p><div class="public-actions">${publicAction(latest, "Abrir paper")}</div></article>`
      : `<div class="public-empty">Aun no hay un paper del mes publicado.</div>`;
    const repo = older.length
      ? older.map((paper) => publicCard(paper, "paper")).join("")
      : `<div class="public-empty">No hay papers previos publicados.</div>`;
    $("#managementContent").innerHTML = `<div class="public-shell">${routeNav()}<section class="public-hero"><h2>Paper del mes</h2><p>Contenido publicado globalmente desde Supabase.</p></section><section class="public-paper-layout"><aside class="public-sidebar"><h2>Repositorio</h2>${repo}</aside><main class="public-featured">${featured}</main></section></div>`;
  }

  async function renderPublicRoute() {
    if (!enabled()) return;
    const current = route();
    try {
      if (current === "#/gestion/noticias") await renderPublicList("news", "Noticias", "Avisos, cursos, posters y enlaces publicados por Jefatura.", "Aun no hay noticias publicadas.");
      if (current === "#/gestion/educacion") await renderPublicList("education", "Educacion medica", "Canales, podcast y material docente publico.", "Aun no hay material docente adicional publicado.");
      if (current === "#/educacion") await renderPublicList("education", "Educacion medica", "Canales, podcast y material docente publico.", "Aun no hay material docente publicado.", true);
      if (current === "#/gestion/paper") await renderPaper();
      if (current === "#/gestion/procedimientos") await renderPublicList("procedure", "Procedimientos medicos", "Repositorio publico de procedimientos y material practico.", "Aun no hay procedimientos publicados.");
      if (current === "#/formularios") await patchFormsPage();
      if (current === "#/llamados") await patchCallsPage();
      if (current === "#/especialidades") await patchFlowsPage();
      if (current === "#/jefatura") await patchJefatura();
    } catch (error) {
      console.error(error);
      if (["#/gestion/noticias", "#/gestion/educacion", "#/educacion", "#/gestion/paper", "#/gestion/procedimientos"].includes(current)) {
        const contentEl = current === "#/educacion" ? $("#educationContent") : $("#managementContent");
        if (contentEl) contentEl.insertAdjacentHTML("afterbegin", `<div class="sb-error">${esc(errorText(error))}</div>`);
      }
    }
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
      const panel = type === "especialistas" ? $("#callsDocumentAction")?.closest(".document-panel") : $("#uhdDocumentAction")?.closest(".document-panel");
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
    const uploaded = await uploadFile(file, kind);
    const row = {
      kind,
      title: formData.get("title") || "Sin titulo",
      description: formData.get("description") || formData.get("summary") || "",
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
    await patchJefatura(true);
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
    await patchJefatura(true);
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
    await patchJefatura(true);
  }

  async function upsertAdmin(form) {
    const api = sb();
    await requireUser();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email) throw new Error("Falta correo.");
    const row = {
      email,
      display_name: formData.get("nombre") || "",
      role: formData.get("rol") || "jefatura",
      active: true
    };
    const { error } = await api.from(tables.admins).upsert(row, { onConflict: "email" });
    if (error) throw error;
    form.reset();
    toast("Usuario agregado a permisos de Jefatura en Supabase. Recuerda crear tambien su usuario en Authentication.");
    await renderAdminList();
  }

  async function signIn(form) {
    const api = sb();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!email) throw new Error("Ingresa el correo.");
    if (password) {
      const { error } = await api.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast("Sesion Supabase iniciada.");
      form.reset();
      await patchJefatura(true);
      return;
    }
    const { error } = await api.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname + "#/jefatura" } });
    if (error) throw error;
    toast("Enlace de ingreso enviado al correo.");
  }

  async function archiveItem(type, id) {
    const api = sb();
    await requireUser();
    const table = type === "content" ? tables.content : type === "document" ? tables.documents : type === "flow" ? tables.flows : tables.calls;
    const { error } = await api.from(table).update({ status: "archived" }).eq("id", id);
    if (error) throw error;
    toast("Elemento ocultado de la web publica.");
    await patchJefatura(true);
    await renderPublicRoute();
  }

  async function renderAdminList() {
    if (!enabled()) return;
    const box = $("[data-sb-admin-list]");
    if (!box) return;
    const api = sb();
    const { data, error } = await api.from(tables.admins).select("email,display_name,role,active").order("email");
    if (error) {
      box.innerHTML = `<div class="sb-error">${esc(errorText(error))}</div>`;
      return;
    }
    box.innerHTML = (data || []).length
      ? `<div class="sb-list">${data.map((user) => `<div class="sb-row"><span><strong>${esc(user.display_name || user.email)}</strong><br><span class="mini">${esc(user.email)} · ${esc(user.role)} · ${user.active ? "activo" : "inactivo"}</span></span></div>`).join("")}</div>`
      : `<div class="sb-warn">No hay usuarios registrados en crs_admins.</div>`;
  }

  async function renderGlobalList() {
    const box = $("[data-sb-global-list]");
    if (!box || !enabled()) return;
    const api = sb();
    const [content, docs, flows] = await Promise.all([
      api.from(tables.content).select("id,kind,title,status,updated_at,created_at").neq("status", "archived").order("created_at", { ascending: false }).limit(12),
      api.from(tables.documents).select("id,group_name,title,status,updated_at,created_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(12),
      api.from(tables.flows).select("id,category,title,status,updated_at,created_at").neq("status", "archived").order("updated_at", { ascending: false }).limit(12)
    ]);
    const errors = [content.error, docs.error, flows.error].filter(Boolean);
    if (errors.length) {
      box.innerHTML = `<div class="sb-error">${esc(errorText(errors[0]))}</div>`;
      return;
    }
    const rows = [
      ...(content.data || []).map((item) => ({ type: "content", label: item.kind, ...item })),
      ...(docs.data || []).map((item) => ({ type: "document", label: item.group_name, ...item })),
      ...(flows.data || []).map((item) => ({ type: "flow", label: item.category, ...item }))
    ].sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at))).slice(0, 18);
    box.innerHTML = rows.length
      ? `<div class="sb-list">${rows.map((item) => `<div class="sb-row"><span><strong>${esc(item.title)}</strong><br><span class="mini">${esc(item.label)} · ${esc(item.status)}</span></span><button class="delete-button" type="button" data-sb-archive="${esc(item.type)}" data-sb-id="${esc(item.id)}">Ocultar</button></div>`).join("")}</div>`
      : `<div class="sb-warn">Aun no hay publicaciones globales en Supabase.</div>`;
  }

  function disabledPanelHtml() {
    return `<article class="admin-card sb-panel" data-sb-panel><h3>Publicacion global con Supabase</h3><div class="sb-warn">Supabase esta preparado, pero aun no esta conectado. Completa supabase-config.js con Project URL, anon public key y enabled: true.</div><p>Mientras este apagado, los formularios actuales seguiran guardando borradores locales.</p><div class="public-actions"><a class="document-button" href="./SUPABASE-SETUP.md" target="_blank" rel="noopener noreferrer">Ver pasos de instalacion</a><a class="document-button" href="./supabase-setup.sql" target="_blank" rel="noopener noreferrer">Abrir SQL</a></div></article>`;
  }

  function enabledPanelHtml(user) {
    if (!user) {
      return `<article class="admin-card sb-panel" data-sb-panel><h3>Publicacion global con Supabase</h3><div class="sb-ok">Supabase esta conectado. Inicia sesion para publicar globalmente.</div><form class="sb-login" data-sb-login><label>Correo<input name="email" type="email" required autocomplete="email"></label><label>Clave Supabase<input name="password" type="password" autocomplete="current-password" placeholder="Dejar vacio para enlace por correo"></label><button class="document-button" type="submit">Entrar a Jefatura global</button></form></article>`;
    }
    return `<article class="admin-card sb-panel" data-sb-panel><h3>Publicacion global con Supabase</h3><div class="sb-ok">Sesion activa: ${esc(user.email)}. Los formularios de este modulo publican globalmente.</div><div class="public-actions"><button class="document-button" type="button" data-sb-refresh>Actualizar lista global</button><button class="delete-button" type="button" data-sb-signout>Cerrar sesion Supabase</button></div><h3>Publicaciones globales recientes</h3><div data-sb-global-list><div class="mini">Cargando...</div></div><h3>Usuarios con permiso</h3><div data-sb-admin-list><div class="mini">Cargando...</div></div></article>`;
  }

  async function patchJefatura(force = false) {
    addStyle();
    if (route() !== "#/jefatura") return;
    const content = $("#chiefContent");
    if (!content) return;
    const grid = $(".gestion-grid", content) || content;
    const old = $("[data-sb-panel]", content);
    if (old && !force) return;
    if (old) old.remove();
    const user = enabled() ? await currentUser() : null;
    grid.insertAdjacentHTML("afterbegin", enabled() ? enabledPanelHtml(user) : disabledPanelHtml());

    if (enabled() && user) {
      $$("[data-public-draft-note]", content).forEach((note) => {
        note.className = "sb-ok";
        note.textContent = "Supabase activo: al enviar este formulario se publica globalmente para todos los navegadores.";
      });
      await Promise.all([renderGlobalList(), renderAdminList()]);
    }
  }

  function handledForm(form) {
    return form?.matches?.("[data-content],[data-upload-call],[data-form-base],[data-new-form],[data-new-flow],[data-backend-user]");
  }

  document.addEventListener("submit", async (ev) => {
    const form = ev.target;
    if (form?.matches?.("[data-sb-login]")) {
      ev.preventDefault();
      try { await signIn(form); } catch (error) { toast(errorText(error), true); }
      return;
    }
    if (!enabled() || !handledForm(form)) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try {
      if (form.matches("[data-content]")) await publishContent(form);
      else if (form.matches("[data-upload-call],[data-form-base],[data-new-form]")) await upsertDocument(form);
      else if (form.matches("[data-new-flow]")) await publishFlow(form);
      else if (form.matches("[data-backend-user]")) await upsertAdmin(form);
    } catch (error) {
      console.error(error);
      toast(errorText(error), true);
    }
  }, true);

  document.addEventListener("click", async (ev) => {
    const signout = ev.target.closest("[data-sb-signout]");
    const refresh = ev.target.closest("[data-sb-refresh]");
    const archive = ev.target.closest("[data-sb-archive]");
    if (!signout && !refresh && !archive) return;
    ev.preventDefault();
    try {
      if (signout) {
        await sb()?.auth.signOut();
        toast("Sesion Supabase cerrada.");
        await patchJefatura(true);
      }
      if (refresh) await patchJefatura(true);
      if (archive) await archiveItem(archive.dataset.sbArchive, archive.dataset.sbId);
    } catch (error) {
      console.error(error);
      toast(errorText(error), true);
    }
  }, true);

  async function runAfterRender() {
    addStyle();
    if (route() === "#/jefatura") await patchJefatura();
    setTimeout(renderPublicRoute, 220);
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
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runAfterRender);
  else runAfterRender();
})();
