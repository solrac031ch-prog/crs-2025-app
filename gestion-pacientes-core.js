(() => {
  const LEGACY_STORAGE_KEYS = ["crsPatientCasesBackupV1", "crsPriorityCases"];
  const LEGACY_SESSION_KEY = "crsAuthSessionV3";
  const SHEET_LABEL = "Gestion_pacientes";
  const CHIEF_ROLES = new Set(["admin", "owner", "desarrollador", "creador", "jefatura", "jefe", "jefe_turno"]);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => `caso-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  let authState = { email: "", name: "Equipo Urgencia", role: "", active: false, source: "none" };
  let visibleRows = [];

  function purgeLegacyPatientStorage() {
    for (const key of LEGACY_STORAGE_KEYS) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
  }

  function legacySession() {
    try { return JSON.parse(sessionStorage.getItem(LEGACY_SESSION_KEY) || "") || null; } catch { return null; }
  }

  function setLegacyAuthFallback() {
    const user = legacySession();
    if (!user) return authState;
    authState = {
      email: user.email || user.username || "",
      name: user.name || user.email || user.username || "Equipo Urgencia",
      role: user.role || "",
      active: true,
      source: "legacy"
    };
    return authState;
  }

  async function refreshAuth() {
    const api = window.CRS_SUPABASE?.client?.();
    if (!api?.auth?.getUser) return setLegacyAuthFallback();
    try {
      const { data, error } = await api.auth.getUser();
      if (error || !data?.user) {
        authState = { email: "", name: "Equipo Urgencia", role: "", active: false, source: "supabase" };
        return setLegacyAuthFallback();
      }
      const user = data.user;
      const email = String(user.email || "").trim().toLowerCase();
      let profile = null;
      if (email) {
        const result = await api
          .from("crs_admins")
          .select("email,display_name,role,active")
          .eq("email", email)
          .maybeSingle();
        if (!result.error) profile = result.data || null;
      }
      authState = {
        email,
        name: profile?.display_name || user.user_metadata?.display_name || email || "Equipo Urgencia",
        role: profile?.role || user.user_metadata?.role || "",
        active: profile ? profile.active !== false : Boolean(email),
        source: "supabase"
      };
      return authState;
    } catch (error) {
      console.warn("No se pudo sincronizar sesión de Gestión pacientes", error);
      return setLegacyAuthFallback();
    }
  }

  function activeUser() {
    return { email: authState.email || "", name: authState.name || authState.email || "Equipo Urgencia" };
  }

  function isChief() {
    const role = clean(authState.role);
    const email = clean(authState.email);
    return Boolean(authState.active && (CHIEF_ROLES.has(role) || email === "mdcarlosherrera@gmail.com"));
  }

  function apiUrl() {
    return String(window.CRS_PATIENT_CASES_CONFIG?.appsScriptUrl || window.CRS_GOOGLE_AUTH_CONFIG?.appsScriptUrl || "").trim();
  }

  async function apiPost(action, payload = {}) {
    await refreshAuth();
    const url = apiUrl();
    if (!url) return { ok: false, error: "Falta configurar appsScriptUrl." };
    const user = activeUser();
    if (!user.email) return { ok: false, error: "Inicia sesión antes de usar Gestión de pacientes." };
    try {
      const response = await fetch(url, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, email: user.email, ...payload })
      });
      const data = await response.json();
      return data && typeof data === "object" ? data : { ok: false, error: "Respuesta inválida del servicio de gestión." };
    } catch (error) {
      return { ok: false, error: error?.message || "No se pudo conectar con el servicio de gestión." };
    }
  }

  function normalizeCase(raw = {}) {
    const user = activeUser();
    return {
      id: raw.id || uid(),
      fecha_registro: raw.fecha_registro || raw.fecha || today(),
      registrado_por: raw.registrado_por || user.email || user.name,
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
    return result.ok ? { ...result, case: payload } : { ok: false, error: result.error || "No se pudo guardar el caso.", case: payload };
  }

  async function updateCase(id, patch) {
    return apiPost("updatePatientCase", { id, patch });
  }

  async function listCases() {
    const result = await apiPost("listPatientCases", {});
    if (!result.ok) {
      return { source: "unavailable", error: result.error || "No se pudo conectar con Drive.", rows: [] };
    }
    return {
      source: "drive",
      spreadsheetUrl: result.spreadsheetUrl || "",
      rows: (result.cases || []).map(normalizeCase).sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)))
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
    if (!item.paciente && !item.run && !item.resumen_clinico && !item.gestion_solicitada) return { ok: false, error: "Completa los datos del caso." };
    const result = await saveCase(item);
    const status = form.closest(".priority-panel")?.querySelector(".priority-status");
    if (status) {
      status.textContent = result.ok
        ? "Caso enviado a la planilla de Gestión prioritaria."
        : `No se pudo enviar el caso. No quedó guardado en este equipo. ${result.error || "Reintenta cuando haya conexión."}`;
    }
    return result;
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
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
    await refreshAuth();
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestión de pacientes";
    if (!content) return;
    if (!isChief()) {
      content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Acceso restringido a jefatura.</p></section><div class="patient-warn">Inicia sesión con un usuario autorizado de Jefatura para ver la planilla.</div></div>`;
      return;
    }
    content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Casos alimentados desde “¿Requiere gestión prioritaria?” en cada flujo CRS. Vista restringida a jefatura.</p></section><section class="patient-card"><h3>Cargando planilla...</h3></section></div>`;
    const result = await listCases();
    if (result.source !== "drive") {
      visibleRows = [];
      content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Vista restringida a jefatura.</p></section><div class="patient-warn">No se pudo conectar con la planilla. Por privacidad, CRS no guarda nombres, RUN, teléfonos ni resúmenes clínicos en este navegador. ${esc(result.error || "Reintenta cuando haya conexión.")}</div><div class="patient-actions"><button class="document-button" data-refresh-patient-cases>Reintentar</button></div></div>`;
      return;
    }
    visibleRows = result.rows;
    content.innerHTML = `<div class="patient-shell"><div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div><section class="patient-hero"><h2>Gestión prioritaria de pacientes</h2><p>Casos alimentados desde el cierre de derivación. Vista restringida a jefatura.</p></section><section class="patient-card"><h3>Seguimiento y descarga</h3><div class="patient-note">Conectado a Google Sheets: ${SHEET_LABEL}</div>${result.spreadsheetUrl ? `<div class="patient-actions"><a class="document-button" href="${esc(result.spreadsheetUrl)}" target="_blank" rel="noopener">Abrir planilla Drive</a></div>` : ""}<div class="patient-filter"><label>Buscar<input data-patient-filter="query" type="search" placeholder="RUN, paciente, flujo, motivo..."></label><label>Estado<select data-patient-filter="estado"><option value="todos">Todos</option><option>Pendiente</option><option>En gestión</option><option>Resuelto</option><option>No resuelto</option></select></label><label>Periodo<select data-patient-filter="periodo"><option value="todos">Todos</option><option value="dia">Hoy</option><option value="semana">Últimos 7 días</option><option value="mes">Mes actual</option></select></label></div><div class="patient-actions"><button class="document-button" data-export-patient-cases="dia">Descargar día</button><button class="document-button" data-export-patient-cases="semana">Descargar semana</button><button class="document-button" data-export-patient-cases="mes">Descargar mes</button><button class="document-button" data-refresh-patient-cases>Actualizar desde Drive</button></div></section><div id="patientCasesTable"></div></div>`;
    applyFilters();
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-priority-form]");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const result = await saveFromPriorityForm(form);
    if (result?.ok) {
      form.reset();
      form.hidden = true;
    }
  }, true);

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-patient-case-update]");
    if (!form) return;
    event.preventDefault();
    const result = await updateCase(form.dataset.patientCaseUpdate, Object.fromEntries(new FormData(form).entries()));
    if (!result.ok) {
      alert(`No se pudo guardar el seguimiento: ${result.error || "error desconocido"}`);
      return;
    }
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

  async function route() {
    if (location.hash === "#/gestion/pacientes") await renderPage();
  }

  purgeLegacyPatientStorage();
  window.addEventListener("hashchange", () => { route().catch(console.error); });
  window.addEventListener("crs:supabase-ready", () => { route().catch(console.error); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { route().catch(console.error); });
  else route().catch(console.error);

  window.CRS_PATIENT_CASES = { isChief, refreshAuth, fromFlow, saveCase, saveFromPriorityForm, listCases, renderPage };
})();
