(function () {
  const protocolPrefix = "#/especialidad/";
  const callsRoute = "#/llamados";

  const projects = [
    "Hemodinamia de urgencia",
    "Neurorradiología intervencional de urgencia",
    "Radiología intervencional de urgencia",
    "Patología aguda de columna",
    "Patología aguda urológica HSR",
    "Patología aguda urológica HEDI",
    "Evaluación neurológica posible donante",
    "Resolución patología arterial de urgencia",
    "Ecografía Doppler de extremidades",
    "Ecocardiografía posible/potencial donante",
    "Evaluación neurológica a distancia para reperfusión ACV"
  ];

  const commonActivation = [
    "Llamar al Articulador SSMSO: +569 9253 7195 cuando el flujo lo exija.",
    "El llamado telefónico es obligatorio y actúa como validador de activación de la consultoría.",
    "Entregar: nombre, RUN, edad, hospital solicitante, médico solicitante, RUN médico, procedimiento, criterio de llamada y médico receptor/presentado.",
    "Coordinar siempre con Gestión de Camas para traslado, cama, retorno o contrarreferencia.",
    "La respuesta de pertinencia entre centros no debe superar 2 horas cuando el proyecto lo define; prestación dentro de 24 horas si cumple criterio."
  ];

  const updates = [
    {
      test: /hemodinamia/i,
      title: "❤️ Hemodinamia de urgencia 2026",
      status: "Actualizar flujo 2025",
      bullets: [
        "Responsable: Hemodinamia HSR. Activación final por residente UCO HSR.",
        "IAM con SDST desde HPH/HEDI debe trasladarse a UEH Adultos HSR; APS con sospecha IAM SDST debe ir directo a UEH HSR.",
        "Criterios incluyen IAM SDST, shock cardiogénico, angina post PTCA, complicación mecánica IAM, IAM SSDST con angina refractaria/compromiso hemodinámico, tormenta eléctrica en SCA, drenaje pericárdico y TEP masivo con trombólisis mecánica.",
        "Debe informarse a Coordinador Médico UEH HSR +569 9998 0214 y paralelamente al Articulador SSMSO.",
        "Retorno a hospital base inmediato post procedimiento, salvo balón de contrapulsación o inestabilidad hemodinámica/eléctrica. VM no impide retorno."
      ]
    },
    {
      test: /neurolog|neurorradiolog|trombectom|stroke|acv/i,
      title: "🧠 Neuro 2026: neurorradiología, donante y ACV",
      status: "Ajustar con tres rutas separadas",
      bullets: [
        "Neurorradiología intervencional: angiografía cerebral, trombectomía mecánica y embolización.",
        "Criterios: oclusión aguda cerebral, HSA por aneurisma roto, vasoespasmo en HSA, MAV rota y otras hemorragias cerebrales.",
        "Isquémico: gestiona neurólogo de HSR/HPH/HEDI y llama directamente al neurointervencionista; además informar al Articulador.",
        "Hemorrágico: médico a cargo solicita evaluación por neurocirujano HSR; si cumple pertinencia, deriva a UEH HSR.",
        "ACV reperfusión a distancia: ventana <4,5 h, NIHSS ≥4 o déficit discapacitante, MRS ≤3, glicemia 50-400 y TAC sin hemorragia. Activación por Articulador SSMSO y registro en CUD telemedicina.ssmso.cl."
      ]
    },
    {
      test: /radiolog/i,
      title: "🖼️ Radiología intervencional 2026",
      status: "Actualizar criterios de activación",
      bullets: [
        "Proyecto HSR para embolización terapéutica en sangrado activo traumático o no traumático.",
        "Requiere hemodinamia estable y AngioTAC <24 h que demuestre sangrado activo.",
        "Si hay inestabilidad hemodinámica, debe realizarse cirugía de control de daños antes de activar RI.",
        "Caso debe ser evaluado por jefe de turno de cirugía del hospital derivador; hemoptisis/HDA/HDB requieren evaluación subespecialista quirúrgica previa.",
        "Presentar a jefe turno cirugía UEH HSR, coordinador medicina urgencia o UTU según contexto; paralelo Articulador SSMSO."
      ]
    },
    {
      test: /columna|raquimedular|medular/i,
      title: "🦴 Columna aguda 2026",
      status: "Actualizar criterios y activación",
      bullets: [
        "Criterios: TRM con compromiso neurológico, compresión medular, mielitis transversa infecciosa/absceso peridural con compromiso neurológico e inestabilidad de columna por trauma.",
        "Paciente debe estar hemodinámicamente estable.",
        "El médico a cargo debe hacer dos tareas: llamar Articulador SSMSO y presentar caso a UEH Adultos HSR.",
        "Activación por traumatólogo de turno UEH HSR o cirujano de turno HSR.",
        "La llamada depende de disponibilidad de pabellón, anestesia y cama."
      ]
    },
    {
      test: /urolog|urologia|urología/i,
      title: "🚻 Urología de urgencia 2026",
      status: "Separar HSR y HEDI",
      bullets: [
        "Existen dos proyectos: patología aguda urológica HSR y patología aguda urológica HEDI.",
        "HPH puede derivar a HSR o HEDI según rotativa/pertinencia y ausencia de especialista del otro centro.",
        "Criterios: Fournier, urolitiasis obstructiva unilateral/bilateral, testículo agudo, nefrectomía por sepsis/hemorragia, nefrostomía obstructiva, priapismo, trauma genital/uretral, lesión uréter/vejiga, abscesos retroperitoneales y hemovejiga.",
        "Siempre llamar Articulador SSMSO y presentar a UEH del centro receptor; respuesta de pertinencia ≤2 h y prestación ≤24 h.",
        "Retorno a hospital base con pase del urólogo y coordinación por Gestión de Camas."
      ]
    },
    {
      test: /tvp|doppler|eco/i,
      title: "🦵 Ecografía Doppler extremidades 2026",
      status: "Actualizar horario y cupos",
      bullets: [
        "Cobertura sábados, domingos y festivos de 09:00 a 12:00 h.",
        "Pacientes >15 años, ambulatorios en UEH, con sospecha de TVP de extremidades superiores o inferiores.",
        "5 cupos diarios para HPH/HEDI/CHSJM; horas: 09:20, 09:50, 10:20, 10:50 y 11:20.",
        "HPH/HEDI deben llamar antes de completar formulario: hábil Coordinador Red Urgencia +569 4402 0756; inhábil Articuladora SSMSO +569 9253 7195.",
        "Paciente va directo a Imagenología HSR, sala 9 Block Central; no debe pasar por UEH HSR; llegar 20 min antes y no se reciben después de 12:00. Orden con firma y timbre de jefe de turno."
      ]
    },
    {
      test: /arterial|vascular|aneurisma|isquemia/i,
      title: "🫀 Patología arterial de urgencia 2026",
      status: "Agregar como flujo nuevo",
      bullets: [
        "Proyecto HSR de cirugía vascular para intervención quirúrgica arterial y tratamiento endovascular arterial complejo.",
        "Criterios: disección aórtica tipo B complicada, aneurisma roto, reconstrucción arterial compleja, isquemia aguda Rutherford 2b, isquemia mesentérica, isquemia esplácnica y flegmasia.",
        "Activación por jefe de turno cirugía UEH HSR y/o coordinador UTU HSR.",
        "Médico solicitante debe llamar Articulador SSMSO y presentar caso a UEH HSR/UTU/cirugía.",
        "Trauma: destino según UTU. No traumático: UEH HSR. APS deriva a hospital base, no directo a HSR."
      ]
    },
    {
      test: /donante|procuramiento|ecocardiograf|eco/i,
      title: "🫀 Donante 2026: neuro + ecocardiografía",
      status: "Agregar ecocardiografía donante",
      bullets: [
        "Posible donante: daño neurológico severo con Glasgow ≤7. Potencial donante: muerte encefálica certificada.",
        "Evaluación neurológica posible/potencial donante: activación por Coordinador Local de Procuramiento SSMSO.",
        "Ecocardiografía posible/potencial donante: cardiólogo ecografista HEDI, 24/7 si no hay especialista disponible.",
        "Ambas rutas no requieren referencia/contrarreferencia; se activan por CLP y encuesta específica.",
        "Registrar condiciones clínicas e indicación de activación en ficha."
      ]
    }
  ];

  function addStyles() {
    if (document.getElementById("consultoria-2026-style")) return;
    const style = document.createElement("style");
    style.id = "consultoria-2026-style";
    style.textContent = `
      .consultoria-2026-card{display:grid;gap:12px;padding:16px;background:#fff;border:1px solid var(--line);border-left:7px solid #be123c;border-radius:12px;box-shadow:var(--shadow)}
      .consultoria-2026-card h2,.consultoria-2026-card h3{margin:0;line-height:1.15}.consultoria-2026-card p{margin:0;color:var(--muted);line-height:1.45}.consultoria-2026-badge{justify-self:start;padding:5px 8px;color:#fff;background:#be123c;border-radius:999px;font-size:.76rem;font-weight:900;text-transform:uppercase}.consultoria-2026-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.consultoria-2026-pill{padding:9px 10px;background:#fff7f9;border:1px solid #ffd0dd;border-radius:10px;font-weight:800;line-height:1.25}.consultoria-2026-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}.consultoria-2026-list li{display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;line-height:1.38}.consultoria-2026-list li::before{content:"✓";display:grid;place-items:center;width:22px;height:22px;color:#fff;background:#be123c;border-radius:50%;font-size:.76rem;font-weight:950}.consultoria-2026-note{padding:10px 11px;background:#fff4d7;border:1px solid #f4d28a;border-radius:10px;color:#6f4200;font-weight:750;line-height:1.4}.consultoria-2026-actions{display:flex;flex-wrap:wrap;gap:8px}.consultoria-2026-actions a{min-height:38px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;color:#fff;background:#0b4f49;border-radius:8px;font-weight:850}.consultoria-2026-status{color:#be123c;font-weight:900;text-transform:uppercase;font-size:.78rem}
    `;
    document.head.append(style);
  }

  function currentProtocolText() {
    const title = document.querySelector("#protocolTitle")?.textContent || "";
    const hash = decodeURIComponent(window.location.hash || "");
    return `${title} ${hash}`;
  }

  function matchingUpdates() {
    const text = currentProtocolText();
    return updates.filter((item) => item.test.test(text));
  }

  function updateMarkup(update) {
    return `
      <section class="consultoria-2026-card" data-consultoria-2026="true">
        <span class="consultoria-2026-badge">Manual SSMSO 2026</span>
        <h2>${update.title}</h2>
        <p><span class="consultoria-2026-status">${update.status}</span></p>
        <ul class="consultoria-2026-list">${update.bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="consultoria-2026-note">Validar con rotativa vigente y jefatura de turno antes de activar traslado o procedimiento.</div>
      </section>
    `;
  }

  function patchProtocolDetail() {
    if (!window.location.hash.startsWith(protocolPrefix)) return;
    const detail = document.querySelector("#protocolDetail");
    if (!detail || detail.querySelector('[data-consultoria-2026="true"]')) return;
    const matches = matchingUpdates();
    if (!matches.length) return;
    detail.insertAdjacentHTML("afterbegin", matches.map(updateMarkup).join(""));
  }

  function patchCallsPage() {
    if (!window.location.hash.startsWith(callsRoute)) return;
    const page = document.querySelector("#callsPage");
    if (!page || page.querySelector('[data-consultoria-2026-calls="true"]')) return;
    const head = page.querySelector(".page-head");
    const markup = `
      <section class="consultoria-2026-card" data-consultoria-2026-calls="true">
        <span class="consultoria-2026-badge">Resolución Exenta 770 · 31/03/2026</span>
        <h2>📞 Manual Consultoría de Llamada SSMSO 2026</h2>
        <p>Documento oficial vigente para consultorías de llamada 2026. Debe usarse como respaldo para actualizar los flujos de la app.</p>
        <div class="consultoria-2026-grid">${projects.map((item) => `<div class="consultoria-2026-pill">${item}</div>`).join("")}</div>
        <h3>Regla transversal de activación</h3>
        <ul class="consultoria-2026-list">${commonActivation.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="consultoria-2026-note">La app muestra una capa de actualización 2026; falta transcribir cada flujo en app.js para dejarlo como versión definitiva.</div>
      </section>
    `;
    if (head) head.insertAdjacentHTML("afterend", markup);
  }

  function patch() {
    addStyles();
    patchCallsPage();
    patchProtocolDetail();
  }

  const observer = new MutationObserver(() => window.setTimeout(patch, 0));
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => {
    window.setTimeout(patch, 80);
    window.setTimeout(patch, 300);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
