(() => {
  const TITLE = "Saturación SEA y Clave Negra";
  const SLUG = "saturacion-sea-y-clave-negra";
  const ROUTE = `#/especialidad/${SLUG}`;
  const protocols = window.CRS_PROTOCOLS;

  if (!Array.isArray(protocols)) return;

  if (!protocols.some((item) => item?.slug === SLUG || item?.title === TITLE)) {
    protocols.push({
      title: TITLE,
      slug: SLUG,
      category: "Protocolo",
      page: "HPH · Mayo 2022",
      summary: "Protocolo institucional para identificar sobresaturación del Servicio de Emergencia Adulto y activar la contingencia de Clave Negra cuando el próximo paciente con riesgo vital no podría ser atendido por falta de espacio físico.",
      tags: ["Saturación", "Clave Negra", "Overcrowding", "48 camillas", "Reanimador", "EWS", "Gestión de camas", "SSMSO"],
      hidePriority: true,
      fields: [
        ["Vigencia del documento", "Entrada en vigencia octubre 2018; última actualización mayo 2022; próxima revisión mayo 2027."],
        ["Evaluación de sobresaturación", "Se realiza a las 08:00 AM, de lunes a domingo."],
        ["Criterio objetivo", "100% de ocupación de camillas de urgencia: 48 camillas ocupadas con pacientes hospitalizados en espera de hospitalización."],
        ["Autorización", "Se avisa al subdirector médico, quien autoriza la activación del protocolo de sobresaturación."],
        ["Comunicación", "Gestión de camas comunica la saturación al SSMSO y a los participantes del proceso hospitalario."],
        ["Clave Negra", "Contingencia para la situación en que el próximo paciente o grupo de pacientes con riesgo vital que llegue a reanimador no podría ser atendido por falta de espacio físico."],
        ["Registro Clave Negra", "Los criterios deben registrarse en checklist con fecha y hora y ser firmados por Jefatura de turno médica y de enfermería del SEA."]
      ],
      flow: [
        "Voceo por altoparlante de activación del protocolo de saturación.",
        "Realizar visita técnica de Urgencia para definir altas y controles en policlínico de altas de Urgencia.",
        "Medicina evalúa reserva latente de camas y resolución de pendientes para alta junto a especialistas semaneros que se requieran.",
        "Todo paciente de alta debe estar en sala pre-alta a primera hora.",
        "Hospitalizar pacientes médico-quirúrgicos en camas de otros servicios cuando corresponda, a cargo del equipo de pacientes ectópicos.",
        "Suspender hospitalizaciones desde CRS para estudio de pacientes no programados; se exceptúan los que tienen hora dada y confirmada.",
        "Mantener 6 cupos fijos de Hospitalización Domiciliaria, evaluados tempranamente mediante ícono en Pitágoras.",
        "Sostener reingresos desde Hospitalización Domiciliaria.",
        "Activar alarma en pantallas del Servicio de Urgencia para pacientes y funcionarios.",
        "Evaluar la posibilidad de suspender o sostener cirugías electivas que requieran cama de salida.",
        "Avisar a red Santa Rosa para contención de pacientes en APS.",
        "Gestión de camas busca camas en red SSMSO o externas y activa búsqueda de cupos UTI UGCC a primera hora.",
        "Suspender todos los rescates desde otros hospitales.",
        "Si se cumplen las condiciones, activar Clave Negra. Imágenes y Laboratorio darán prioridad al SEA."
      ],
      warning: "La aplicación no activa por sí sola una alerta institucional. Sobresaturación requiere autorización del subdirector médico; Clave Negra exige cumplir y registrar el checklist institucional firmado por jefatura médica y de enfermería."
    });
  }

  const blackActions = [
    "Jefatura médica y de enfermería informan telefónicamente al Médico jefe de Emergencia Adulto; si no es posible, informar al Médico jefe Técnico.",
    "Enfermería de turno informa a las jefaturas/coordinaciones correspondientes y se avisa a guardias para activar el voceo de CLAVE NEGRA.",
    "Gestor de flujos informa la situación a Gestión de Camas.",
    "Jefe de turno médico avisa al jefe de turno médico del servicio médico quirúrgico.",
    "Gestión de Camas da cuenta de la situación crítica a la red MINSAL y al chat de gestión.",
    "Trasladar transitoriamente un paciente, el más estable del servicio según EWS, a sala de espera interna de Pediatría. El paciente sigue a cargo del SEA y el cupo debe desocuparse lo antes posible; el protocolo ejemplifica rescate en menos de 1 hora.",
    "Trasladar DOS pacientes de forma inmediata a hospitalización de Medicina, priorizando pendientes de subir a cama básica. Si no hay pendientes, usar la lista AM; de no haber, trasladar los 2 pacientes más básicos según EWS y decisión de jefatura de turno.",
    "Al día siguiente realizar revisión y feedback del caso con el turno saliente y checklist."
  ];

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function makeCheck(label, name) {
    const row = document.createElement("label");
    row.className = "sea-check-row";
    row.innerHTML = `<input type="checkbox" data-sea-check="${name}"><span>${label}</span>`;
    return row;
  }

  function buildActions(title, items, className = "") {
    const box = document.createElement("div");
    box.className = `sea-action-box ${className}`.trim();
    const heading = document.createElement("h3");
    heading.textContent = title;
    const list = document.createElement("ol");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    box.append(heading, list);
    return box;
  }

  function buildEvaluator() {
    const section = document.createElement("section");
    section.id = "sea-saturation-evaluator";
    section.className = "sea-evaluator";
    section.innerHTML = `
      <div class="sea-evaluator-head">
        <p class="detail-label">Herramienta de turno</p>
        <h2>Evaluar sobresaturación y Clave Negra</h2>
        <p>Marca únicamente los criterios que están objetivamente cumplidos. Esta herramienta orienta la aplicación del protocolo; no reemplaza la autorización ni el registro institucional.</p>
      </div>
    `;

    const saturationBlock = document.createElement("div");
    saturationBlock.className = "sea-stage";
    saturationBlock.innerHTML = "<h3>1. Sobresaturación SEA</h3>";
    saturationBlock.append(makeCheck("48/48 camillas de Urgencia ocupadas con pacientes hospitalizados en espera de hospitalización.", "saturation"));
    const saturationState = document.createElement("div");
    saturationState.className = "sea-state";
    saturationState.dataset.seaSaturationState = "true";
    saturationBlock.append(saturationState);

    const blackBlock = document.createElement("div");
    blackBlock.className = "sea-stage sea-black-stage";
    blackBlock.innerHTML = "<h3>2. Checklist de identificación de Clave Negra</h3><p class=\"sea-stage-copy\">El anexo institucional exige comprobar los tres puntos y registrarlos con fecha/hora y firmas de jefatura médica y de enfermería.</p>";
    blackBlock.append(
      makeCheck("Reanimador adulto con 5 pacientes y un número 6 inminente (suena timbre o viene en camino).", "reanimador"),
      makeCheck("NO existen cupos horizontales: Obs2 (12), Obs1 (18), box (6), UDT (3), módulo (9) ni 2 camillas de transición.", "horizontal"),
      makeCheck("NO es posible que pacientes autovalentes en espera de alta esperen en Sala de Espera Secundaria (SES) en silla.", "ses")
    );
    const blackState = document.createElement("div");
    blackState.className = "sea-state";
    blackState.dataset.seaBlackState = "true";
    blackBlock.append(blackState);

    const actions = buildActions("Acciones al confirmarse Clave Negra", blackActions, "sea-black-actions");
    actions.hidden = true;

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "sea-reset";
    reset.textContent = "Reiniciar checklist";

    section.append(saturationBlock, blackBlock, actions, reset);

    const update = () => {
      const saturation = Boolean(section.querySelector('[data-sea-check="saturation"]')?.checked);
      const blackChecks = ["reanimador", "horizontal", "ses"].map((key) => Boolean(section.querySelector(`[data-sea-check="${key}"]`)?.checked));
      const blackReady = blackChecks.every(Boolean);

      saturationState.dataset.state = saturation ? "ready" : "pending";
      saturationState.textContent = saturation
        ? "Cumple criterio objetivo de sobresaturación. Avisar al subdirector médico para autorización del protocolo y a Gestión de Camas para comunicación a la red."
        : "No está marcado el criterio objetivo de sobresaturación (48/48 hospitalizados en espera de cama).";

      blackState.dataset.state = blackReady ? "black" : "pending";
      blackState.textContent = blackReady
        ? "CUMPLE CHECKLIST DE CLAVE NEGRA: registrar fecha y hora, obtener firmas de jefatura médica y de enfermería y ejecutar la contingencia institucional."
        : `${blackChecks.filter(Boolean).length}/3 criterios de Clave Negra confirmados.`;

      actions.hidden = !blackReady;
    };

    section.addEventListener("change", update);
    reset.addEventListener("click", () => {
      section.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      update();
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    update();

    return section;
  }

  function enhance() {
    if (currentRoute() !== ROUTE) return;
    const detail = document.querySelector("#protocolDetail");
    const title = document.querySelector("#protocolTitle");
    if (!detail || !title || title.textContent.trim() !== TITLE) return;
    if (detail.querySelector("#sea-saturation-evaluator")) return;

    const evaluator = buildEvaluator();
    const header = detail.querySelector(".protocol-card");
    if (header) header.insertAdjacentElement("afterend", evaluator);
    else detail.prepend(evaluator);
  }

  const detail = document.querySelector("#protocolDetail");
  if (detail) {
    const observer = new MutationObserver(() => enhance());
    observer.observe(detail, { childList: true, subtree: false });
  }

  window.addEventListener("hashchange", () => window.setTimeout(enhance, 0));
  window.addEventListener("crs:ui-section-ready", () => window.setTimeout(enhance, 0));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhance, { once: true });
  else enhance();
})();