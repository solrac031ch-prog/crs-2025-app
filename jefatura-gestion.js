(function () {
  const PIN_HASH_KEY = "crsHphChiefPinHash";
  const SESSION_KEY = "crsHphChiefUnlocked";
  const TEMPLATES_KEY = "crsHphChiefTemplates";
  const routes = {
    chief: "#/jefatura",
    doctors: "#/medicos"
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addStyles() {
    if ($("#jefatura-gestion-style")) return;
    const style = document.createElement("style");
    style.id = "jefatura-gestion-style";
    style.textContent = `
      .chief-shell{display:grid;gap:16px}.chief-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:18px clamp(16px,3vw,24px);color:#fff;background:linear-gradient(135deg,#111827,#0f766e);border-radius:14px;box-shadow:0 16px 36px rgba(16,18,20,.16);border-bottom:6px solid #2dd4bf}.chief-hero h2{margin:4px 0 6px;font-size:clamp(1.55rem,3vw,2.35rem);line-height:1.04}.chief-hero p{margin:0;color:#d8e9e4;line-height:1.45}.chief-badge{display:grid;place-items:center;min-width:86px;min-height:86px;padding:12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:18px;font-size:2.2rem}.chief-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.chief-card{display:grid;gap:10px;padding:16px;background:#fff;border:1px solid var(--line);border-left:6px solid var(--accent);border-radius:12px;box-shadow:var(--shadow)}.chief-card.amber{border-left-color:var(--amber)}.chief-card.blue{border-left-color:var(--blue)}.chief-card.danger{border-left-color:var(--danger)}.chief-card h3{margin:0;font-size:1.14rem;line-height:1.15}.chief-card p{margin:0;color:var(--muted);line-height:1.42}.chief-actions{display:flex;flex-wrap:wrap;gap:9px}.chief-button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;padding:0 13px;border:1px solid var(--line-strong);border-radius:8px;background:#fff;color:var(--ink);font-weight:850;cursor:pointer;text-align:center}.chief-button.primary{color:#fff;background:var(--accent-dark);border-color:var(--accent-dark)}.chief-button.blue{color:#fff;background:var(--blue);border-color:var(--blue)}.chief-button.danger{color:#fff;background:var(--danger);border-color:var(--danger)}.chief-button:disabled{opacity:.55;cursor:not-allowed}.chief-form{display:grid;gap:10px}.chief-form label{display:grid;gap:6px;color:var(--muted);font-size:.9rem;font-weight:850}.chief-form input,.chief-form textarea,.chief-form select{width:100%;min-height:42px;padding:9px 11px;border:1px solid var(--line-strong);border-radius:8px;background:#fbfcfc;color:var(--ink);outline:none}.chief-form input:focus,.chief-form textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.chief-note{padding:12px;border:1px solid #f4d28a;border-radius:10px;background:var(--amber-soft);color:#6f4200;font-weight:750;line-height:1.42}.chief-note strong{color:#4f2d00}.chief-muted{color:var(--muted);font-size:.9rem}.chief-table-wrap{overflow:auto;border:1px solid var(--line);border-radius:10px;background:#fff}.chief-table{width:100%;border-collapse:collapse;min-width:780px}.chief-table th,.chief-table td{padding:9px 10px;border-bottom:1px solid #edf0ed;text-align:left;vertical-align:top}.chief-table th{background:#f6f8f7;font-size:.78rem;text-transform:uppercase;color:#44504b}.chief-empty{padding:16px;color:var(--muted);background:#fff;border:1px dashed var(--line-strong);border-radius:10px}.chief-space-card{min-height:168px;align-content:start}.chief-space-card .space-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:var(--accent-soft);font-size:1.7rem}.chief-space-card strong{font-size:1.35rem;line-height:1.1}.chief-divider{height:1px;background:var(--line);margin:2px 0}.chief-kpi{display:flex;flex-wrap:wrap;gap:8px}.chief-kpi span{padding:6px 9px;border-radius:999px;background:#eef7f5;color:#0b4f49;font-weight:850;font-size:.82rem}.chief-link-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 10px;background:#fbfcfc;border:1px solid #e8ebe7;border-radius:8px}.chief-link-row span{overflow-wrap:anywhere}.chief-link-row a{color:var(--blue);font-weight:850}.chief-top-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.chief-status{min-height:22px;font-weight:800}.chief-status.ok{color:var(--accent-dark)}.chief-status.bad{color:var(--danger)}
      @media(max-width:680px){.chief-hero{grid-template-columns:1fr}.chief-badge{justify-self:start;min-width:64px;min-height:64px}.chief-link-row{grid-template-columns:1fr}.chief-top-actions{justify-content:flex-start}}
    `;
    document.head.append(style);
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function getTemplates() {
    try {
      return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveTemplates(values) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(values));
  }

  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  }

  function setUnlocked(value) {
    if (value) sessionStorage.setItem(SESSION_KEY, "true");
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function dateValue(item) {
    const candidates = [
      item.createdAt,
      item.created_at,
      item.fecha,
      item.date,
      item.savedAt,
      item.updatedAt,
      item.timestamp,
      item.time
    ];
    for (const value of candidates) {
      if (!value) continue;
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  }

  function textValue(item, keys) {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== "") return String(item[key]).trim();
    }
    return "";
  }

  function normalizeCase(item, sourceKey) {
    const date = dateValue(item);
    return {
      fecha: date ? date.toISOString().slice(0, 10) : "sin fecha",
      hora: date ? date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "",
      paciente: textValue(item, ["patientName", "nombre", "name", "patient", "paciente"]),
      run: textValue(item, ["patientRun", "run", "rut", "documento"]),
      telefono: textValue(item, ["phone", "telefono", "tel", "patientPhone"]),
      protocolo: textValue(item, ["protocolTitle", "protocol", "flow", "especialidad", "title"]),
      necesidad: textValue(item, ["need", "necesidad", "request", "motivo", "gestion"]),
      resumen: textValue(item, ["summary", "resumen", "detalle", "description", "comentario"]),
      estado: textValue(item, ["status", "estado"]),
      fuente: sourceKey,
      raw: item
    };
  }

  function extractArrays(value) {
    if (Array.isArray(value)) return [value];
    if (!value || typeof value !== "object") return [];
    const arrays = [];
    Object.values(value).forEach((entry) => {
      if (Array.isArray(entry)) arrays.push(entry);
    });
    return arrays;
  }

  function looksLikePriorityCase(item, key) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const keyHit = /gestion|gesti[oó]n|priority|prioritaria|prioritario|case|caso|management|hph|crs/i.test(key);
    const fields = Object.keys(item).join(" ");
    const fieldHit = /patient|paciente|nombre|run|rut|telefono|summary|resumen|necesidad|gestion|protocol|especialidad|createdAt|fecha/i.test(fields);
    return keyHit || fieldHit;
  }

  function collectCases() {
    const cases = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || key === PIN_HASH_KEY || key === TEMPLATES_KEY) continue;
      let parsed;
      try {
        parsed = JSON.parse(localStorage.getItem(key));
      } catch {
        continue;
      }
      extractArrays(parsed).forEach((array) => {
        array.forEach((item) => {
          if (looksLikePriorityCase(item, key)) cases.push(normalizeCase(item, key));
        });
      });
    }
    return cases.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.hora).localeCompare(String(a.hora)));
  }

  function rangeFor(type) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (type === "week") {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }
    if (type === "month") {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }

  function filterCases(cases, type) {
    if (type === "all") return cases;
    const { start, end } = rangeFor(type);
    return cases.filter((item) => {
      const date = item.fecha === "sin fecha" ? null : new Date(`${item.fecha}T12:00:00`);
      return date && date >= start && date <= end;
    });
  }

  function csvCell(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  function downloadFile(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv(type) {
    const rows = filterCases(collectCases(), type);
    const headers = ["Fecha", "Hora", "Paciente", "RUN", "Telefono", "Protocolo", "Necesidad", "Resumen", "Estado", "Fuente"];
    const body = rows.map((row) => [row.fecha, row.hora, row.paciente, row.run, row.telefono, row.protocolo, row.necesidad, row.resumen, row.estado, row.fuente].map(csvCell).join(";"));
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`gestion-prioritaria-${type}-${stamp}.csv`, "text/csv;charset=utf-8", `\uFEFF${headers.join(";")}\n${body.join("\n")}`);
  }

  function exportWord(type) {
    const rows = filterCases(collectCases(), type);
    const title = { day: "diario", week: "semanal", month: "mensual", all: "completo" }[type] || type;
    const body = rows.map((row, index) => `
      <tr>
        <td>${index + 1}</td><td>${escapeHtml(row.fecha)} ${escapeHtml(row.hora)}</td><td>${escapeHtml(row.paciente)}</td><td>${escapeHtml(row.run)}</td><td>${escapeHtml(row.telefono)}</td><td>${escapeHtml(row.protocolo)}</td><td>${escapeHtml(row.necesidad)}</td><td>${escapeHtml(row.resumen)}</td><td>${escapeHtml(row.estado)}</td>
      </tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Gestión prioritaria</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px;vertical-align:top}th{background:#eee}</style></head><body><h1>Gestión prioritaria ambulatoria - reporte ${escapeHtml(title)}</h1><p>Generado: ${new Date().toLocaleString("es-CL")}</p><table><thead><tr><th>#</th><th>Fecha</th><th>Paciente</th><th>RUN</th><th>Teléfono</th><th>Protocolo</th><th>Necesidad</th><th>Resumen</th><th>Estado</th></tr></thead><tbody>${body || "<tr><td colspan='9'>Sin casos para este período.</td></tr>"}</tbody></table></body></html>`;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`gestion-prioritaria-${type}-${stamp}.doc`, "application/msword;charset=utf-8", html);
  }

  function renderRows(cases) {
    if (!cases.length) return `<div class="chief-empty">No encontré casos de gestión prioritaria en este navegador. Cuando los médicos registren casos desde los flujos, aparecerán aquí si están en el mismo dispositivo/perfil.</div>`;
    return `<div class="chief-table-wrap"><table class="chief-table"><thead><tr><th>Fecha</th><th>Paciente</th><th>RUN</th><th>Teléfono</th><th>Flujo</th><th>Necesidad</th><th>Resumen</th></tr></thead><tbody>${cases.slice(0, 20).map((row) => `<tr><td>${escapeHtml(row.fecha)}<br><span class="chief-muted">${escapeHtml(row.hora)}</span></td><td>${escapeHtml(row.paciente)}</td><td>${escapeHtml(row.run)}</td><td>${escapeHtml(row.telefono)}</td><td>${escapeHtml(row.protocolo)}</td><td>${escapeHtml(row.necesidad)}</td><td>${escapeHtml(row.resumen)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function templateRow(label, value) {
    return `<div class="chief-link-row"><span><strong>${escapeHtml(label)}</strong><br><span class="chief-muted">${value ? escapeHtml(value) : "Sin enlace guardado"}</span></span>${value ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener">Abrir</a>` : ""}</div>`;
  }

  function renderChiefLocked() {
    const hasPin = Boolean(localStorage.getItem(PIN_HASH_KEY));
    return `
      <div class="chief-shell">
        <section class="chief-hero"><div><span class="eyebrow">🔐 Espacio restringido</span><h2>Jefatura SEA HPH</h2><p>Administración de planillas operativas y descarga de casos con gestión prioritaria ambulatoria.</p></div><div class="chief-badge">🔐</div></section>
        <section class="chief-card danger"><h3>${hasPin ? "Ingresar clave de jefatura" : "Crear clave local de jefatura"}</h3><p>${hasPin ? "Ingrese la clave configurada en este navegador." : "Primera configuración en este navegador. Esta clave no se sube a GitHub ni queda visible en el código."}</p><form id="chiefPinForm" class="chief-form"><label>Clave<input id="chiefPinInput" type="password" autocomplete="current-password" minlength="4" required /></label><button class="chief-button primary" type="submit">${hasPin ? "Entrar" : "Crear clave"}</button><div id="chiefPinStatus" class="chief-status"></div></form></section>
        <div class="chief-note"><strong>Importante:</strong> esta clave es una barrera visual local. Para bloquear de verdad el acceso se requiere Google Drive con permisos institucionales o backend con autenticación.</div>
      </div>`;
  }

  function renderChiefUnlocked() {
    const cases = collectCases();
    const templates = getTemplates();
    const dayCount = filterCases(cases, "day").length;
    const weekCount = filterCases(cases, "week").length;
    const monthCount = filterCases(cases, "month").length;
    return `
      <div class="chief-shell">
        <section class="chief-hero"><div><span class="eyebrow">👑 Jefatura</span><h2>Panel de gestión ambulatoria</h2><p>Planillas operativas, enlaces Drive y reportes de pacientes que requieren gestión prioritaria.</p></div><div class="chief-badge">👑</div></section>
        <div class="chief-top-actions"><button id="chiefLockBtn" class="chief-button">Cerrar espacio jefatura</button></div>
        <section class="chief-card blue"><h3>📊 Resumen rápido</h3><div class="chief-kpi"><span>Hoy: ${dayCount}</span><span>Semana: ${weekCount}</span><span>Mes: ${monthCount}</span><span>Total local: ${cases.length}</span></div><p>Los conteos se calculan desde los casos guardados localmente en este navegador.</p></section>
        <section class="chief-grid">
          <div class="chief-card"><h3>📁 Planillas de jefatura</h3><p>Guarda enlaces Drive para las planillas editables. El permiso real lo controla Google Drive.</p><form id="chiefTemplatesForm" class="chief-form"><label>Especialistas de llamado<input name="llamados" type="url" placeholder="https://docs.google.com/..." value="${escapeHtml(templates.llamados || "")}" /></label><label>UHD<input name="uhd" type="url" placeholder="https://docs.google.com/..." value="${escapeHtml(templates.uhd || "")}" /></label><label>Visita diaria<input name="visita" type="url" placeholder="https://docs.google.com/..." value="${escapeHtml(templates.visita || "")}" /></label><button class="chief-button primary" type="submit">Guardar enlaces</button><div id="chiefTemplatesStatus" class="chief-status"></div></form><div class="chief-divider"></div>${templateRow("Especialistas de llamado", templates.llamados)}${templateRow("UHD", templates.uhd)}${templateRow("Visita diaria", templates.visita)}</div>
          <div class="chief-card amber"><h3>⬇️ Descarga de gestión prioritaria</h3><p>Exporta CSV para Excel o reporte Word compatible.</p><div class="chief-actions"><button class="chief-button blue" data-export-csv="day">CSV diario</button><button class="chief-button blue" data-export-csv="week">CSV semanal</button><button class="chief-button blue" data-export-csv="month">CSV mensual</button><button class="chief-button" data-export-word="day">Word diario</button><button class="chief-button" data-export-word="week">Word semanal</button><button class="chief-button" data-export-word="month">Word mensual</button><button class="chief-button" data-export-csv="all">CSV total</button></div></div>
        </section>
        <section class="chief-card"><h3>📣 Últimos casos detectados</h3>${renderRows(cases)}</section>
        <div class="chief-note"><strong>Para que esto tome potencia real:</strong> el siguiente paso es que el formulario de caso prioritario guarde en una base central con login institucional. LocalStorage sirve para prototipo, pero no centraliza datos entre médicos.</div>
      </div>`;
  }

  function renderDoctorsPage() {
    return `
      <div class="chief-shell">
        <section class="chief-hero"><div><span class="eyebrow">🩺 Espacio médicos</span><h2>Uso clínico sin modificar planillas</h2><p>Acceso de lectura a flujos, formularios y enlaces ya compartidos. La edición queda en Drive según permisos de jefatura.</p></div><div class="chief-badge">🩺</div></section>
        <section class="chief-grid">
          <a class="chief-card chief-space-card" href="#/especialidades"><span class="space-icon">⚡</span><strong>Flujos y derivaciones</strong><p>Buscar especialidad, criterio, contacto o ruta clínica.</p></a>
          <a class="chief-card chief-space-card blue" href="#/llamados"><span class="space-icon">📞</span><strong>Especialistas y UHD</strong><p>Consulta operativa. Sin edición desde la app.</p></a>
          <a class="chief-card chief-space-card amber" href="#/visita"><span class="space-icon">📄</span><strong>Planilla de visita</strong><p>Solo podrán editar quienes tengan permiso directo en Google Drive.</p></a>
          <a class="chief-card chief-space-card" href="#/formularios"><span class="space-icon">📝</span><strong>Formularios de turno</strong><p>Acceso rápido a formularios operativos.</p></a>
        </section>
        <div class="chief-note"><strong>Regla:</strong> los médicos usan la app como lectura y registro operativo. Las planillas maestras se modifican solo desde Jefatura o desde Drive si ya existe permiso.</div>
      </div>`;
  }

  function renderGestionLanding() {
    const container = $("#managementContent");
    if (!container || container.dataset.twoSpacesRendered === "true") return;
    container.dataset.twoSpacesRendered = "true";
    container.innerHTML = `
      <div class="chief-shell">
        <section class="chief-hero"><div><span class="eyebrow">🚀 Gestión ambulatoria</span><h2>Dos espacios de trabajo</h2><p>Un espacio simple para médicos y un panel restringido para jefatura.</p></div><div class="chief-badge">🚀</div></section>
        <section class="chief-grid">
          <a class="chief-card chief-space-card" href="#/medicos"><span class="space-icon">🩺</span><strong>Médicos</strong><p>Lectura de flujos, formularios, llamados, visita y registro operativo sin modificar planillas maestras.</p></a>
          <a class="chief-card chief-space-card danger" href="#/jefatura"><span class="space-icon">👑</span><strong>Jefatura</strong><p>Clave local, enlaces de planillas y descarga diaria, semanal o mensual de casos prioritarios.</p></a>
        </section>
      </div>`;
  }

  function showPage(pageId) {
    document.querySelectorAll(".page").forEach((node) => node.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");
    document.querySelectorAll("[data-route-link]").forEach((link) => link.classList.remove("active"));
  }

  function renderRoute() {
    addStyles();
    const hash = window.location.hash || "#/inicio";
    if (hash.startsWith(routes.chief)) {
      showPage("chiefPage");
      const content = $("#chiefContent");
      if (content) content.innerHTML = isUnlocked() ? renderChiefUnlocked() : renderChiefLocked();
      return;
    }
    if (hash.startsWith(routes.doctors)) {
      showPage("doctorsPage");
      const content = $("#doctorsContent");
      if (content) content.innerHTML = renderDoctorsPage();
      return;
    }
    if (hash.startsWith("#/gestion")) {
      window.setTimeout(renderGestionLanding, 80);
      window.setTimeout(renderGestionLanding, 250);
    }
  }

  document.addEventListener("submit", async (event) => {
    if (event.target.id === "chiefPinForm") {
      event.preventDefault();
      const input = $("#chiefPinInput");
      const status = $("#chiefPinStatus");
      const pin = input?.value || "";
      if (pin.length < 4) {
        if (status) { status.textContent = "La clave debe tener al menos 4 caracteres."; status.className = "chief-status bad"; }
        return;
      }
      const hash = await sha256(pin);
      const saved = localStorage.getItem(PIN_HASH_KEY);
      if (!saved) {
        localStorage.setItem(PIN_HASH_KEY, hash);
        setUnlocked(true);
        renderRoute();
        return;
      }
      if (saved === hash) {
        setUnlocked(true);
        renderRoute();
      } else if (status) {
        status.textContent = "Clave incorrecta.";
        status.className = "chief-status bad";
      }
    }

    if (event.target.id === "chiefTemplatesForm") {
      event.preventDefault();
      const form = event.target;
      const values = {
        llamados: form.llamados.value.trim(),
        uhd: form.uhd.value.trim(),
        visita: form.visita.value.trim(),
        updatedAt: new Date().toISOString()
      };
      saveTemplates(values);
      const status = $("#chiefTemplatesStatus");
      if (status) { status.textContent = "Enlaces guardados en este navegador."; status.className = "chief-status ok"; }
      window.setTimeout(renderRoute, 300);
    }
  });

  document.addEventListener("click", (event) => {
    const lock = event.target.closest("#chiefLockBtn");
    if (lock) {
      setUnlocked(false);
      renderRoute();
      return;
    }
    const csv = event.target.closest("[data-export-csv]");
    if (csv) exportCsv(csv.dataset.exportCsv);
    const word = event.target.closest("[data-export-word]");
    if (word) exportWord(word.dataset.exportWord);
  });

  window.addEventListener("hashchange", () => window.setTimeout(renderRoute, 0));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderRoute);
  else renderRoute();
})();
