(() => {
  const LEGACY_STORAGE_KEYS = ["crsPatientCasesBackupV1", "crsPriorityCases"];
  const SHEET_LABEL = "Seguimiento de solicitudes";
  const CHIEF_ROLES = new Set(["admin", "owner", "desarrollador", "creador", "jefatura", "jefe", "jefe_turno"]);
  const MODE_KEY = "crsGestionCasesModeV1";
  const LEGACY_FILTER_KEY = "crsGestionCasesFilterV1";
  const TYPE_KEY = "crsPatientReviewTypeV2";
  const UHD_SCOPE_KEY = "crsPatientUhdScopeV2";
  const AUTH_TTL = 5 * 60 * 1000;
  const CASES_TTL = 45 * 1000;
  const PAGE_SIZE = 20;

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
  let authCheckedAt = 0;
  let authPromise = null;
  let visibleRows = [];
  let casesFetchedAt = 0;
  let casesSpreadsheetUrl = "";
  let casesPromise = null;
  let renderVersion = 0;
  let displayLimit = PAGE_SIZE;
  let lastFilteredRows = [];
  let filterTimer = 0;

  function purgeLegacyPatientStorage() {
    for (const key of LEGACY_STORAGE_KEYS) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
  }

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function client() {
    return window.CRS_SUPABASE?.client?.() || null;
  }

  function resetAuth() {
    authState = { email: "", name: "Equipo Urgencia", role: "", active: false };
    authCheckedAt = 0;
    authPromise = null;
  }

  async function refreshAuth(force = false) {
    if (!force && authCheckedAt && Date.now() - authCheckedAt < AUTH_TTL) return authState;
    if (authPromise) return authPromise;

    authPromise = (async () => {
      const api = client();
      if (!api?.auth?.getUser) {
        resetAuth();
        return authState;
      }

      try {
        const { data, error } = await api.auth.getUser();
        if (error || !data?.user) {
          resetAuth();
          authCheckedAt = Date.now();
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
        authCheckedAt = Date.now();
        return authState;
      } catch (error) {
        console.warn("No se pudo sincronizar sesión de Gestión pacientes", error);
        resetAuth();
        authCheckedAt = Date.now();
        return authState;
      } finally {
        authPromise = null;
      }
    })();

    return authPromise;
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
    if (!url) return { ok: false, error: "Falta configurar el servicio de Gestión ambulatoria." };

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
      return result && typeof result === "object"
        ? result
        : { ok: false, error: "Respuesta inválida del servicio de Gestión." };
    } catch (error) {
      return { ok: false, error: error?.message || "No se pudo conectar con el servicio de Gestión." };
    }
  }

  async function secureRequest(action, payload = {}) {
    await refreshAuth(false);
    if (!isChief()) return { ok: false, error: "Inicia sesión con un usuario autorizado de Jefatura." };

    const api = client();
    const anonKey = String(window.CRS_SUPABASE_CONFIG?.anonKey || "").trim();
    if (!api?.auth?.getSession || !anonKey) {
      return { ok: false, error: "No se pudo validar la sesión segura de Jefatura." };
    }

    const { data, error } = await api.auth.getSession();
    const accessToken = String(data?.session?.access_token || "").trim();
    if (error || !accessToken) {
      resetAuth();
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

  function caseType(raw = {}) {
    const explicit = clean(raw.tipo_solicitud || raw.tipo || "");
    if (explicit.includes("uhd") || explicit.includes("domicili")) return "uhd";
    const haystack = clean([
      raw.flujo, raw.origen, raw.motivo, raw.gestion_solicitada,
      raw.proximo_paso, raw.responsable
    ].join(" "));
    return haystack.includes("uhd") || haystack.includes("hospitalizacion domiciliaria")
      ? "uhd"
      : "ambulatoria";
  }

  function normalizeCase(raw = {}) {
    const user = activeUser();
    const item = {
      id: raw.id || uid(),
      numero_solicitud: raw.numero_solicitud || raw.caseNumber || "",
      tipo_solicitud: raw.tipo_solicitud || raw.tipo || "",
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
    item.tipo_solicitud = caseType(item) === "uhd" ? "UHD" : "Gestión ambulatoria";
    return item;
  }

  function fromFlow(protocol, values = {}) {
    return normalizeCase({
      tipo_solicitud: "Gestión ambulatoria",
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

  async function savePublicCase(item, doctorRut) {
    const payload = normalizeCase({ ...item, rut_medico: doctorRut });
    const result = await postRequest({
      action: "savePublicPatientCase",
      doctorRut: normalizeRut(doctorRut),
      case: payload
    });
    if (result.ok) {
      casesFetchedAt = 0;
      return { ...result, case: normalizeCase(result.case || payload) };
    }
    return { ok: false, error: result.error || "No se pudo registrar la solicitud.", case: payload };
  }

  async function saveCase(item) {
    const payload = normalizeCase(item);
    const result = await secureRequest("savePatientCase", { case: payload });
    if (result.ok) casesFetchedAt = 0;
    return result.ok
      ? { ...result, case: normalizeCase(result.case || payload) }
      : { ok: false, error: result.error || "No se pudo guardar el caso.", case: payload };
  }

  async function updateCase(id, patch) {
    const result = await secureRequest("updatePatientCase", { id, patch });
    if (result.ok && result.case) {
      const next = normalizeCase(result.case);
      const index = visibleRows.findIndex((row) => String(row.id) === String(id));
      if (index >= 0) visibleRows[index] = next;
      casesFetchedAt = Date.now();
    }
    return result;
  }

  async function listCases(options = {}) {
    const force = Boolean(options.force);
    if (!force && visibleRows.length && Date.now() - casesFetchedAt < CASES_TTL) {
      return { source: "drive", spreadsheetUrl: casesSpreadsheetUrl, rows: visibleRows };
    }
    if (casesPromise) return casesPromise;

    casesPromise = (async () => {
      const result = await secureRequest("listPatientCases");
      if (!result.ok) {
        return { source: "unavailable", error: result.error || "No se pudo conectar con Drive.", rows: [] };
      }
      visibleRows = (result.cases || [])
        .map(normalizeCase)
        .sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)));
      casesSpreadsheetUrl = result.spreadsheetUrl || "";
      casesFetchedAt = Date.now();
      return { source: "drive", spreadsheetUrl: casesSpreadsheetUrl, rows: visibleRows };
    })().finally(() => { casesPromise = null; });

    return casesPromise;
  }

  async function saveFromPriorityForm(form) {
    const protocol = typeof findProtocolBySlug === "function"
      ? findProtocolBySlug(form.dataset.priorityForm)
      : null;
    const data = new FormData(form);
    const doctorRut = String(data.get("rut_medico") || data.get("doctorRut") || data.get("medicoRut") || "").trim();
    const item = fromFlow(protocol, {
      patientName: String(data.get("patientName") || "").trim(),
      rut: String(data.get("rut") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      summary: String(data.get("summary") || "").trim(),
      need: String(data.get("need") || "").trim(),
      medico_solicitante: String(data.get("medico_solicitante") || "").trim(),
      rut_medico: doctorRut
    });
    if (!item.paciente || !item.run || !item.resumen_clinico || !item.gestion_solicitada || !item.medico_solicitante || !doctorRut) {
      return { ok: false, error: "Completa paciente, RUN, resumen clínico, gestión solicitada, médico y RUT del médico." };
    }
    return savePublicCase(item, doctorRut);
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

  function statusClass(value) {
    const valueClean = clean(value);
    if (valueClean.includes("gestionada") || valueClean.includes("cerrada")) return "resuelto";
    if (valueClean.includes("cancel")) return "noresuelto";
    if (valueClean.includes("gestion")) return "gestion";
    return "pendiente";
  }

  function typeLabel(row) {
    return caseType(row) === "uhd" ? "UHD" : "Ambulatoria";
  }

  function presentationDate(row) {
    if (row.fecha_compromiso) return String(row.fecha_compromiso).slice(0, 10);
    const text = `${row.gestion_solicitada || ""} ${row.proximo_paso || ""}`;
    const match = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    return match ? match[1] : "";
  }

  function excelCell(value) {
    const text = String(value ?? "").replace(/\r?\n/g, " ").replaceAll('"', '""');
    return `"${text}"`;
  }

  function downloadExcelCsv(rows, filename) {
    const columns = [
      ["Solicitud", "numero_solicitud"],
      ["Tipo", (row) => typeLabel(row)],
      ["Fecha de registro", "fecha_registro"],
      ["Fecha presentación UHD", (row) => presentationDate(row)],
      ["Estado", "estado"],
      ["Prioridad", "prioridad"],
      ["Paciente", "paciente"],
      ["RUN", "run"],
      ["Teléfono", "telefono"],
      ["Dirección / ubicación", "ubicacion"],
      ["Especialidad / prestación", "flujo"],
      ["Resumen clínico", "resumen_clinico"],
      ["Gestión solicitada / necesidad UHD", "gestion_solicitada"],
      ["Médico solicitante", "medico_solicitante"],
      ["Responsable", "responsable"],
      ["Próximo paso", "proximo_paso"],
      ["Fecha resolución", "fecha_resolucion"],
      ["Resultado", "resuelto"],
      ["Observaciones", "observaciones"],
      ["Última actualización", "actualizado"]
    ];
    const lines = [
      "sep=;",
      columns.map(([label]) => excelCell(label)).join(";"),
      ...rows.map((row) => columns.map(([, key]) => excelCell(typeof key === "function" ? key(row) : row[key])).join(";"))
    ];
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function selectedType() {
    const legacy = sessionStorage.getItem(LEGACY_FILTER_KEY);
    if (legacy === "uhd-today" || legacy === "uhd-all") {
      sessionStorage.setItem(TYPE_KEY, "uhd");
      sessionStorage.setItem(UHD_SCOPE_KEY, legacy === "uhd-all" ? "all" : "today");
      return "uhd";
    }
    const stored = sessionStorage.getItem(TYPE_KEY);
    return ["ambulatoria", "uhd", "todos"].includes(stored) ? stored : "ambulatoria";
  }

  function selectedUhdScope() {
    return sessionStorage.getItem(UHD_SCOPE_KEY) === "all" ? "all" : "today";
  }

  function isUhdForToday(row) {
    return presentationDate(row) === today();
  }

  function syncFollowUpRequirements(form, autoFillDate = false) {
    const state = String(form.querySelector('[name="estado"]')?.value || "");
    const result = form.querySelector('[name="resuelto"]');
    const resolutionDate = form.querySelector('[name="fecha_resolucion"]');
    const nextStep = form.querySelector('[name="proximo_paso"]');
    const isFinal = state === "Gestionada" || state === "Cerrada";

    if (result) {
      result.required = isFinal;
      const value = String(result.value || "").trim();
      result.setCustomValidity(isFinal && (!value || clean(value) === "pendiente")
        ? "Registra el resultado antes de marcarla como gestionada o cerrada."
        : "");
    }
    if (resolutionDate) {
      resolutionDate.required = isFinal;
      if (isFinal && autoFillDate && !resolutionDate.value) resolutionDate.value = today();
    }
    if (state === "Cerrada" && nextStep) {
      const current = clean(nextStep.value);
      if (!current || current === "pendiente de revision por jefatura") nextStep.value = "Sin acciones pendientes";
    }
  }

  function updateForm(row) {
    const resultValue = clean(row.resuelto) === "pendiente" ? "" : row.resuelto;
    return `<form class="case-update-form patient-editor-form" data-patient-case-update="${esc(row.id)}">
      <div class="patient-editor-head"><strong>${esc(row.numero_solicitud || row.id)}</strong><button type="button" class="patient-editor-close" data-close-case-editor="${esc(row.id)}">Cerrar</button></div>
      <label>Estado<select name="estado"><option ${row.estado === "Pendiente" ? "selected" : ""}>Pendiente</option><option ${row.estado === "En gestión" ? "selected" : ""}>En gestión</option><option ${row.estado === "Gestionada" ? "selected" : ""}>Gestionada</option><option ${row.estado === "Cerrada" ? "selected" : ""}>Cerrada</option><option ${row.estado === "Cancelada" ? "selected" : ""}>Cancelada</option></select></label>
      <label>Resultado de la gestión<textarea name="resuelto" placeholder="Ej: hora asignada, examen coordinado o gestión no concretada">${esc(resultValue)}</textarea></label>
      <label>Próximo paso<textarea name="proximo_paso">${esc(row.proximo_paso)}</textarea></label>
      <label>Responsable<input name="responsable" value="${esc(row.responsable)}"></label>
      <label>Fecha resolución<input name="fecha_resolucion" type="date" value="${esc(String(row.fecha_resolucion || "").slice(0, 10))}"></label>
      <label>Observaciones<textarea name="observaciones" placeholder="Información adicional, dificultades o acuerdos relevantes">${esc(row.observaciones)}</textarea></label>
      <button class="document-button" type="submit">Guardar seguimiento</button>
      <div class="priority-status" data-case-save-status aria-live="polite"></div>
    </form>`;
  }

  function rowHtml(row) {
    const uhd = caseType(row) === "uhd";
    const requested = uhd ? row.resumen_clinico : row.gestion_solicitada;
    const detail = uhd
      ? `${presentationDate(row) ? `Presentación: ${presentationDate(row)} · ` : ""}${row.ubicacion || ""}`
      : `${row.flujo || ""}${row.telefono ? ` · ${row.telefono}` : ""}`;
    return `<tr data-patient-row="${esc(row.id)}">
      <td><strong>${esc(row.numero_solicitud || row.id)}</strong><br><span class="patient-type-badge ${uhd ? "uhd" : "ambulatoria"}">${uhd ? "UHD" : "Ambulatoria"}</span><br><span class="patient-small">${esc(String(row.fecha_registro).slice(0, 10))}</span></td>
      <td><strong>${esc(row.paciente)}</strong><br>${esc(row.run)}<br><span class="patient-small">${esc(row.medico_solicitante || row.registrado_por)}</span></td>
      <td><strong>${esc(requested)}</strong><br><span class="patient-small">${esc(detail)}</span></td>
      <td><span class="patient-status ${statusClass(row.estado)}">${esc(row.estado)}</span><br><span class="patient-small">${esc(row.responsable)}</span></td>
      <td>${esc(row.proximo_paso)}${row.fecha_resolucion ? `<br><span class="patient-small">Resolución: ${esc(String(row.fecha_resolucion).slice(0, 10))}</span>` : ""}</td>
      <td><div class="patient-row-action" data-case-editor="${esc(row.id)}"><button class="document-button patient-open-editor" type="button" data-open-case-editor="${esc(row.id)}">Gestionar</button></div></td>
    </tr>`;
  }

  function countByType(rows, type) {
    return rows.filter((row) => caseType(row) === type).length;
  }

  function tableHtml(rows) {
    const total = rows.length;
    const pending = rows.filter((row) => !["Gestionada", "Cerrada", "Cancelada"].includes(row.estado)).length;
    const resolved = rows.filter((row) => ["Gestionada", "Cerrada"].includes(row.estado)).length;
    const shown = rows.slice(0, displayLimit);
    const body = shown.length
      ? shown.map(rowHtml).join("")
      : `<tr><td colspan="6">No hay solicitudes en esta sección.</td></tr>`;
    const more = rows.length > shown.length
      ? `<div class="patient-more"><button class="document-button" type="button" data-show-more-cases>Mostrar ${Math.min(PAGE_SIZE, rows.length - shown.length)} más</button><span>${shown.length} de ${rows.length}</span></div>`
      : "";
    return `<section class="patient-grid patient-kpis"><article class="patient-card"><strong>Total en la vista</strong><span class="patient-kpi">${total}</span></article><article class="patient-card"><strong>Pendientes/en gestión</strong><span class="patient-kpi">${pending}</span></article><article class="patient-card"><strong>Gestionadas/cerradas</strong><span class="patient-kpi">${resolved}</span></article></section><section class="patient-table-wrap"><table class="patient-table"><thead><tr><th>Solicitud</th><th>Paciente</th><th>Necesidad</th><th>Estado</th><th>Próximo paso</th><th>Acción</th></tr></thead><tbody>${body}</tbody></table></section>${more}`;
  }

  function filterRows() {
    const query = clean($("[data-patient-filter='query']")?.value || "");
    const status = $("[data-patient-filter='estado']")?.value || "todos";
    const period = $("[data-patient-filter='periodo']")?.value || "todos";
    const type = selectedType();
    const uhdScope = selectedUhdScope();

    return visibleRows.filter((row) => {
      const rowType = caseType(row);
      const haystack = clean([
        row.numero_solicitud, row.paciente, row.run, row.telefono, row.ubicacion,
        row.flujo, row.medico_solicitante, row.rut_medico, row.motivo,
        row.resumen_clinico, row.gestion_solicitada, row.estado, row.proximo_paso,
        row.responsable, row.observaciones, row.resuelto
      ].join(" "));
      const typeMatch = type === "todos" || rowType === type;
      const uhdDateMatch = type !== "uhd" || uhdScope === "all" || isUhdForToday(row);
      return typeMatch && uhdDateMatch && (!query || haystack.includes(query)) &&
        (status === "todos" || row.estado === status) && dateInRange(row.fecha_registro, period);
    });
  }

  function updateTypeButtons() {
    const current = selectedType();
    $$('[data-patient-type]').forEach((button) => button.classList.toggle("active", button.dataset.patientType === current));
    const scope = $("[data-uhd-scope-panel]");
    if (scope) scope.hidden = current !== "uhd";
    $$('[data-uhd-scope]').forEach((button) => button.classList.toggle("active", button.dataset.uhdScope === selectedUhdScope()));
  }

  function applyFilters(resetLimit = false) {
    if (resetLimit) displayLimit = PAGE_SIZE;
    lastFilteredRows = filterRows();
    const mount = $("#patientCasesTable");
    if (mount) mount.innerHTML = tableHtml(lastFilteredRows);
    updateTypeButtons();
  }

  function routeActions() {
    return `<div class="route-actions"><a class="back-link" href="#/gestion">Volver a Gestión</a><a class="back-link" href="#/inicio">Inicio</a></div>`;
  }

  function hero(title, text) {
    return `<section class="patient-hero"><h2>${esc(title)}</h2><p>${esc(text)}</p></section>`;
  }

  function publicFormHtml() {
    return `<section class="patient-card"><h3>Solicitar gestión ambulatoria</h3><p class="patient-note">Para pacientes que pueden egresar desde Urgencia, pero requieren una coordinación ambulatoria prioritaria para un alta segura.</p><p class="patient-note"><strong>Identificación del médico:</strong> ingresa tu nombre y RUT. La primera solicitud registra automáticamente al médico.</p><form class="case-update-form" data-public-patient-case><label>Paciente<input name="paciente" required autocomplete="off"></label><label>RUN del paciente<input name="run" required autocomplete="off" placeholder="12.345.678-9"></label><label>Teléfono<input name="telefono" type="tel" autocomplete="off"></label><label>Ubicación actual<input name="ubicacion" value="Urgencia Adulto" required></label><label>Especialidad requerida<select name="especialidad" required><option value="">Seleccionar</option><option>Cardiología</option><option>Nefrología</option><option>Gastroenterología</option><option>Neurología</option><option>Endocrinología</option><option>Hematología</option><option>Reumatología</option><option>Broncopulmonar</option><option>Cirugía</option><option>Traumatología</option><option>Urología</option><option>Otra</option></select></label><label>Prioridad<select name="prioridad" required><option>Media</option><option selected>Alta</option><option>Crítica</option></select></label><label>Resumen clínico<textarea name="resumen_clinico" required></textarea></label><label>Gestión solicitada<textarea name="gestion_solicitada" required placeholder="Ej: hora prioritaria con Cardiología dentro de 7 días"></textarea></label><label>Médico solicitante<input name="medico_solicitante" required autocomplete="name"></label><label>RUT del médico<input name="rut_medico" required autocomplete="off" placeholder="12.345.678-9"></label><button class="document-button" type="submit">Solicitar gestión</button><div class="priority-status" data-public-patient-status aria-live="polite"></div></form></section>`;
  }

  function reviewHeaderHtml(result) {
    const ambulatory = countByType(visibleRows, "ambulatoria");
    const uhd = countByType(visibleRows, "uhd");
    return `<section class="patient-card patient-review-toolbar"><div><h3>Seguimiento de solicitudes</h3><p class="patient-small">Elige el tipo de paciente antes de revisar. Se muestran solo 20 registros por vez para mantener el panel rápido.</p></div><div class="patient-type-tabs" role="tablist" aria-label="Tipo de solicitud"><button type="button" class="patient-type-button" data-patient-type="ambulatoria">Gestión ambulatoria <span>${ambulatory}</span></button><button type="button" class="patient-type-button" data-patient-type="uhd">Citados UHD <span>${uhd}</span></button><button type="button" class="patient-type-button secondary" data-patient-type="todos">Todos <span>${visibleRows.length}</span></button></div><div class="patient-uhd-scope" data-uhd-scope-panel hidden><span>Citados UHD:</span><button type="button" data-uhd-scope="today">Para hoy</button><button type="button" data-uhd-scope="all">Todos</button></div><div class="patient-filter"><label>Buscar<input data-patient-filter="query" type="search" placeholder="Solicitud, RUN, paciente, especialidad, médico..."></label><label>Estado<select data-patient-filter="estado"><option value="todos">Todos</option><option>Pendiente</option><option>En gestión</option><option>Gestionada</option><option>Cerrada</option><option>Cancelada</option></select></label><label>Periodo de registro<select data-patient-filter="periodo"><option value="todos">Todos</option><option value="dia">Hoy</option><option value="semana">Últimos 7 días</option><option value="mes">Mes actual</option></select></label></div><div class="patient-actions"><button class="document-button" type="button" data-export-current-cases>Descargar vista para Excel</button>${result.spreadsheetUrl ? `<a class="document-button secondary" href="${esc(result.spreadsheetUrl)}" target="_blank" rel="noopener">Abrir Google Sheets</a>` : ""}<button class="document-button secondary" type="button" data-refresh-patient-cases>Actualizar</button></div><div class="priority-status" data-review-status aria-live="polite"></div></section>`;
  }

  function requestedMode() {
    const value = sessionStorage.getItem(MODE_KEY);
    if (value === "nuevo" || value === "revision") return value;
    return isChief() ? "revision" : "nuevo";
  }

  function notifyReady(mode) {
    window.dispatchEvent(new CustomEvent("crs:ui-section-ready", { detail: { route: "#/gestion/pacientes", mode } }));
  }

  async function renderPage(options = {}) {
    if (currentRoute() !== "#/gestion/pacientes") return;
    const version = ++renderVersion;

    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (title) title.textContent = "Gestión ambulatoria prioritaria";
    if (!content) return;

    const modeHint = sessionStorage.getItem(MODE_KEY) || "revision";
    content.innerHTML = `<div class="patient-shell">${routeActions()}${hero(modeHint === "nuevo" ? "Registrar caso nuevo" : "Revisión de solicitudes", modeHint === "nuevo" ? "Formulario rápido para crear una solicitud." : "Preparando el panel de seguimiento...")}<section class="patient-card patient-loading"><strong>Cargando…</strong><span>Validando la sesión.</span></section></div>`;

    await refreshAuth(Boolean(options.forceAuth));
    if (version !== renderVersion || currentRoute() !== "#/gestion/pacientes") return;

    const mode = requestedMode();
    if (mode === "nuevo" || !isChief()) {
      content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Registrar caso nuevo", "Formulario rápido para crear una solicitud de gestión ambulatoria prioritaria.")}${publicFormHtml()}</div>`;
      notifyReady("nuevo");
      return;
    }

    content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Revisión de solicitudes", "Seguimiento separado de gestión ambulatoria y pacientes citados para UHD.")}<section class="patient-card patient-loading"><strong>Cargando solicitudes…</strong><span>La primera carga puede tardar unos segundos; luego queda en memoria por 45 segundos.</span></section></div>`;

    const result = await listCases({ force: Boolean(options.force) });
    if (version !== renderVersion || currentRoute() !== "#/gestion/pacientes") return;

    if (result.source !== "drive") {
      visibleRows = [];
      content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Revisión de solicitudes", "No fue posible cargar el seguimiento.")}<div class="patient-warn">${esc(result.error || "Reintenta cuando haya conexión.")}</div><div class="patient-actions"><button class="document-button" data-refresh-patient-cases>Reintentar</button></div></div>`;
      notifyReady("error");
      return;
    }

    displayLimit = PAGE_SIZE;
    content.innerHTML = `<div class="patient-shell">${routeActions()}${hero("Revisión de solicitudes", "Gestión ambulatoria y citaciones UHD organizadas en vistas separadas.")}${reviewHeaderHtml(result)}<div class="patient-note"><strong>Estados:</strong> Gestionada = coordinación realizada. Cerrada = no quedan acciones administrativas y el resultado final está documentado.</div><div id="patientCasesTable"></div></div>`;
    applyFilters(true);
    notifyReady("revision");
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
      tipo_solicitud: "Gestión ambulatoria",
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
    const required = [item.paciente, item.run, item.ubicacion, item.flujo, item.resumen_clinico, item.gestion_solicitada, item.medico_solicitante, item.rut_medico];
    if (required.some((value) => !value)) {
      if (status) status.textContent = "Completa todos los campos obligatorios.";
      if (button) button.disabled = false;
      return;
    }

    const result = await savePublicCase(item, doctorRut);
    if (result.ok) {
      const number = result.case?.numero_solicitud || result.numero_solicitud || result.caseNumber || "registrada";
      if (status) status.textContent = `Solicitud ${number} creada correctamente.`;
      form.reset();
      const locationInput = $("[name='ubicacion']", form);
      const doctorNameInput = $("[name='medico_solicitante']", form);
      const doctorRutInput = $("[name='rut_medico']", form);
      if (locationInput) locationInput.value = "Urgencia Adulto";
      if (doctorNameInput) doctorNameInput.value = result.doctor?.nombre || doctorName;
      if (doctorRutInput) doctorRutInput.value = result.doctor?.rut_medico || normalizeRut(doctorRut);
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
    if (status) status.textContent = result.ok ? "Solicitud enviada correctamente." : `No se pudo enviar. ${result.error || "Reintenta."}`;
    if (result?.ok) {
      form.reset();
      form.hidden = true;
    }
  }, true);

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-patient-case-update]");
    if (!form) return;
    event.preventDefault();
    syncFollowUpRequirements(form, true);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const button = $("button[type='submit']", form);
    const status = $("[data-case-save-status]", form);
    if (button) button.disabled = true;
    if (status) status.textContent = "Guardando...";
    const result = await updateCase(form.dataset.patientCaseUpdate, Object.fromEntries(new FormData(form).entries()));
    if (!result.ok) {
      if (status) status.textContent = `No se pudo guardar: ${result.error || "error desconocido"}`;
      if (button) button.disabled = false;
      return;
    }
    applyFilters(false);
    const reviewStatus = $("[data-review-status]");
    if (reviewStatus) reviewStatus.textContent = "Seguimiento guardado correctamente.";
  });

  document.addEventListener("change", (event) => {
    const form = event.target.closest?.("[data-patient-case-update]");
    if (form) syncFollowUpRequirements(form, event.target.matches('[name="estado"]'));
    if (event.target.closest?.("[data-patient-filter]")) applyFilters(true);
  }, true);

  document.addEventListener("input", (event) => {
    const form = event.target.closest?.("[data-patient-case-update]");
    if (form && event.target.matches('[name="resuelto"]')) syncFollowUpRequirements(form, false);
    if (!event.target.closest?.("[data-patient-filter]")) return;
    window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(() => applyFilters(true), 100);
  }, true);

  document.addEventListener("click", async (event) => {
    const typeButton = event.target.closest?.("[data-patient-type]");
    if (typeButton) {
      sessionStorage.setItem(TYPE_KEY, typeButton.dataset.patientType || "ambulatoria");
      sessionStorage.removeItem(LEGACY_FILTER_KEY);
      applyFilters(true);
      return;
    }

    const scopeButton = event.target.closest?.("[data-uhd-scope]");
    if (scopeButton) {
      sessionStorage.setItem(UHD_SCOPE_KEY, scopeButton.dataset.uhdScope === "all" ? "all" : "today");
      applyFilters(true);
      return;
    }

    const open = event.target.closest?.("[data-open-case-editor]");
    if (open) {
      const id = String(open.dataset.openCaseEditor || "");
      const row = visibleRows.find((item) => String(item.id) === id);
      const safeId = window.CSS?.escape ? CSS.escape(id) : id.replaceAll('"', '\\"');
      const mount = document.querySelector(`[data-case-editor="${safeId}"]`);
      if (row && mount) {
        document.querySelectorAll("[data-case-editor] .patient-editor-form").forEach((node) => {
          const parent = node.closest("[data-case-editor]");
          if (parent && parent !== mount) parent.innerHTML = `<button class="document-button patient-open-editor" type="button" data-open-case-editor="${esc(parent.dataset.caseEditor)}">Gestionar</button>`;
        });
        mount.innerHTML = updateForm(row);
        const form = $("form", mount);
        if (form) syncFollowUpRequirements(form, false);
      }
      return;
    }

    const close = event.target.closest?.("[data-close-case-editor]");
    if (close) {
      const id = String(close.dataset.closeCaseEditor || "");
      const safeId = window.CSS?.escape ? CSS.escape(id) : id.replaceAll('"', '\\"');
      const mount = document.querySelector(`[data-case-editor="${safeId}"]`);
      if (mount) mount.innerHTML = `<button class="document-button patient-open-editor" type="button" data-open-case-editor="${esc(id)}">Gestionar</button>`;
      return;
    }

    if (event.target.closest?.("[data-show-more-cases]")) {
      displayLimit += PAGE_SIZE;
      const mount = $("#patientCasesTable");
      if (mount) mount.innerHTML = tableHtml(lastFilteredRows);
      return;
    }

    if (event.target.closest?.("[data-export-current-cases]")) {
      const type = selectedType();
      downloadExcelCsv(lastFilteredRows, `seguimiento-${type}-${today()}.csv`);
      return;
    }

    if (event.target.closest?.("[data-refresh-patient-cases]")) {
      const status = $("[data-review-status]");
      if (status) status.textContent = "Actualizando solicitudes...";
      await renderPage({ force: true });
      return;
    }

    const modeLink = event.target.closest?.("[data-gestion-cases-mode]");
    if (modeLink && !modeLink.hasAttribute("data-gestion-uhd-review")) {
      sessionStorage.setItem(TYPE_KEY, "ambulatoria");
      sessionStorage.setItem(UHD_SCOPE_KEY, "today");
      sessionStorage.removeItem(LEGACY_FILTER_KEY);
    }
  }, true);

  function route() {
    if (currentRoute() === "#/gestion/pacientes") renderPage().catch(console.error);
    else renderVersion += 1;
  }

  purgeLegacyPatientStorage();
  window.addEventListener("hashchange", route);
  window.addEventListener("crs:supabase-ready", route);
  window.addEventListener("crs:auth-changed", () => {
    resetAuth();
    casesFetchedAt = 0;
    route();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route, { once: true });
  else route();

  window.CRS_PATIENT_CASES = {
    isChief,
    refreshAuth,
    fromFlow,
    saveCase,
    savePublicCase,
    saveFromPriorityForm,
    listCases,
    renderPage,
    setReviewType(type, scope = "today") {
      sessionStorage.setItem(TYPE_KEY, ["ambulatoria", "uhd", "todos"].includes(type) ? type : "ambulatoria");
      sessionStorage.setItem(UHD_SCOPE_KEY, scope === "all" ? "all" : "today");
      if (currentRoute() === "#/gestion/pacientes" && $("#patientCasesTable")) applyFilters(true);
    }
  };
})();