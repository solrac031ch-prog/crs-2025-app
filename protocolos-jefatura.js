(() => {
  const SESSION_KEY = "crsAuthSessionV3";
  const FLOWS_KEY = "crsGestionFlowsV2";
  const categoryOrder = ["Flujo", "CRS", "Poli choque", "Hospitalizados", "Protocolo"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const slugify = (value) => clean(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "protocolo-jefatura";
  const readFlows = () => { try { return JSON.parse(localStorage.getItem(FLOWS_KEY) || "[]") || []; } catch { return []; } };
  const writeFlows = (items) => localStorage.setItem(FLOWS_KEY, JSON.stringify(items));
  const session = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; } };
  const isChief = () => {
    const user = session();
    const role = clean(user?.role);
    const email = clean(user?.email || user?.username);
    return Boolean(user && (["admin", "owner", "desarrollador", "jefatura", "jefe", "jefe_turno"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  };

  function apiUrl() { return String(window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim(); }
  async function apiPost(action, payload = {}) {
    const url = apiUrl();
    if (!url) return { ok: false, error: "Falta configurar Apps Script URL" };
    const user = session();
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, email: user?.email || user?.username || "", ...payload })
    });
    return res.json();
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function uploadManagedProtocol(form) {
    if (!isChief()) return null;
    const data = new FormData(form);
    const file = form.file?.files?.[0] || null;
    const status = form.querySelector("[data-protocol-upload-status]") || document.createElement("div");
    status.className = "note";
    status.dataset.protocolUploadStatus = "true";
    status.textContent = "Subiendo a Drive...";
    if (!status.parentNode) form.append(status);

    const filePayload = file ? {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataBase64: await readFileAsBase64(file)
    } : null;

    const payload = {
      protocol: {
        title: String(data.get("title") || "").trim(),
        category: String(data.get("category") || "Protocolo").trim(),
        summary: String(data.get("summary") || "").trim(),
        url: String(data.get("url") || "").trim()
      },
      file: filePayload
    };
    if (!payload.protocol.title) return null;

    const result = await apiPost("saveManagedProtocol", payload);
    if (!result.ok) {
      status.className = "note danger";
      status.textContent = result.error || "No se pudo subir a Drive. Se guardará solo en este navegador.";
      return null;
    }

    const list = readFlows().filter((item) => item.id !== result.protocol.id);
    list.unshift(result.protocol);
    writeFlows(list);
    window.dispatchEvent(new Event("crs:protocolos-jefatura-actualizados"));
    status.textContent = "Protocolo guardado en Drive. Disponible para otros PC/celulares.";
    return result.protocol;
  }

  async function syncRemoteProtocols() {
    const result = await apiPost("listManagedProtocols", {});
    if (!result.ok) return false;
    const remote = (result.protocols || []).map(normalizeFlow);
    const localOnly = readFlows().filter((item) => !item.remote);
    const merged = [...remote, ...localOnly.filter((local) => !remote.some((item) => item.id === local.id))];
    writeFlows(merged);
    return true;
  }

  function addStyle() {
    if ($("#protocolos-jefatura-style")) return;
    const style = document.createElement("style");
    style.id = "protocolos-jefatura-style";
    style.textContent = `
      .custom-protocols-section{border:1px solid #dfe8e4;border-radius:16px;padding:14px;background:#fbfdfc;margin-top:16px}.custom-protocols-section .category-title{display:flex;gap:8px;align-items:center}.custom-protocols-section .category-title:after{content:"Jefatura";font-size:.72rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase;background:#e0f2fe;color:#075985;border-radius:999px;padding:4px 8px}.custom-source-actions{display:flex;gap:10px;flex-wrap:wrap}.custom-note{padding:12px;border:1px solid #bae6fd;background:#f0f9ff;color:#075985;border-radius:10px;font-weight:750}.custom-protocol-tag{display:inline-flex;border-radius:999px;background:#e0f2fe;color:#075985;padding:4px 8px;font-weight:850;font-size:.8rem}@media(max-width:680px){.custom-source-actions{display:grid}.custom-source-actions .document-button{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function normalizeFlow(item) {
    const title = item.title || item.titulo || "Protocolo agregado por jefatura";
    const category = categoryOrder.includes(item.category || item.categoria) ? (item.category || item.categoria) : "Protocolo";
    const summary = item.description || item.summary || item.resumen || "Protocolo/documento agregado desde el módulo de jefatura.";
    const url = item.driveUrl || item.drive_url || item.url || "";
    return {
      ...item,
      title,
      category,
      summary,
      description: summary,
      url,
      driveUrl: item.driveUrl || item.drive_url || "",
      slug: item.slug || `jefatura-${slugify(title)}-${String(item.id || "").slice(0, 8)}`,
      tags: ["Jefatura", category, item.fileName || item.file_name || url ? "Documento" : "Manual"].filter(Boolean),
      fileName: item.fileName || item.file_name || "",
      createdAt: item.createdAt || item.creado || "",
      remote: Boolean(item.remote || item.driveUrl || item.drive_url)
    };
  }

  function customProtocols() {
    return readFlows().map(normalizeFlow).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function activeCategory() { return $("[data-category].active")?.dataset.category || "Todos"; }
  function activeShift() { return $("[data-shift].active")?.dataset.shift || "all"; }
  function haystack(protocol) { return clean([protocol.title, protocol.category, protocol.summary, protocol.description, protocol.fileName, protocol.url, ...(protocol.tags || [])].join(" ")); }
  function visibleCustomProtocols() {
    const query = clean($("#searchInput")?.value || "");
    const category = activeCategory();
    const shift = activeShift();
    return customProtocols().filter((protocol) => {
      const text = haystack(protocol);
      const categoryMatch = category === "Todos" || protocol.category === category;
      const queryMatch = !query || text.includes(query);
      const shiftMatch = shift === "all" || text.includes("horario habil") || text.includes("horario inhabil") || text.includes("inhabil") || text.includes("habil");
      return categoryMatch && queryMatch && shiftMatch;
    });
  }
  function sticker(protocol) {
    const title = clean(protocol.title);
    if (title.includes("hemodinam")) return "HEM";
    if (title.includes("uro")) return "URO";
    if (title.includes("radio")) return "RXI";
    if (title.includes("neuro")) return "NEU";
    if (title.includes("donante")) return "DON";
    if (title.includes("vascular")) return "VAS";
    if (title.includes("tvp")) return "TVP";
    return protocol.category.slice(0, 3).toUpperCase();
  }

  function appendCustomSection(category, protocols) {
    const mount = $("#specialtyGroups");
    const template = $("#specialtyButtonTemplate");
    if (!mount || !template || !protocols.length) return;
    const section = document.createElement("section");
    section.className = "category-section custom-protocols-section";
    section.dataset.customProtocols = category;
    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category;
    const grid = document.createElement("div");
    grid.className = "specialty-grid";
    protocols.forEach((protocol) => {
      const node = template.content.cloneNode(true);
      const link = node.querySelector(".specialty-button");
      link.href = `#/especialidad/${protocol.slug}`;
      link.querySelector(".specialty-sticker").textContent = sticker(protocol);
      link.querySelector("strong").textContent = protocol.title;
      grid.append(link);
    });
    section.append(title, grid);
    mount.append(section);
  }

  function renderCustomList() {
    addStyle();
    if (location.hash.split("?")[0] !== "#/especialidades") return;
    $$('[data-custom-protocols]').forEach((node) => node.remove());
    const protocols = visibleCustomProtocols();
    if (!protocols.length) return;
    const grouped = protocols.reduce((acc, protocol) => { (acc[protocol.category] ||= []).push(protocol); return acc; }, {});
    categoryOrder.filter((category) => grouped[category]).forEach((category) => appendCustomSection(category, grouped[category]));
    Object.keys(grouped).filter((category) => !categoryOrder.includes(category)).sort().forEach((category) => appendCustomSection(category, grouped[category]));
    const meta = $("#resultsMeta");
    if (meta) meta.textContent = `${meta.textContent || "Protocolos"} · ${protocols.length} agregado${protocols.length === 1 ? "" : "s"} por jefatura`;
  }

  function sourceActions(protocol) {
    const pieces = [];
    if (protocol.url) pieces.push(`<a class="document-button" href="${esc(protocol.url)}" target="_blank" rel="noopener noreferrer">Abrir archivo/link</a>`);
    if (protocol.fileId && !protocol.remote) pieces.push(`<button class="document-button" type="button" data-custom-protocol-local="${esc(protocol.fileId)}">Abrir archivo local</button>`);
    return pieces.length ? pieces.join("") : `<span class="document-button-disabled">Sin documento asociado</span>`;
  }

  function renderCustomDetail() {
    addStyle();
    const match = location.hash.split("?")[0].match(/^#\/especialidad\/(.+)$/);
    if (!match) return;
    const slug = decodeURIComponent(match[1]);
    const protocol = customProtocols().find((item) => item.slug === slug);
    if (!protocol) return;
    const category = $("#protocolCategory");
    const title = $("#protocolTitle");
    const detail = $("#protocolDetail");
    if (!category || !title || !detail) return;
    category.textContent = `${protocol.category} · Agregado por jefatura`;
    title.textContent = protocol.title;
    detail.innerHTML = `
      <section class="protocol-card"><span class="page-badge">Jefatura</span><p class="protocol-summary">${esc(protocol.summary)}</p><div class="tags">${(protocol.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div></section>
      <section class="detail-section"><p class="detail-label">Detalle operativo</p><div class="grid"><div class="field"><strong>Tipo</strong><span>${esc(protocol.category)}</span></div><div class="field"><strong>Origen</strong><span>Módulo Jefatura / Drive</span></div>${protocol.fileName ? `<div class="field"><strong>Archivo</strong><span>${esc(protocol.fileName)}</span></div>` : ""}</div></section>
      <section class="source-docs-panel"><p class="detail-label">Documento fuente</p><h2>Documento agregado</h2><p>Abrir el respaldo subido a Drive por jefatura.</p><div class="custom-source-actions">${sourceActions(protocol)}</div></section>
      <div class="custom-note">Disponible desde cualquier PC, iOS o Android si fue subido con el backend actualizado. Evita subir documentos con datos sensibles de pacientes.</div>
    `;
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-new-flow]");
    if (!form || form.dataset.remoteHandled === "true") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    form.dataset.remoteHandled = "true";
    const protocol = await uploadManagedProtocol(form);
    form.dataset.remoteHandled = "";
    if (protocol) {
      alert("Protocolo guardado en Drive y publicado para todos los dispositivos.");
      form.reset();
      if (location.hash === "#/jefatura") location.hash = "#/especialidades";
      else renderCustomList();
    }
  }, true);

  document.addEventListener("click", async (event) => {
    const local = event.target.closest("[data-custom-protocol-local]");
    if (!local) return;
    event.preventDefault();
    alert("Este archivo quedó solo en este navegador. Vuelve a subirlo desde Jefatura para guardarlo en Drive y verlo desde cualquier dispositivo.");
  }, true);

  async function route() {
    await syncRemoteProtocols();
    setTimeout(renderCustomList, 80);
    setTimeout(renderCustomDetail, 90);
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("storage", route);
  window.addEventListener("crs:protocolos-jefatura-actualizados", route);
  document.addEventListener("input", (event) => { if (event.target?.id === "searchInput") setTimeout(renderCustomList, 0); }, true);
  document.addEventListener("click", (event) => { if (event.target.closest("[data-category],[data-shift]")) setTimeout(renderCustomList, 0); }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route); else route();
})();
