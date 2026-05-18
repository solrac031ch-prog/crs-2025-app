(() => {
  const FLOWS_KEY = "crsGestionFlowsV2";
  const DB_NAME = "crs-hph-files-v2";
  const STORE = "files";
  const categoryOrder = ["Flujo", "CRS", "Poli choque", "Hospitalizados", "Protocolo"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const slugify = (value) => clean(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "protocolo-jefatura";
  const readFlows = () => {
    try { return JSON.parse(localStorage.getItem(FLOWS_KEY) || "[]") || []; }
    catch { return []; }
  };

  let dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function getFile(fileId) {
    if (!fileId) return null;
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(fileId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
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
    const title = item.title || "Protocolo agregado por jefatura";
    const category = categoryOrder.includes(item.category) ? item.category : "Protocolo";
    const summary = item.description || item.summary || "Protocolo/documento agregado desde el módulo de jefatura.";
    return {
      ...item,
      title,
      category,
      summary,
      slug: item.slug || `jefatura-${slugify(title)}`,
      tags: ["Jefatura", category, item.fileName || item.url ? "Documento" : "Manual"].filter(Boolean),
      createdAt: item.createdAt || ""
    };
  }

  function customProtocols() {
    return readFlows().map(normalizeFlow).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function activeCategory() {
    const active = $("[data-category].active");
    return active?.dataset.category || "Todos";
  }

  function activeShift() {
    const active = $("[data-shift].active");
    return active?.dataset.shift || "all";
  }

  function haystack(protocol) {
    return clean([protocol.title, protocol.category, protocol.summary, protocol.description, protocol.fileName, protocol.url, ...(protocol.tags || [])].join(" "));
  }

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

    const grouped = protocols.reduce((acc, protocol) => {
      (acc[protocol.category] ||= []).push(protocol);
      return acc;
    }, {});

    categoryOrder.filter((category) => grouped[category]).forEach((category) => appendCustomSection(category, grouped[category]));
    Object.keys(grouped).filter((category) => !categoryOrder.includes(category)).sort().forEach((category) => appendCustomSection(category, grouped[category]));

    const meta = $("#resultsMeta");
    if (meta) meta.textContent = `${meta.textContent || "Protocolos"} · ${protocols.length} agregado${protocols.length === 1 ? "" : "s"} por jefatura`;
  }

  function sourceActions(protocol) {
    const pieces = [];
    if (protocol.url) pieces.push(`<a class="document-button" href="${esc(protocol.url)}" target="_blank" rel="noopener noreferrer">Abrir link</a>`);
    if (protocol.fileId) {
      pieces.push(`<button class="document-button" type="button" data-custom-protocol-open="${esc(protocol.fileId)}">Abrir archivo</button>`);
      pieces.push(`<button class="document-button" type="button" data-custom-protocol-download="${esc(protocol.fileId)}">Descargar</button>`);
    }
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
      <section class="protocol-card">
        <span class="page-badge">Jefatura</span>
        <p class="protocol-summary">${esc(protocol.summary)}</p>
        <div class="tags">${(protocol.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
      </section>
      <section class="detail-section">
        <p class="detail-label">Detalle operativo</p>
        <div class="grid">
          <div class="field"><strong>Tipo</strong><span>${esc(protocol.category)}</span></div>
          <div class="field"><strong>Origen</strong><span>Módulo Jefatura</span></div>
          ${protocol.fileName ? `<div class="field"><strong>Archivo</strong><span>${esc(protocol.fileName)}</span></div>` : ""}
        </div>
      </section>
      <section class="source-docs-panel">
        <p class="detail-label">Documento fuente</p>
        <h2>Documento agregado</h2>
        <p>Abrir o descargar el respaldo subido por jefatura.</p>
        <div class="custom-source-actions">${sourceActions(protocol)}</div>
      </section>
      <div class="custom-note">Este protocolo fue agregado desde Módulo Jefatura. Para hacerlo permanente en el código base, después se puede consolidar en app.js.</div>
    `;
  }

  async function openFile(fileId, download = false) {
    const item = await getFile(fileId);
    if (!item) {
      alert("No encontré el archivo local asociado. Si se subió en otro computador, usa mejor un link de Google Drive.");
      return;
    }
    const url = URL.createObjectURL(item.blob);
    if (download) {
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name || "documento";
      document.body.append(a);
      a.click();
      a.remove();
    } else {
      window.open(url, "_blank");
    }
  }

  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-custom-protocol-open]");
    if (open) {
      event.preventDefault();
      openFile(open.dataset.customProtocolOpen, false);
      return;
    }
    const download = event.target.closest("[data-custom-protocol-download]");
    if (download) {
      event.preventDefault();
      openFile(download.dataset.customProtocolDownload, true);
    }
  }, true);

  function route() {
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
