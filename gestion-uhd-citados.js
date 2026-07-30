(() => {
  const UHD_ROUTE = "#/gestion/uhd-citados";
  const CASES_ROUTE = "#/gestion/pacientes";
  const MODE_KEY = "crsGestionCasesModeV1";
  const FILTER_KEY = "crsGestionCasesFilterV1";
  const DOCTOR_KEY = "crsGestionDoctorShiftV1";
  const ALLOWED_COMMUNES = new Set(["San Ramón", "La Pintana", "La Granja"]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let timer = 0;

  function route() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function localISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function tomorrowISO() {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    return localISO(date);
  }

  function formatDate(iso) {
    const [year, month, day] = String(iso || "").split("-");
    return year && month && day ? `${day}/${month}/${year}` : iso;
  }

  function activateManagementPage() {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === "managementPage"));
    $$('[data-route-link]').forEach((link) => {
      link.classList.toggle("active", link.dataset.routeLink === "gestion");
    });
  }

  function storedDoctor() {
    try {
      const value = JSON.parse(sessionStorage.getItem(DOCTOR_KEY) || "null");
      return value?.name && value?.rut ? value : null;
    } catch (_) {
      return null;
    }
  }

  function saveDoctor(name, rut) {
    sessionStorage.setItem(DOCTOR_KEY, JSON.stringify({ name, rut }));
  }

  function formHtml() {
    const doctor = storedDoctor();
    const date = tomorrowISO();
    return `
      <div class="uhd-shell">
        <div class="uhd-topbar">
          <a class="back-link" href="#/gestion">Gestión de casos</a>
          <span class="uhd-form-kicker">UHD · citación para el día siguiente</span>
        </div>
        <section class="uhd-hero">
          <h2>Registrar paciente citado para UHD</h2>
          <p>Deja el registro antes de terminar el turno para que el equipo de la mañana sepa qué pacientes fueron citados.</p>
        </section>
        <section class="uhd-eligibility">
          <strong>Cobertura obligatoria</strong>
          <span>Solo pueden presentarse pacientes que vivan en San Ramón, La Pintana o La Granja.</span>
        </section>
        <form class="uhd-form-card" data-uhd-citation-form>
          <div>
            <h3>Datos del paciente</h3>
            <p>Formulario breve. La fecha de presentación se calcula automáticamente para mañana.</p>
          </div>
          <div class="uhd-presentation">
            <span>Presentación prevista</span>
            <strong>${formatDate(date)}</strong>
            <input type="hidden" name="presentationDate" value="${date}">
          </div>
          <div class="uhd-form-grid">
            <label>Nombre del paciente<input name="patientName" required autocomplete="off"></label>
            <label>RUN<input name="patientRut" required autocomplete="off" placeholder="12.345.678-9"></label>
            <label class="full">Dirección<input name="address" required autocomplete="off" placeholder="Calle, número, villa o población"></label>
            <label>Comuna<select name="commune" required><option value="">Seleccionar</option><option>San Ramón</option><option>La Pintana</option><option>La Granja</option></select></label>
            <label class="full">¿Qué necesita el paciente de UHD?<textarea name="need" required placeholder="Ej: antibiótico EV, curaciones, control clínico, oxigenoterapia..."></textarea></label>
          </div>
          <details class="uhd-doctor-details" ${doctor ? "" : "open"}>
            <summary>${doctor ? `Médico solicitante: ${esc(doctor.name)} · cambiar` : "Identificación del médico solicitante"}</summary>
            <div class="uhd-doctor-fields">
              <label>Nombre<input name="doctorName" required autocomplete="name" value="${esc(doctor?.name || "")}"></label>
              <label>RUT<input name="doctorRut" required autocomplete="off" value="${esc(doctor?.rut || "")}" placeholder="12.345.678-9"></label>
            </div>
          </details>
          <div class="uhd-actions">
            <button class="gestion-profile-button" type="submit">Guardar citación UHD</button>
            <a class="gestion-profile-button secondary" href="#/gestion">Cancelar</a>
          </div>
          <div class="uhd-status" data-uhd-status aria-live="polite"></div>
        </form>
      </div>`;
  }

  function renderForm() {
    if (route() !== UHD_ROUTE) return;
    activateManagementPage();
    const title = $("#managementTitle");
    const content = $("#managementContent");
    if (!content) return;
    const date = tomorrowISO();
    if (title) title.textContent = "Citación para UHD";
    if (content.dataset.uhdFormReady === date && content.querySelector("[data-uhd-citation-form]")) return;
    content.innerHTML = formHtml();
    content.dataset.uhdFormReady = date;
  }

  function setStatus(form, text, error = false) {
    const status = $("[data-uhd-status]", form);
    if (!status) return;
    status.classList.toggle("error", error);
    status.innerHTML = text;
  }

  async function submitCitation(form) {
    const api = window.CRS_PATIENT_CASES;
    if (!api?.savePublicCase) throw new Error("El servicio de Gestión todavía no está disponible.");

    const data = new FormData(form);
    const patientName = String(data.get("patientName") || "").trim();
    const patientRut = String(data.get("patientRut") || "").trim();
    const address = String(data.get("address") || "").trim();
    const commune = String(data.get("commune") || "").trim();
    const need = String(data.get("need") || "").trim();
    const doctorName = String(data.get("doctorName") || "").trim();
    const doctorRut = String(data.get("doctorRut") || "").trim();
    const presentationDate = String(data.get("presentationDate") || tomorrowISO()).trim();

    if (!ALLOWED_COMMUNES.has(commune)) {
      throw new Error("UHD solo recibe pacientes de San Ramón, La Pintana y La Granja.");
    }

    const item = {
      paciente: patientName,
      run: patientRut,
      ubicacion: `${address}, ${commune}`,
      flujo: "UHD - Citado para evaluación",
      motivo: "Paciente dado de alta y citado para presentar a UHD al día siguiente",
      resumen_clinico: need,
      gestion_solicitada: `Fecha de presentación UHD: ${presentationDate}. Necesidad: ${need}`,
      prioridad: "Alta",
      origen: "MASTER Urgencias HPH - Citación UHD",
      estado: "Pendiente",
      resuelto: "Pendiente",
      proximo_paso: `Paciente citado para presentarse a UHD el ${presentationDate}`,
      responsable: "UHD / turno entrante",
      fecha_compromiso: presentationDate,
      medico_solicitante: doctorName,
      rut_medico: doctorRut,
      registrado_por: doctorName
    };

    const result = await api.savePublicCase(item, doctorRut, "");
    if (result?.ok) saveDoctor(doctorName, doctorRut);
    return result;
  }

  function reviewSearchValue(mode) {
    return mode === "all"
      ? "UHD - Citado para evaluación"
      : `Fecha de presentación UHD: ${localISO(new Date())}`;
  }

  function addReviewNote(query, mode) {
    const mount = $("#patientCasesTable");
    if (!mount) return;
    let note = $("[data-uhd-review-note]");
    if (!note) {
      note = document.createElement("div");
      note.className = "uhd-review-note";
      note.dataset.uhdReviewNote = "true";
      mount.before(note);
    }
    if (note.dataset.uhdMode !== mode) {
      note.dataset.uhdMode = mode;
      note.innerHTML = `
        <strong>${mode === "all" ? "Todos los pacientes citados para UHD" : `Pacientes citados para hoy · ${formatDate(localISO(new Date()))}`}</strong>
        <span>La lista se obtiene del registro compartido de Gestión.</span>
        <div class="gestion-profile-actions">
          <button class="gestion-profile-button" type="button" data-uhd-filter="today">Hoy</button>
          <button class="gestion-profile-button secondary" type="button" data-uhd-filter="all">Todos UHD</button>
        </div>`;
    }
    const target = reviewSearchValue(mode);
    if (query.value !== target) {
      query.value = target;
      query.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function applyReviewFilter() {
    if (route() !== CASES_ROUTE) return;
    const mode = sessionStorage.getItem(FILTER_KEY);
    const note = $("[data-uhd-review-note]");
    if (mode !== "uhd-today" && mode !== "uhd-all") {
      note?.remove();
      return;
    }
    const query = $("[data-patient-filter='query']");
    if (!query || !$("#patientCasesTable")) return;
    const filterMode = mode === "uhd-all" ? "all" : "today";
    addReviewNote(query, filterMode);
    const hero = $("#managementContent .patient-hero");
    const modeTitle = $("#managementContent .gestion-case-modebar strong");
    if (hero) {
      const heading = $("h2", hero);
      const text = $("p", hero);
      if (heading) heading.textContent = "Citaciones UHD";
      if (text) text.textContent = "Pacientes dados de alta y citados para presentarse a evaluación por UHD.";
    }
    if (modeTitle) modeTitle.textContent = "Citaciones UHD";
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-uhd-citation-form]");
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = $("button[type='submit']", form);
    if (button) button.disabled = true;
    setStatus(form, "Guardando citación...");
    try {
      const result = await submitCitation(form);
      if (!result?.ok) throw new Error(result?.error || "No se pudo registrar la citación.");
      const number = result.case?.numero_solicitud || result.numero_solicitud || "registrada";
      const date = String(new FormData(form).get("presentationDate") || tomorrowISO());
      setStatus(form, `<div class="uhd-confirmation"><strong>Citación ${esc(number)} guardada correctamente.</strong><span>Paciente esperado para UHD el ${formatDate(date)}.</span></div>`);
      const doctor = storedDoctor();
      form.reset();
      const hiddenDate = $("[name='presentationDate']", form);
      const doctorName = $("[name='doctorName']", form);
      const doctorRut = $("[name='doctorRut']", form);
      if (hiddenDate) hiddenDate.value = tomorrowISO();
      if (doctorName) doctorName.value = doctor?.name || "";
      if (doctorRut) doctorRut.value = doctor?.rut || "";
    } catch (error) {
      setStatus(form, esc(error?.message || error || "No se pudo registrar la citación."), true);
    } finally {
      if (button) button.disabled = false;
    }
  }, true);

  document.addEventListener("click", (event) => {
    const review = event.target.closest?.("[data-gestion-uhd-review]");
    const filter = event.target.closest?.("[data-uhd-filter]");
    if (review) {
      sessionStorage.setItem(MODE_KEY, "revision");
      sessionStorage.setItem(FILTER_KEY, review.dataset.gestionUhdReview === "all" ? "uhd-all" : "uhd-today");
    }
    if (filter) {
      sessionStorage.setItem(FILTER_KEY, filter.dataset.uhdFilter === "all" ? "uhd-all" : "uhd-today");
      applyReviewFilter();
    }
  }, true);

  function renderCurrentRoute() {
    if (route() === UHD_ROUTE) renderForm();
    if (route() === CASES_ROUTE) applyReviewFilter();
  }

  function schedule(delay = 30) {
    window.clearTimeout(timer);
    timer = window.setTimeout(renderCurrentRoute, delay);
  }

  const observer = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) return;
    if (route() === UHD_ROUTE || route() === CASES_ROUTE) schedule(40);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    schedule(10);
  }

  window.addEventListener("hashchange", () => schedule(20));
  window.addEventListener("crs:supabase-ready", () => schedule(40));
  window.addEventListener("crs:auth-changed", () => schedule(40));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();