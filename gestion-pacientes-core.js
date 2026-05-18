(() => {
  const SESSION_KEY = "crsAuthSessionV3";
  const LOCAL_KEY = "crsPatientCasesBackupV1";
  const SHEET_LABEL = "Gestion_pacientes";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => `caso-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function session() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; }
  }
  function activeUser() {
    const user = session();
    return { email: user?.email || user?.username || "", name: user?.name || user?.email || user?.username || "Equipo Urgencia" };
  }
  function isChief() {
    const user = session();
    const role = clean(user?.role);
    const email = clean(user?.email || user?.username);
    return Boolean(user && (["admin", "owner", "desarrollador", "jefatura", "jefe", "jefe_turno"].includes(role) || email === "mdcarlosherrera@gmail.com"));
  }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") || []; } catch { return []; }
  }
  function writeLocal(rows) { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows)); }
  function apiUrl() { return String(window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim(); }
  async function apiPost(action, payload = {}) {
    const url = apiUrl();
    if (!url) return { ok: false, error: "Falta configurar appsScriptUrl." };
    const user = activeUser();
    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, email: user.email, ...payload })
    });
    return response.json();
  }

  function normalizeCase(raw = {}) {
    return {
      id: raw.id || uid(),
      fecha_registro: raw.fecha_registro || raw.fecha || today(),
      registrado_por: raw.registrado_por || activeUser().email || activeUser().name,
      paciente: raw.paciente || raw.patientName || "",
      run: raw.run || raw.rut || "",
      edad: raw.edad || "",
      telefono: raw.telefono || raw.phone || "",
      flujo: raw.flujo || raw.flow || raw.protocol || "",
      motivo: raw.motivo || raw.diagnostico || "Gestión prioritaria desde cierre de derivación",
      resumen_clinico: raw.resumen_clinico || raw.resumen || raw.summary || "",
      gestion_solicitada: raw.gestion_solicitada || raw.necesidad || raw.need || "",
      prioridad: raw.prioridad || "Alta",
      origen: raw.origen || "Cierre de derivación CRS HPH",
      estado: raw.estado || raw.status || "Pendiente",
      resuelto: raw.resuelto || "Pendiente",
      proximo_paso: raw.proximo_paso || raw.nextStep || "Pendiente de revisión por jefatura",
      responsable: raw.responsable || "Jefatura",
      fecha_compromiso: raw.fecha_compromiso || "",
      fecha_resolucion: raw.fecha_resolucion || "",
      observaciones: raw.observaciones || "",
      actualizado: raw.actualizado || new Date().toISOString()
    };
  }

  function fromFlow(protocol, values = {}) {
    const user = activeUser();
    return normalizeCase({
      fecha_registro: today(),
      registrado_por: user.email || user.name,
      paciente: values.patientName || values.paciente,
      run: values.rut || values.run,
      telefono: values.phone || values.telefono,
      flujo: protocol?.title || values.flow || values.flujo || "",
      motivo: "Gestión prioritaria solicitada desde cierre de derivación",
      resumen_clinico: values.summary || values.resumen_clinico,
      gestion_solicitada: values.need || values.gestion_solicitada,
      prioridad: values.prioridad || "Alta",
      origen: protocol?.slug ? `${location.origin}${location.pathname}#/especialidad/${protocol.slug}` : "Cierre de derivación CRS HPH",
      estado: "Pendiente",
      resuelto: "Pendiente",
      proximo_paso: "Pendiente de revisión por jefatura",
      responsable: "Jefatura",
      observaciones: "Registro automático desde Página 2 → Especialidades y flujos → Cierre de derivación."
    });
  }

  async function saveCase(item) {
    const payload = normalizeCase(item);
    const result = await apiPost("savePatientCase", { case: payload });
    const backup = readLocal().filter((row) => row.id !== payload.id);
    backup.unshift({ ...payload, sync: result.ok ? "drive" : "local" });
    writeLocal(backup.slice(0, 250));
    return result.ok ? { ...result, case: payload } : { ok: true, localOnly: true, error: result.error, case: payload };
  }

  async function updateCase(id, patch) {
    const result = await apiPost("updatePatientCase", { id, patch });
    const local = readLocal().map((row) => row.id === id ? { ...row, ...patch, actualizado: new Date().toISOString() } : row);
    writeLocal(local);
    return result.ok ? result : { ok: true, localOnly: true, error: result.error };
  }

  async function listCases() {
    const result = await apiPost("listPatientCases", {});
    if (result.ok) {
      return {
        source: "drive",
        spreadsheetUrl: result.spreadsheetUrl || "",
        rows: (result.cases || []).map(normalizeCase).sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)))
      };
    }
    return {
      source: "local",
      error: result.error || "No se pudo conectar con Drive.",
      rows: readLocal().map(normalizeCase).sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)))
    };
  }

  async function saveFromPriorityForm(form) {
    const protocol = typeof findProtocolBySlug === "function" ? findProtocolBySlug(form.dataset.priorityForm) : null;
    const data = new FormData(form);
    const item = fromFlow(protocol, {
      patientName: String(data.get("patientName") || "").trim(),
      rut: String(data.get("rut") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      summary: String(data.get("summary") || "").trim(),
      need: String(data.get("need") || "").trim()
    });
    if (!item.paciente && !item.run && !item.resumen_clinico && !item.gestion_solicitada) return null;
    const result = await saveCase(item);
    const status = form.closest(".priority-panel")?.querySelector(".priority-status");
    if (status) {
      status.textContent = result.localOnly
        ? "Caso guardado localmente. Pendiente sincronizar con Drive."
        : "Caso enviado a planilla Drive de gestión prioritaria.";
    }
    return result;
  }

  function addStyle() {
    if ($("#gestion-pacientes-core-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-pacientes-core-style";
    style.textContent = `
      .patient-chip{border-left-color:#0891b2!important}.patient-shell{display:grid;gap:14px}.patient-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#0f172a,#075985 54%,#0f766e);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.patient-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.3rem);line-height:1}.patient-hero p{margin:0;color:#dff7ff;max-width:900px;line-height:1.45}.patient-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0891b2;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.patient-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.patient-actions{display:flex;gap:10px;flex-wrap:wrap}.patient-note{padding:12px;border:1px solid #bae6fd;border-radius:10px;background:#f0f9ff;color:#075985;font-weight:750}.patient-warn{padding:12px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#7f1d1d;font-weight:750}.patient-filter{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end}.patient-filter label,.case-update-form label{display:grid;gap:5px;font-weight:850;color:#24312d}.patient-filter input,.patient-filter select,.case-update-form input,.case-update-form select,.case-update-form textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.case-update-form{display:grid;gap:8px;min-width:280px}.case-update-form textarea{min-height:74px}.patient-table-wrap{overflow:auto;border:1px solid #dfe8e4;border-radius:12px;background:#fff}.patient-table{width:100%;border-collapse:collapse;min-width:1180px}.patient-table th,.patient-table td{padding:9px 10px;border-bottom:1px solid #e5ebe8;text-align:left;vertical-align:top}.patient-table th{background:#f6f8f7;color:#44504b;text-transform:uppercase;font-size:.76rem}.patient-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-weight:900;font-size:.78rem}.patient-status.pendiente{background:#fff7ed;color:#9a3412}.patient-status.gestion{background:#eff6ff;color:#1d4ed8}.patient-status.resuelto{background:#ecfdf5;color:#047857}.patient-status.noresuelto{background:#fff1f2;color:#be123c}.patient-kpi{font-size:1.9rem;font-weight:950;color:#10201c}.patient-small{font-size:.86rem;color:#64748b;line-height:1.32}@media(max-width:700px){.patient-actions{display:grid}.patient-table{min-width:980px}.document-button,.back-link{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function dateInRange(dateValue, mode) {
    if (!mode || mode === "todos") return true;
    const date = new Date(`${String(dateValue || "").slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (mode === "dia") return date >= startToday;
    if (mode === "semana") { const start = new Date(startToday); start.setDate(start.getDate() - 6); return date >= start; }
    if (mode === "mes") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    return true;
  }
  function statusClass(value) {
    const c = clean(value);
    if (c.includes("resuelto") && !c.includes("no")) return "resuelto";
    if (c.includes("no")) return "noresuelto";
    if (c.includes("gestion")) return "gestion";
    return "pendiente";
  }
  function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
  function downloadCsv(rows, filename) {
    const headers = ["id","fecha_registro","registrado_por","paciente","run","edad","telefono","flujo","motivo","resumen_clinico","gestion_solicitada","prioridad","origen","estado","resuelto","proximo_paso","responsable","fecha_compromiso","fecha_resolucion","observaciones","actualizado"];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  let visibleRows = [];
  function updateForm(row) {
    return `<form class="case-update-form" data-patient-case-update="${esc(row.id)}"><label>Estado<select name="estado"><option ${row.estado === "Pendiente" ? "selected" : ""}>Pendiente</option><option ${row.estado === "En gestión" ? "selected" : ""}>En gestión</option><option ${row.estado === "Resuelto" ? "selected" : ""}>Resuelto</option><option ${row.estado === "No resuelto" ? "selected" : ""}>No resuelto</option></select></label><label>¿Resuelto?<select name="resuelto"><option ${row.resuelto === "Pendiente" ? "selected" : ""}>Pendiente</option><option ${row.resuelto === "NO" ? "selected" : ""}>NO</option><option ${row.resuelto === "SI" ? "selected" : ""}>SI</option></select></label><label>Próximo paso<textarea name="proximo_paso">${esc(row.proximo_paso)}</textarea></label><label>Responsable<input name="responsable" value="${esc(row.responsable)}"></label><label>Fecha resolución<input name="fecha_resolucion" type="date" value="${esc(String(row.fecha_resolucion || "").slice(0, 10))}"></label><button class="document-button" type="submit">Guardar seguimiento</button></form>`;
  }
  function tableHtml(rows) {
    const total = rows.length;
    const pending = rows.filter((r) => r.estado !== "Resuelto" && r.resuelto !== "SI").length;
    const resolved = rows.filter((r) => r.estado === "Resuelto" || r.resuelto === "SI").length;
    return `<section class="patient-grid"><article class="patient-card"><strong>Total casos</strong><span class="patient-kpi">${total}</span></article><article class="patient-card"><strong>Pendientes/en gestión</strong><span class="patient-kpi">${pending}</span></article><article class="patient-card"><strong>Resueltos</strong><span class="patient-kpi">${resolved}</span></article></section><section class="patient-table-wrap"><table class="patient-table"><thead><tr><th>Fecha</th><th>Paciente</th><th>Contacto</th><th>Flujo / motivo</th><th>Gestión solicitada</th><th>Estado</th><th>Seguimiento</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td>${esc(String(row.fecha_registro).slice(0, 10))}<br><span class="patient-small">${esc(row.registrado_por)}</span></td><td><strong>${esc(row.paciente)}</strong><br>${esc(row.run)}${row.edad ? `<br>${esc(row.edad)} años` : ""}</td><td>${esc(row.telefono)}</td><td><strong>${esc(row.flujo)}</strong><br>${esc(row.motivo)}<br><span class="patient-small">${esc(row.resumen_clinico)}</span></td><td>${esc(row.gestion_solicitada)}</td><td><span class="patient-status ${statusClass(row.estado)}">${esc(row.estado)}</span><br>Resuelto: ${esc(row.resuelto)}<br><span class="patient-small">${esc(row.responsable)}</span></td><td>${updateForm(row)}</td></tr>`).join("") : `<tr><td colspan="7">No hay casos registrados.</td></tr>`}</tbody></table></section>`;
  }
  function applyFilters() {
    const q = clean($("[data-patient-filter='query']")?.value || "");
    const estado = $("[data-patient-filter='estado']")?.value || "todos";
    const periodo = $("[data-patient-filter='periodo']")?.value || "todos";
    const rows = visibleRows.filter((row) => {
      const haystack = clean([row.paciente, row.run, row.telefono, row.flujo, row.motivo, row.resumen_clinico, row.gestion_solicitada, row.estado, row.proximo_paso].join(" "));
      return (!q || haystack.includes(q)) && (estado === "todos" || row.estado === estado) && dateInRange(row.fecha_registro, periodo);
    });
    const mount = $("#patientCasesTable");
    if (mount) mount.innerHTML = tableHtml(rows);
  }

  async function renderPage() {
    addStyle();
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestión de pacientes";
    if (!content) return;
    if (!isChief()) {
      content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Acceso restringido a jefatura.</p></section><div class="patient-warn">Los médicos registran el caso desde el cierre de derivación. La planilla y seguimiento solo son visibles para jefatura.</div></div>`;
      return;
    }
    content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Casos alimentados desde “¿Requiere gestión prioritaria?” en cada flujo CRS. Vista restringida a jefatura.</p></section><section class="patient-card"><h3>Cargando planilla...</h3></section></div>`;
    const result = await listCases();
    visibleRows = result.rows;
    const source = result.source === "drive" ? `Conectado a Google Sheets: ${SHEET_LABEL}` : `Modo respaldo local: ${esc(result.error || "sin conexión con Drive")}`;
    content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Casos alimentados desde el cierre de derivación. Vista restringida a jefatura.</p></section><section class="patient-card"><h3>Seguimiento y descarga</h3><div class="patient-note">${source}</div>${result.spreadsheetUrl ? `<div class="patient-actions"><a class="document-button" href="${esc(result.spreadsheetUrl)}" target="_blank" rel="noopener">Abrir planilla Drive</a></div>` : ""}<div class="patient-filter"><label>Buscar<input data-patient-filter="query" type="search" placeholder="RUN, paciente, flujo, motivo..."></label><label>Estado<select data-patient-filter="estado"><option value="todos">Todos</option><option>Pendiente</option><option>En gestión</option><option>Resuelto</option><option>No resuelto</option></select></label><label>Periodo<select data-patient-filter="periodo"><option value="todos">Todos</option><option value="dia">Hoy</option><option value="semana">Últimos 7 días</option><option value="mes">Mes actual</option></select></label></div><div class="patient-actions"><button class="document-button" data-export-patient-cases="dia">Descargar día</button><button class="document-button" data-export-patient-cases="semana">Descargar semana</button><button class="document-button" data-export-patient-cases="mes">Descargar mes</button><button class="document-button" data-refresh-patient-cases>Actualizar desde Drive</button></div></section><div id="patientCasesTable"></div></div>`;
    applyFilters();
  }

  function injectHomeButton() {
    if (location.hash !== "#/gestion" || !isChief()) return;
    const grid = $("#managementContent .gestion-grid");
    if (!grid || grid.querySelector(".patient-chip")) return;
    grid.insertAdjacentHTML("beforeend", `<a class="gestion-card patient-chip" href="#/gestion/pacientes"><strong>🧭 Gestión pacientes</strong><span>Solo jefatura: casos registrados desde el cierre de derivación.</span></a>`);
  }

  document.addEventListener("submit", (event) => {
    const priorityForm = event.target.closest("[data-priority-form]");
    if (priorityForm) saveFromPriorityForm(priorityForm);
  }, true);

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-patient-case-update]");
    if (!form) return;
    event.preventDefault();
    await updateCase(form.dataset.patientCaseUpdate, Object.fromEntries(new FormData(form).entries()));
    await renderPage();
  });
  document.addEventListener("input", (event) => { if (event.target.closest("[data-patient-filter]")) applyFilters(); }, true);
  document.addEventListener("change", (event) => { if (event.target.closest("[data-patient-filter]")) applyFilters(); }, true);
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-refresh-patient-cases]")) { await renderPage(); return; }
    const exportBtn = event.target.closest("[data-export-patient-cases]");
    if (exportBtn) {
      const mode = exportBtn.dataset.exportPatientCases;
      downloadCsv(visibleRows.filter((row) => dateInRange(row.fecha_registro, mode)), `gestion-pacientes-${mode}-${today()}.csv`);
    }
  }, true);

  function route() {
    addStyle();
    if (location.hash === "#/gestion/pacientes") renderPage();
    if (location.hash === "#/gestion") setTimeout(injectHomeButton, 100);
  }
  window.addEventListener("hashchange", route);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route); else route();

  window.CRS_PATIENT_CASES = { isChief, fromFlow, saveCase, saveFromPriorityForm, listCases, renderPage };
})();
