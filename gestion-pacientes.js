(() => {
  const SESSION_KEY = "crsAuthSessionV3";
  const LOCAL_KEY = "crsGestionPacientesLocalV1";
  const SHEET_LABEL = "Gestion_pacientes";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => `caso-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") || []; } catch { return []; } };
  const writeLocal = (rows) => localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  const session = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "") || null; } catch { return null; } };

  function addStyle() {
    if ($("#gestion-pacientes-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-pacientes-style";
    style.textContent = `
      .patient-chip{border-left-color:#0891b2!important}.patient-shell{display:grid;gap:14px}.patient-hero{display:grid;gap:12px;padding:clamp(20px,4vw,34px);border-radius:16px;background:linear-gradient(135deg,#0f172a,#075985 54%,#0f766e);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.22)}.patient-hero h2{margin:0;color:#fff;font-size:clamp(2rem,5vw,3.3rem);line-height:1}.patient-hero p{margin:0;color:#dff7ff;max-width:900px;line-height:1.45}.patient-actions,.patient-row-actions{display:flex;gap:10px;flex-wrap:wrap}.patient-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.patient-card{display:grid;gap:10px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0891b2;border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.08)}.patient-card h3{margin:0;color:#10201c}.patient-card p{margin:0;color:#52615c;line-height:1.4}.patient-form{display:grid;gap:12px}.patient-form label{display:grid;gap:5px;font-weight:850;color:#24312d}.patient-form input,.patient-form select,.patient-form textarea,.case-update-form input,.case-update-form select,.case-update-form textarea{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff;color:#10201c}.patient-form textarea,.case-update-form textarea{min-height:82px}.patient-table-wrap{overflow:auto;border:1px solid #dfe8e4;border-radius:12px;background:#fff}.patient-table{width:100%;border-collapse:collapse;min-width:1180px}.patient-table th,.patient-table td{padding:9px 10px;border-bottom:1px solid #e5ebe8;text-align:left;vertical-align:top}.patient-table th{background:#f6f8f7;color:#44504b;text-transform:uppercase;font-size:.76rem}.patient-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-weight:900;font-size:.78rem}.patient-status.pendiente{background:#fff7ed;color:#9a3412}.patient-status.gestion{background:#eff6ff;color:#1d4ed8}.patient-status.resuelto{background:#ecfdf5;color:#047857}.patient-status.noresuelto{background:#fff1f2;color:#be123c}.patient-note{padding:12px;border:1px solid #bae6fd;border-radius:10px;background:#f0f9ff;color:#075985;font-weight:750}.patient-warn{padding:12px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#7f1d1d;font-weight:750}.case-update-form{display:grid;gap:8px;min-width:280px}.patient-small{font-size:.86rem;color:#64748b;line-height:1.32}.patient-filter{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end}.patient-filter label{display:grid;gap:5px;font-weight:850;color:#24312d}.patient-filter input,.patient-filter select{min-height:40px;padding:8px 10px;border:1px solid #cbd5d1;border-radius:8px;background:#fff}.patient-kpi{font-size:1.9rem;font-weight:950;color:#10201c}@media(max-width:700px){.patient-actions,.patient-row-actions{display:grid}.document-button,.back-link{width:100%;justify-content:center}.patient-table{min-width:980px}}
    `;
    document.head.append(style);
  }

  function activeUser() {
    const user = session();
    return {
      email: user?.email || user?.username || "",
      name: user?.name || user?.email || user?.username || "Equipo Urgencia"
    };
  }

  function apiUrl() {
    return String(window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim();
  }

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
      motivo: raw.motivo || raw.diagnostico || "",
      resumen_clinico: raw.resumen_clinico || raw.resumen || raw.summary || "",
      gestion_solicitada: raw.gestion_solicitada || raw.necesidad || raw.need || "",
      prioridad: raw.prioridad || "Alta",
      origen: raw.origen || "Urgencia Adulto HPH",
      estado: raw.estado || raw.status || "Pendiente",
      resuelto: raw.resuelto || "Pendiente",
      proximo_paso: raw.proximo_paso || raw.nextStep || "",
      responsable: raw.responsable || "",
      fecha_compromiso: raw.fecha_compromiso || "",
      fecha_resolucion: raw.fecha_resolucion || "",
      observaciones: raw.observaciones || "",
      actualizado: raw.actualizado || raw.fecha_registro || today()
    };
  }

  function statusClass(value) {
    const c = clean(value);
    if (c.includes("resuelto") && !c.includes("no")) return "resuelto";
    if (c.includes("no")) return "noresuelto";
    if (c.includes("gestion")) return "gestion";
    return "pendiente";
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  }

  function downloadCsv(rows, filename) {
    const headers = ["id","fecha_registro","registrado_por","paciente","run","edad","telefono","flujo","motivo","resumen_clinico","gestion_solicitada","prioridad","origen","estado","resuelto","proximo_paso","responsable","fecha_compromiso","fecha_resolucion","observaciones","actualizado"];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function dateInRange(dateValue, mode) {
    if (!mode || mode === "todos") return true;
    const date = new Date(`${String(dateValue || "").slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (mode === "dia") return date >= startToday;
    if (mode === "semana") {
      const start = new Date(startToday);
      start.setDate(start.getDate() - 6);
      return date >= start;
    }
    if (mode === "mes") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    return true;
  }

  let currentRows = [];

  async function loadCases() {
    const result = await apiPost("listPatientCases", {});
    if (result.ok) {
      currentRows = (result.cases || []).map(normalizeCase).sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)));
      return { source: "drive", spreadsheetUrl: result.spreadsheetUrl || "", rows: currentRows };
    }
    currentRows = readLocal().map(normalizeCase).sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)));
    return { source: "local", error: result.error || "No se pudo conectar con Drive.", rows: currentRows };
  }

  async function saveCase(payload) {
    const item = normalizeCase(payload);
    const result = await apiPost("savePatientCase", { case: item });
    if (result.ok) return result;
    const rows = readLocal();
    rows.unshift(item);
    writeLocal(rows);
    return { ok: true, localOnly: true, error: result.error };
  }

  async function updateCase(id, patch) {
    const result = await apiPost("updatePatientCase", { id, patch });
    if (result.ok) return result;
    const rows = readLocal().map((row) => row.id === id ? { ...row, ...patch, actualizado: new Date().toISOString() } : row);
    writeLocal(rows);
    return { ok: true, localOnly: true, error: result.error };
  }

  function patientHomeButton() {
    return `<a class="gestion-card patient-chip" href="#/gestion/pacientes"><strong>🧭 Gestión pacientes</strong><span>Planilla Drive para casos con gestión prioritaria, resolución y próximo paso.</span></a>`;
  }

  function injectHomeButton() {
    if (!location.hash.startsWith("#/gestion") || location.hash !== "#/gestion") return;
    const grid = $("#managementContent .gestion-grid");
    if (!grid || grid.querySelector(".patient-chip")) return;
    grid.insertAdjacentHTML("beforeend", patientHomeButton());
  }

  function formHtml() {
    const user = activeUser();
    return `<section class="patient-card"><h3>Registrar solicitud de gestión prioritaria</h3><p>Usa estos campos para dejar trazabilidad del caso desde Urgencia hacia jefatura/gestión ambulatoria.</p><form class="patient-form" data-patient-case-form><div class="patient-grid"><label>Fecha de solicitud<input name="fecha_registro" type="date" value="${today()}" required></label><label>Médico / usuario solicitante<input name="registrado_por" value="${esc(user.email || user.name)}" required></label><label>Nombre paciente<input name="paciente" required></label><label>RUN<input name="run" placeholder="12.345.678-9"></label><label>Edad<input name="edad" inputmode="numeric"></label><label>Teléfono contacto<input name="telefono" inputmode="tel"></label><label>Flujo / especialidad<input name="flujo" placeholder="Ej: TVP, Hemodinamia, CRS..."></label><label>Prioridad<select name="prioridad"><option>Alta</option><option>Media</option><option>Baja</option></select></label></div><label>Motivo / diagnóstico<input name="motivo" placeholder="Motivo principal de la gestión"></label><label>Resumen clínico<textarea name="resumen_clinico" placeholder="Datos clínicos clave, exámenes, DAU, hallazgos importantes"></textarea></label><label>Gestión solicitada<textarea name="gestion_solicitada" placeholder="Qué se requiere gestionar: hora, contacto, examen, control, coordinación, rescate, etc."></textarea></label><div class="patient-grid"><label>Estado inicial<select name="estado"><option>Pendiente</option><option>En gestión</option><option>Resuelto</option><option>No resuelto</option></select></label><label>¿Resuelto?<select name="resuelto"><option>Pendiente</option><option>NO</option><option>SI</option></select></label><label>Responsable<input name="responsable" placeholder="Jefatura / gestor / equipo"></label><label>Fecha compromiso<input name="fecha_compromiso" type="date"></label></div><label>Qué se hará a continuación<textarea name="proximo_paso" placeholder="Próximo paso acordado"></textarea></label><label>Observaciones<textarea name="observaciones" placeholder="Comentarios adicionales"></textarea></label><button class="document-button" type="submit">Guardar en planilla de gestión</button><div data-patient-save-status></div></form></section>`;
  }

  function filtersHtml(meta) {
    const sourceMsg = meta.source === "drive"
      ? `Conectado a Google Sheets: ${SHEET_LABEL}`
      : `Modo local por ahora: ${esc(meta.error || "sin conexión al backend")}`;
    return `<section class="patient-card"><h3>Seguimiento y descarga</h3><div class="patient-note">${sourceMsg}</div>${meta.spreadsheetUrl ? `<div class="patient-actions"><a class="document-button" href="${esc(meta.spreadsheetUrl)}" target="_blank" rel="noopener">Abrir planilla Drive</a></div>` : ""}<div class="patient-filter"><label>Buscar<input data-patient-filter="query" type="search" placeholder="RUN, paciente, flujo, motivo..."></label><label>Estado<select data-patient-filter="estado"><option value="todos">Todos</option><option>Pendiente</option><option>En gestión</option><option>Resuelto</option><option>No resuelto</option></select></label><label>Periodo<select data-patient-filter="periodo"><option value="todos">Todos</option><option value="dia">Hoy</option><option value="semana">Últimos 7 días</option><option value="mes">Mes actual</option></select></label></div><div class="patient-actions"><button class="document-button" data-export-patients="dia">Descargar día</button><button class="document-button" data-export-patients="semana">Descargar semana</button><button class="document-button" data-export-patients="mes">Descargar mes</button><button class="document-button" data-refresh-patients>Actualizar desde Drive</button></div></section>`;
  }

  function updateForm(row) {
    return `<form class="case-update-form" data-case-update="${esc(row.id)}"><label>Estado<select name="estado"><option ${row.estado === "Pendiente" ? "selected" : ""}>Pendiente</option><option ${row.estado === "En gestión" ? "selected" : ""}>En gestión</option><option ${row.estado === "Resuelto" ? "selected" : ""}>Resuelto</option><option ${row.estado === "No resuelto" ? "selected" : ""}>No resuelto</option></select></label><label>¿Resuelto?<select name="resuelto"><option ${row.resuelto === "Pendiente" ? "selected" : ""}>Pendiente</option><option ${row.resuelto === "NO" ? "selected" : ""}>NO</option><option ${row.resuelto === "SI" ? "selected" : ""}>SI</option></select></label><label>Próximo paso<textarea name="proximo_paso">${esc(row.proximo_paso)}</textarea></label><label>Responsable<input name="responsable" value="${esc(row.responsable)}"></label><label>Fecha resolución<input name="fecha_resolucion" type="date" value="${esc(String(row.fecha_resolucion || "").slice(0, 10))}"></label><button class="document-button" type="submit">Guardar seguimiento</button></form>`;
  }

  function tableHtml(rows) {
    const total = rows.length;
    const pending = rows.filter((r) => !["Resuelto"].includes(r.estado) && r.resuelto !== "SI").length;
    const resolved = rows.filter((r) => r.estado === "Resuelto" || r.resuelto === "SI").length;
    return `<section class="patient-grid"><article class="patient-card"><strong>Total casos</strong><span class="patient-kpi">${total}</span></article><article class="patient-card"><strong>Pendientes/en gestión</strong><span class="patient-kpi">${pending}</span></article><article class="patient-card"><strong>Resueltos</strong><span class="patient-kpi">${resolved}</span></article></section><section class="patient-table-wrap"><table class="patient-table"><thead><tr><th>Fecha</th><th>Paciente</th><th>Contacto</th><th>Flujo / motivo</th><th>Gestión solicitada</th><th>Estado</th><th>Seguimiento</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td>${esc(String(row.fecha_registro).slice(0, 10))}<br><span class="patient-small">${esc(row.registrado_por)}</span></td><td><strong>${esc(row.paciente)}</strong><br>${esc(row.run)}${row.edad ? `<br>${esc(row.edad)} años` : ""}</td><td>${esc(row.telefono)}</td><td><strong>${esc(row.flujo)}</strong><br>${esc(row.motivo)}<br><span class="patient-small">${esc(row.resumen_clinico)}</span></td><td>${esc(row.gestion_solicitada)}</td><td><span class="patient-status ${statusClass(row.estado)}">${esc(row.estado)}</span><br>Resuelto: ${esc(row.resuelto)}<br><span class="patient-small">${esc(row.responsable)}</span></td><td>${updateForm(row)}</td></tr>`).join("") : `<tr><td colspan="7">No hay casos registrados.</td></tr>`}</tbody></table></section>`;
  }

  function applyFilters() {
    const query = clean($("[data-patient-filter='query']")?.value || "");
    const estado = $("[data-patient-filter='estado']")?.value || "todos";
    const periodo = $("[data-patient-filter='periodo']")?.value || "todos";
    const filtered = currentRows.filter((row) => {
      const matchQuery = !query || clean([row.paciente, row.run, row.telefono, row.flujo, row.motivo, row.resumen_clinico, row.gestion_solicitada, row.estado, row.proximo_paso].join(" ")).includes(query);
      const matchEstado = estado === "todos" || row.estado === estado;
      const matchDate = dateInRange(row.fecha_registro, periodo);
      return matchQuery && matchEstado && matchDate;
    });
    const target = $("#patientCasesTable");
    if (target) target.innerHTML = tableHtml(filtered);
  }

  async function renderPatientsPage() {
    addStyle();
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestión de pacientes";
    if (!content) return;
    content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Registro conectado al Drive actual mediante Apps Script. Más adelante puedes compartir la misma planilla con jefatura o cambiar el backend a otro Drive.</p></section><div id="patientFormMount">${formHtml()}</div><div id="patientFiltersMount"><section class="patient-card"><h3>Cargando planilla...</h3></section></div><div id="patientCasesTable"></div></div>`;
    const meta = await loadCases();
    $("#patientFiltersMount").innerHTML = filtersHtml(meta);
    applyFilters();
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.matches("[data-patient-case-form]")) {
      event.preventDefault();
      const status = form.querySelector("[data-patient-save-status]");
      if (status) status.innerHTML = `<div class="patient-note">Guardando...</div>`;
      const payload = Object.fromEntries(new FormData(form).entries());
      const result = await saveCase(payload);
      if (status) status.innerHTML = result.localOnly ? `<div class="patient-warn">Guardado local. No se pudo escribir en Drive: ${esc(result.error || "")}</div>` : `<div class="patient-note">Caso guardado en la planilla Drive.</div>`;
      form.reset();
      form.fecha_registro.value = today();
      form.registrado_por.value = activeUser().email || activeUser().name;
      await loadCases();
      applyFilters();
      return;
    }
    if (form.matches("[data-case-update]")) {
      event.preventDefault();
      const id = form.dataset.caseUpdate;
      const patch = Object.fromEntries(new FormData(form).entries());
      await updateCase(id, patch);
      await loadCases();
      applyFilters();
    }
  }, true);

  document.addEventListener("input", (event) => {
    if (event.target.closest("[data-patient-filter]")) applyFilters();
  }, true);

  document.addEventListener("change", (event) => {
    if (event.target.closest("[data-patient-filter]")) applyFilters();
  }, true);

  document.addEventListener("click", async (event) => {
    const refresh = event.target.closest("[data-refresh-patients]");
    if (refresh) { await renderPatientsPage(); return; }
    const exportBtn = event.target.closest("[data-export-patients]");
    if (exportBtn) {
      const mode = exportBtn.dataset.exportPatients;
      const rows = currentRows.filter((row) => dateInRange(row.fecha_registro, mode));
      downloadCsv(rows, `gestion-pacientes-${mode}-${today()}.csv`);
    }
  }, true);

  function route() {
    addStyle();
    if (location.hash === "#/gestion") setTimeout(injectHomeButton, 80);
    if (location.hash === "#/gestion/pacientes") renderPatientsPage();
  }

  window.addEventListener("hashchange", route);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route);
  else route();
})();
