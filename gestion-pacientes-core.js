(() => {
  const LEGACY_STORAGE_KEYS = ["crsPatientCasesBackupV1", "crsPriorityCases"];
  const SHEET_LABEL = "Gestion_pacientes";
  const CHIEF_ROLES = new Set(["admin", "owner", "desarrollador", "creador", "jefatura", "jefe", "jefe_turno"]);

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
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => `caso-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  let authState = { email: "", name: "Equipo Urgencia", role: "", active: false };
  let visibleRows = [];
  let renderVersion = 0;

  function purgeLegacyPatientStorage() {
    for (const key of LEGACY_STORAGE_KEYS) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
  }

  function client() {
    return window.CRS_SUPABASE?.client?.() || null;
  }

  async function refreshAuth() {
    const api = client();
    if (!api?.auth?.getUser) {
      authState = { email: "", name: "Equipo Urgencia", role: "", active: false };
      return authState;
    }

    try {
      const { data, error } = await api.auth.getUser();
      if (error || !data?.user) {
        authState = { email: "", name: "Equipo Urgencia", role: "", active: false };
        return authState;
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
        active: Boolean(profile && profile.active !== false)
      };
      return authState;
    } catch (error) {
      console.warn("No se pudo sincronizar sesión de Gestión pacientes", error);
      authState = { email: "", name: "Equipo Urgencia", role: "", active: false };
      return authState;
    }
  }

  function activeUser() {
    return {
      email: authState.email || "",
      name: authState.name || authState.email || "Equipo Urgencia"
    };
  }

  function isChief() {
    const role = clean(authState.role);
    const email = clean(authState.email);
    return Boolean(
      authState.active &&
      (CHIEF_ROLES.has(role) || email === "mdcarlosherrera@gmail.com")
    );
  }

  function apiUrl() {
    return String(window.CRS_PATIENT_CASES_CONFIG?.appsScriptUrl || "").trim();
  }

  async function postRequest(body) {
    const url = apiUrl();
    if (!url) {
      return { ok: false, error: "Falta configurar el servicio de Gestión ambulatoria." };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body)
      });
      const text = await response.text();
      let result = null;
      try {
        result = JSON.parse(text);
      } catch (_) {
        return {
          ok: false,
          error: text.trim().startsWith("<")
            ? "El despliegue de Apps Script devolvió una página HTML. Revisa que sea público y esté ejecutándose como propietario."
            : "Respuesta inválida del servicio de Gestión."
        };
      }
      if (!result || typeof result !== "object") {
        return { ok: false, error: "Respuesta inválida del servicio de Gestión." };
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "No se pudo conectar con el servicio de Gestión."
      };
    }
  }

  async function secureRequest(action, payload = {}) {
    await refreshAuth();
    if (!isChief()) {
      return { ok: false, error: "Inicia sesión con un usuario autorizado de Jefatura." };
    }

    const api = client();
    const anonKey = String(window.CRS_SUPABASE_CONFIG?.anonKey || "").trim();
    if (!api?.auth?.getSession || !anonKey) {
      return { ok: false, error: "No se pudo validar la sesión segura de Jefatura." };
    }

    const { data, error } = await api.auth.getSession();
    const accessToken = String(data?.session?.access_token || "").trim();
    if (error || !accessToken) {
      return { ok: false, error: "La sesión de Jefatura venció. Vuelve a iniciar sesión." };
    }

    const result = await postRequest({
      action,
      accessToken,
      supabaseAnonKey: anonKey,
      ...payload
    });
    if (result.error === "Acción no reconocida") {
      return { ok: false, error: "El backend de Gestión ambulatoria está desactualizado." };
    }
    return result;
  }

  function normalizeRut(value) {
    const compact = String(value || "").toUpperCase().replace(/[^0-9K]/g, "");
    if (compact.length < 2) return "";
    return `${compact.slice(0, -1)}-${compact.slice(-1)}`;
  }

  function normalizeCase(raw = {}) {
    const user = activeUser();
    return {
      id: raw.id || uid(),
      numero_solicitud: raw.numero_solicitud || raw.caseNumber || "",
      fecha_registro: raw.fecha_registro || raw.fecha || today(),
      registrado_por: raw.registrado_por || raw.medico_solicitante || user.email || user.name,
      medico_solicitante: raw.medico_solicitante || raw.registrado_por || "",
      rut_medico: normalizeRut(raw.rut_medico || raw.doctorRut || ""),
      paciente: raw.paciente || raw.patientName || "",
      run: raw.run || raw.rut || "",
      edad: raw.edad || "",
      telefono: raw.telefono || raw.phone || "",
      ubicacion: raw.ubicacion || "",
      flujo: raw.flujo || raw.especialidad || raw.flow || raw.protocol || "",
      motivo: raw.motivo || raw.diagnostico || "Gestión ambulatoria prioritaria posterior al alta",
      resumen_clinico: raw.resumen_clinico || raw.resumen || raw.summary || "",
      gestion_solicitada: raw.gestion_solicitada || raw.necesidad || raw.need || "",
      prioridad: raw.prioridad || "Alta",
      origen: raw.origen || "MASTER Urgencias HPH",
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
    return normalizeCase({
      fecha_registro: today(),
      registrado_por: values.medico_solicitante || "Médico de Urgencia",
      medico_solicitante: values.medico_solicitante || "",
      rut_medico: values.rut_medico || values.doctorRut || "",
      paciente: values.patientName || values.paciente,
      run: values.rut || values.run,
      telefono: values.phone || values.telefono,
      ubicacion: values.ubicacion || "Urgencia Adulto",
      flujo: protocol?.title || values.especialidad || values.flow || values.flujo || "",
      motivo: "Gestión ambulatoria prioritaria posterior al alta",
      resumen_clinico: values.summary || values.resumen_clinico,
      gestion_solicitada: values.need || values.gestion_solicitada,
      prioridad: values.prioridad || "Alta",
      origen: protocol?.slug
        ? `${location.origin}${location.pathname}#/especialidad/${protocol.slug}`
        : "MASTER Urgencias HPH",
      estado: "Pendiente",
      resuelto: "Pendiente",
      proximo_paso: "Pendiente de revisión por jefatura",
      responsable: "Jefatura"
    });
  }

  async function savePublicCase(item, doctorRut, serviceCode = "") {
    const payload = normalizeCase({ ...item, rut_medico: doctorRut });
    const result = await postRequest({
      action: "savePublicPatientCase",
      doctorRut: normalizeRut(doctorRut),
      serviceCode,
      case: payload
    });
    return result.ok
      ? { ...result, case: result.case || payload }
      : {
          ok: false,
          error: result.error || "No se pudo registrar la solicitud.",
          case: payload
        };
  }

  async function saveCase(item) {
    const payload = normalizeCase(item);
    const result = await secureRequest("savePatientCase", { case: payload });
    return result.ok
      ? { ...result, case: result.case || payload }
      : {
          ok: false,
          error: result.error || "No se pudo guardar el caso.",
          case: payload
        };
  }

  async function updateCase(id, patch) {
    return secureRequest("updatePatientCase", { id, patch });
  }

  async function listCases() {
    const result = await secureRequest("listPatientCases");
    if (!result.ok) {
      return {
        source: "unavailable",
        error: result.error || "No se pudo conectar con Drive.",
        rows: []
      };
    }
    return {
      source: "drive",
      spreadsheetUrl: result.spreadsheetUrl || "",
      rows: (result.cases || [])
        .map(normalizeCase)
        .sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)))
    };
  }

  async function saveFromPriorityForm(form) {
    const protocol = typeof findProtocolBySlug === "function"
      ? findProtocolBySlug(form.dataset.priorityForm)
      : null;
    const data = new FormData(form);
    const doctorRut = String(
      data.get("rut_medico") || data.get("doctorRut") || data.get("medicoRut") || ""
    ).trim();
    const item = fromFlow(protocol, {
      patientName: String(data.get("patientName") || "").trim(),
      rut: String(data.get("rut") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      summary: String(data.get("summary") || "").trim(),
      need: String(data.get("need") || "").trim(),
      medico_solicitante: String(data.get("medico_solicitante") || "").trim(),
      rut_medico: doctorRut
    });
    const code = String(data.get("serviceCode") || "").trim();
    if (
      !item.paciente ||
      !item.run ||
      !item.resumen_clinico ||
      !item.gestion_solicitada ||
      !item.medico_solicitante ||
      !doctorRut
    ) {
      return {
        ok: false,
        error: "Completa paciente, RUN, resumen clínico, gestión solicitada, médico y RUT del médico."
      };
    }
    return savePublicCase(item, doctorRut, code);
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
    if (mode === "mes") {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    return true;
  }

  function statusClass(value) {
    const c = clean(value);
    if (c.includes("resuelto") && !c.includes("no")) return "resuelto";
    if (c.includes("no") || c.includes("cancel")) return "noresuelto";
    if (c.includes("gestion")) return "gestion";
    return "pendiente";
  }

  function csvCell(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  function downloadCsv(rows, filename) {
    const headers = [
      "numero_solicitud", "id", "fecha_registro", "medico_solicitante",
      "rut_medico", "paciente", "run", "edad", "telefono", "ubicacion",
      "flujo", "motivo", "resumen_clinico", "gestion_solicitada", "prioridad",
      "origen", "estado", "resuelto", "proximo_paso", "responsable",
      "fecha_compromiso", "fecha_resolucion", "observaciones", "actualizado"
    ];
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
    ].join("\n");
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

  function updateForm(row) {
    return `<form class="case-update-form" data-patient-case-update="${esc(row.id)}"><label>Estado<select name="estado"><option ${row.estado === "Pendiente" ? "selected" : ""}>Pendiente</option><option ${row.estado === "En gestión" ? "selected" : ""}>En gestión</option><option ${row.estado === "Gestionada" ? "selected" : ""}>Gestionada</option><option ${row.estado === "Cerrada" ? "selected" : ""}>Cerrada</option><option ${row.estado === "Cancelada" ? "selected" : ""}>Cancelada</option></select></label><label>Próximo paso<textarea name="proximo_paso">${esc(row.proximo_paso)}</textarea></label><label>Responsable<input name="responsable" value="${esc(row.responsable)}"></label><label>Fecha resolución<input name="fecha_resolucion" type="date" value="${esc(String(row.fecha_resolucion || "").slice(0, 10))}"></label><button class="document-button" type="submit">Guardar seguimiento</button></form>`;
  }

  function tableHtml(rows) {
    const total = rows.length;
    const pending = rows.filter((row) => !["Gestionada", "Cerrada", "Cancelada"].includes(row.estado)).length;
    const resolved = rows.filter((row) => ["Gestionada", "Cerrada"].includes(row.estado)).length;
    const body = rows.length
      ? rows.map((row) => `<tr><td><strong>${esc(row.numero_solicitud || row.id)}</strong><br>${esc(String(row.fecha_registro).slice(0, 10))}<br><span class="patient-small">${esc(row.medico_solicitante || row.registrado_por)}${row.rut_medico ? `<br>${esc(row.rut_medico)}` : ""}</span></td><td><strong>${esc(row.paciente)}</strong><br>${esc(row.run)}${row.ubicacion ? `<br>${esc(row.ubicacion)}` : ""}</td><td>${esc(row.telefono)}</td><td><strong>${esc(row.flujo)}</strong><br>${esc(row.motivo)}<br><span class="patient-small">${esc(row.resumen_clinico)}</span></td><td>${esc(row.gestion_solicitada)}<br><span class="patient-small">Prioridad: ${esc(row.prioridad)}</span></td><td><span class="patient-status ${statusClass(row.estado)}">${esc(row.estado)}</span><br><span class="patient-small">${esc(row.responsable)}</span></td><td>${updateForm(row)}</td></tr>`).join("")
      : `<tr><td colspan="7">No hay solicitudes registradas.</td></tr>`;
    return `<section class="patient-grid"><article class="patient-card"><strong>Total solicitudes</strong><span class="patient-kpi">${total}</span></article><article class="patient-card"><strong>Pendientes/en gestión</strong><span class="patient-kpi">${pending}</span></article><article class="patient-card"><strong>Gestionadas/cerradas</strong><span class="patient-kpi">${resolved}</span></article></section><section class="patient-table-wrap"><table class="patient-table"><thead><tr><th>Solicitud / médico</th><th>Paciente</th><th>Contacto</th><th>Especialidad / motivo</th><th>Gestión solicitada</th><th>Estado</th><th>Seguimiento</th></tr></thead><tbody>${body}</tbody></table></section>`;
  }

  function applyFilters() {
    const query = clean($("[data-patient-filter='query']")?.value || "");
    const status = $("[data-patient-filter='estado']")?.value || "todos";
    const period = $("[data-patient-filter='periodo']")?.value || "todos";
    const rows = visibleRows.filter((row) => {
      const haystack = clean([
        row.numero_solicitud, row.paciente, row.run, row.telefono, row.ubicacion,
        row.flujo, row.medico_solicitante, row.rut_medico, row.motivo,
        row.resumen_clinico, row.gestion_solicitada, row.estado, row.proximo_paso
      ].join(" "));
      return (
        (!query || haystack.includes(query)) &&
        (status === "todos" || row.estado === status) &&
        dateInRange(row.fecha_registro, period)
      );
    });
    const mount = $("#patientCasesTable");
    if (mount) mount.innerHTML = tableHtml(rows);
  }

  function routeActions() {
    return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div>`;
  }

  function hero(text) {
    return `<section class="patient-hero"><h2>Gestión ambulatoria prioritaria</h2><p>${text}</p></section>`;
  }

  function publicFormHtml() {
    return `<section class="patient-card"><h3>Solicitar gestión ambulatoria</h3><p class="patient-note">Para pacientes que pueden egresar desde Urgencia, pero requieren una coordinación ambulatoria prioritaria para un alta segura.</p><p class="patient-note"><strong>Identificación del médico:</strong> en la primera solicitud ingresa tu RUT y el código interno del servicio. Después, tu RUT quedará habilitado y ya no necesitarás el código.</p><form class="case-update-form" data-public-patient-case><label>Paciente<input name="paciente" required autocomplete="off"></label><label>RUN del paciente<input name="run" required autocomplete="off" placeholder="12.345.678-9"></label><label>Teléfono<input name="telefono" type="tel" autocomplete="off"></label><label>Ubicación actual<input name="ubicacion" value="Urgencia Adulto" required></label><label>Especialidad requerida<select name="especialidad" required><option value="">Seleccionar</option><option>Cardiología</option><option>Nefrología</option><option>Gastroenterología</option><option>Neurología</option><option>Endocrinología</option><option>Hematología</option><option>Reumatología</option><option>Broncopulmonar</option><option>Cirugía</option><option>Traumatología</option><option>Urología</option><option>Otra</option></select></label><label>Prioridad<select name="prioridad" required><option>Media</option><option selected>Alta</option><option>Crítica</option></select></label><label>Resumen clínico<textarea name="resumen_clinico" required></textarea></label><label>Gestión solicitada<textarea name="gestion_solicitada" required placeholder="Ej: hora prioritaria con Cardiología dentro de 7 días"></textarea></label><label>Médico solicitante<input name="medico_solicitante" required autocomplete="name"></label><label>RUT del médico<input name="rut_medico" required autocomplete="off" placeholder="12.345.678-9"></label><label>Código interno del servicio <span class="patient-small">(solo la primera vez)</span><input name="serviceCode" type="password" autocomplete="off"></label><button class="document-button" type="submit">Solicitar gestión</button><div class="priority-status" data-public-patient-status aria-live="polite"></div></form></section>`;
  }

  async function renderPage() {
    if (location.hash !== "#/gestion/pacientes") return;
    const version = ++renderVersion;
    await refreshAuth();
    if (version !== renderVersion || location.hash !== "#/gestion/pacientes") return;

    $$(".page").forEach((page) => {
      page.classList.toggle("active", page.id === "managementPage");
    });
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestión ambulatoria prioritaria";
    if (!content) return;

    const publicBlock = publicFormHtml();
    if (!isChief()) {
      content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Registro rápido sin inicio de sesión. Jefatura administra el seguimiento.")}${publicBlock}</div>`;
      return;
    }

    content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Registro público y tablero restringido de Jefatura.")}${publicBlock}<section class="patient-card"><h3>Cargando solicitudes...</h3></section></div>`;
    const result = await listCases();
    if (version !== renderVersion || location.hash !== "#/gestion/pacientes") return;

    if (result.source !== "drive") {
      visibleRows = [];
      content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Registro público y tablero restringido de Jefatura.")}${publicBlock}<div class="patient-warn">No se pudo conectar con la planilla. ${esc(result.error || "Reintenta cuando haya conexión.")}</div><div class="patient-actions"><button class="document-button" data-refresh-patient-cases>Reintentar</button></div></div>`;
      return;
    }

    visibleRows = result.rows;
    content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Registro público y tablero restringido de Jefatura.")}${publicBlock}<section class="patient-card"><h3>Seguimiento de solicitudes</h3><div class="patient-note">Conectado a Google Sheets: ${SHEET_LABEL}</div>${result.spreadsheetUrl ? `<div class="patient-actions"><a class="document-button" href="${esc(result.spreadsheetUrl)}" target="_blank" rel="noopener">Abrir planilla Drive</a></div>` : ""}<div class="patient-filter"><label>Buscar<input data-patient-filter="query" type="search" placeholder="Solicitud, RUN, paciente, especialidad, médico..."></label><label>Estado<select data-patient-filter="estado"><option value="todos">Todos</option><option>Pendiente</option><option>En gestión</option><option>Gestionada</option><option>Cerrada</option><option>Cancelada</option></select></label><label>Periodo<select data-patient-filter="periodo"><option value="todos">Todos</option><option value="dia">Hoy</option><option value="semana">Últimos 7 días</option><option value="mes">Mes actual</option></select></label></div><div class="patient-actions"><button class="document-button" data-export-patient-cases="dia">Descargar día</button><button class="document-button" data-export-patient-cases="semana">Descargar semana</button><button class="document-button" data-export-patient-cases="mes">Descargar mes</button><button class="document-button" data-refresh-patient-cases>Actualizar desde Drive</button></div></section><div id="patientCasesTable"></div></div>`;
    applyFilters();
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-public-patient-case]");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const status = $("[data-public-patient-status]", form);
    const button = $("button[type='submit']", form);
    if (button) button.disabled = true;
    if (status) status.textContent = "Enviando solicitud...";

    const data = new FormData(form);
    const doctorName = String(data.get("medico_solicitante") || "").trim();
    const doctorRut = String(data.get("rut_medico") || "").trim();
    const item = normalizeCase({
      paciente: String(data.get("paciente") || "").trim(),
      run: String(data.get("run") || "").trim(),
      telefono: String(data.get("telefono") || "").trim(),
      ubicacion: String(data.get("ubicacion") || "").trim(),
      especialidad: String(data.get("especialidad") || "").trim(),
      resumen_clinico: String(data.get("resumen_clinico") || "").trim(),
      gestion_solicitada: String(data.get("gestion_solicitada") || "").trim(),
      prioridad: String(data.get("prioridad") || "Alta").trim(),
      medico_solicitante: doctorName,
      rut_medico: doctorRut,
      registrado_por: doctorName
    });
    const serviceCode = String(data.get("serviceCode") || "").trim();
    const required = [
      item.paciente, item.run, item.ubicacion, item.flujo,
      item.resumen_clinico, item.gestion_solicitada,
      item.medico_solicitante, item.rut_medico
    ];
    if (required.some((value) => !value)) {
      if (status) status.textContent = "Completa todos los campos obligatorios.";
      if (button) button.disabled = false;
      return;
    }

    const result = await savePublicCase(item, doctorRut, serviceCode);
    if (result.ok) {
      const number = result.case?.numero_solicitud || result.numero_solicitud || result.caseNumber || "registrada";
      if (status) {
        status.textContent = result.doctor_registered
          ? `Solicitud ${number} creada correctamente. Tu RUT quedó habilitado para futuras solicitudes.`
          : `Solicitud ${number} creada correctamente.`;
      }
      form.reset();
      const locationInput = $("[name='ubicacion']", form);
      const doctorNameInput = $("[name='medico_solicitante']", form);
      const doctorRutInput = $("[name='rut_medico']", form);
      if (locationInput) locationInput.value = "Urgencia Adulto";
      if (doctorNameInput) doctorNameInput.value = result.doctor?.nombre || doctorName;
      if (doctorRutInput) doctorRutInput.value = result.doctor?.rut_medico || normalizeRut(doctorRut);
      if (isChief()) await renderPage();
    } else if (status) {
      status.textContent = `No se pudo registrar: ${result.error || "error desconocido"}`;
    }
    if (button) button.disabled = false;
  }, true);

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-priority-form]");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const result = await saveFromPriorityForm(form);
    const status = form.closest(".priority-panel")?.querySelector(".priority-status");
    if (status) {
      status.textContent = result.ok
        ? "Solicitud enviada correctamente."
        : `No se pudo enviar. ${result.error || "Reintenta."}`;
    }
    if (result?.ok) {
      form.reset();
      form.hidden = true;
    }
  }, true);

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-patient-case-update]");
    if (!form) return;
    event.preventDefault();
    const result = await updateCase(
      form.dataset.patientCaseUpdate,
      Object.fromEntries(new FormData(form).entries())
    );
    if (!result.ok) {
      alert(`No se pudo guardar el seguimiento: ${result.error || "error desconocido"}`);
      return;
    }
    await renderPage();
  });

  document.addEventListener("input", (event) => {
    if (event.target.closest?.("[data-patient-filter]")) applyFilters();
  }, true);

  document.addEventListener("change", (event) => {
    if (event.target.closest?.("[data-patient-filter]")) applyFilters();
  }, true);

  document.addEventListener("click", async (event) => {
    if (event.target.closest?.("[data-refresh-patient-cases]")) {
      await renderPage();
      return;
    }
    const exportButton = event.target.closest?.("[data-export-patient-cases]");
    if (exportButton) {
      const mode = exportButton.dataset.exportPatientCases;
      downloadCsv(
        visibleRows.filter((row) => dateInRange(row.fecha_registro, mode)),
        `gestion-ambulatoria-${mode}-${today()}.csv`
      );
    }
  }, true);

  function route() {
    if (location.hash === "#/gestion/pacientes") {
      renderPage().catch(console.error);
    } else {
      renderVersion += 1;
    }
  }

  purgeLegacyPatientStorage();
  window.addEventListener("hashchange", route);
  window.addEventListener("crs:supabase-ready", route);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", route, { once: true });
  } else {
    route();
  }

  window.CRS_PATIENT_CASES = {
    isChief,
    refreshAuth,
    fromFlow,
    saveCase,
    savePublicCase,
    saveFromPriorityForm,
    listCases,
    renderPage
  };
})();
