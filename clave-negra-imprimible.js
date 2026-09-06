(() => {
  const ROUTE = "#/especialidad/saturacion-sea-y-clave-negra";
  const CHECK_KEYS = ["reanimador", "horizontal", "ses"];

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function circle(text, answer = "") {
    const item = document.createElement("div");
    item.className = "sea-print-circle-wrap";
    item.innerHTML = `
      <div class="sea-print-circle">${text}</div>
      ${answer ? `<span class="sea-print-pill">${answer}</span>` : ""}
    `;
    return item;
  }

  function operator(symbol) {
    const el = document.createElement("div");
    el.className = "sea-print-operator";
    el.textContent = symbol;
    return el;
  }

  function makeRow(text, markYes = true) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="sea-print-criterion">${text}</td>
      <td class="sea-print-mark">${markYes ? "✓" : ""}</td>
      <td class="sea-print-mark">${markYes ? "" : "✓"}</td>
    `;
    return row;
  }

  function buildNotification() {
    const section = document.createElement("section");
    section.id = "sea-clave-negra-notification";
    section.className = "sea-print-notification";
    section.hidden = true;
    section.dataset.ready = "false";

    const head = document.createElement("div");
    head.className = "sea-print-notice-head no-print";
    head.innerHTML = `
      <div>
        <p class="detail-label">Documento institucional</p>
        <h2>Notificación de Clave Negra lista para imprimir</h2>
        <p>Reproduce el Anexo 1 · Identificación Clave Negra, página 5 del protocolo institucional.</p>
      </div>
      <button type="button" class="sea-print-button">Imprimir notificación</button>
    `;

    const preview = document.createElement("div");
    preview.className = "sea-print-preview";

    const paper = document.createElement("article");
    paper.className = "sea-print-paper";
    paper.setAttribute("aria-label", "Anexo 1 Identificación Clave Negra");
    paper.innerHTML = `
      <header class="sea-print-doc-head">
        <strong>ANEXO 1</strong>
        <h1>Identificación Clave Negra</h1>
      </header>

      <div class="sea-print-flow" aria-label="Algoritmo de identificación de Clave Negra"></div>

      <table class="sea-print-table">
        <tbody>
          <tr><th colspan="3" class="sea-print-table-title">Clave Negra SEA</th></tr>
          <tr><th colspan="3" class="sea-print-table-subtitle">Check List</th></tr>
          <tr class="sea-print-date-row">
            <td>Fecha: <strong data-sea-print-date></strong></td>
            <td colspan="2">Hora: <strong data-sea-print-time></strong></td>
          </tr>
          <tr class="sea-print-columns">
            <th></th><th>Si</th><th>No</th>
          </tr>
        </tbody>
      </table>

      <div class="sea-print-responsibles">Responsables:</div>
      <div class="sea-print-signatures">
        <div><span></span><p>Firma Jefe de turno<br>Médico</p></div>
        <div><span></span><p>Firma Jefe de Turno<br>Enfermería</p></div>
      </div>

      <footer class="sea-print-footer">
        <div>Hospital P. Alberto Hurtado<br>Unidad de Calidad y Seguridad</div>
        <div>Página 5 de 5</div>
      </footer>
    `;

    const flow = paper.querySelector(".sea-print-flow");
    flow.append(
      circle("¿Reanimador con 5 pacientes y con un 6to inminente?", "SI"),
      operator("+"),
      circle("¿Se pueden generar espacios con Pre-altas en SES?", "NO"),
      operator("+"),
      circle("¿Existen espacios Horizontales?", "NO"),
      operator("="),
      circle("CLAVE NEGRA")
    );

    const tbody = paper.querySelector(".sea-print-table tbody");
    tbody.append(
      makeRow("Reanimador con 5 pacientes con número 6 inminente (suena timbre o viene en camino)"),
      makeRow("Descartar posibilidad de cupos horizontales de “hospitalización” (48) y Camillas transición (CT). ESTO ES QUE NO HAY cupos en obs2 (12), obs1 (18), box (6), UDT (3), modulo (9), 2 CT.J20"),
      makeRow("Se descarta posibilidad de que pacientes autovalentes en ESPERA DE ALTA puedan esperar en SES en silla.")
    );

    preview.append(paper);
    section.append(head, preview);

    head.querySelector(".sea-print-button").addEventListener("click", () => window.print());
    return section;
  }

  function attach() {
    if (currentRoute() !== ROUTE) return;
    const evaluator = document.querySelector("#sea-saturation-evaluator");
    if (!evaluator) return;

    let notification = document.querySelector("#sea-clave-negra-notification");
    if (!notification) {
      notification = buildNotification();
      evaluator.insertAdjacentElement("afterend", notification);
    }

    if (evaluator.dataset.seaPrintHooked === "true") return;
    evaluator.dataset.seaPrintHooked = "true";

    const sync = (allowScroll = true) => {
      const ready = CHECK_KEYS.every((key) => Boolean(evaluator.querySelector(`[data-sea-check="${key}"]`)?.checked));
      const wasReady = notification.dataset.ready === "true";
      notification.dataset.ready = ready ? "true" : "false";
      notification.hidden = !ready;

      if (ready && !wasReady) {
        const now = new Date();
        const dateField = notification.querySelector("[data-sea-print-date]");
        const timeField = notification.querySelector("[data-sea-print-time]");
        if (dateField) dateField.textContent = formatDate(now);
        if (timeField) timeField.textContent = formatTime(now);
        if (allowScroll) {
          window.setTimeout(() => notification.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        }
      }
    };

    evaluator.addEventListener("change", () => sync(true));
    evaluator.querySelector(".sea-reset")?.addEventListener("click", () => window.setTimeout(() => sync(false), 0));
    sync(false);
  }

  const detail = document.querySelector("#protocolDetail");
  if (detail) {
    const observer = new MutationObserver(() => attach());
    observer.observe(detail, { childList: true, subtree: true });
  }

  window.addEventListener("hashchange", () => window.setTimeout(attach, 0));
  window.addEventListener("crs:ui-section-ready", () => window.setTimeout(attach, 0));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach, { once: true });
  else attach();
})();