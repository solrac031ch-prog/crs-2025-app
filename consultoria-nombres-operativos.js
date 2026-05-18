(function () {
  const consultoriaPrefix = "#/consultoria-2026/";
  const protocolPrefix = "#/especialidad/";
  const specialtiesRoute = "#/especialidades";
  const callsRoute = "#/llamados";

  const redirectMap = new Map([
    ["hemodinamia", "hemodinamia-urgencia-2026"],
    ["hemodinamia-2025", "hemodinamia-urgencia-2026"],
    ["urgencias-urologicas", "urologia-hedi-2026"],
    ["patologia-urologia-de-urgencia-2025", "urologia-hedi-2026"],
    ["radiologia-intervencional", "radiologia-intervencional-2026"],
    ["radiologia-intervencional-2025", "radiologia-intervencional-2026"],
    ["cirugia-de-columna", "columna-aguda-2026"],
    ["patologia-aguda-de-columna", "columna-aguda-2026"],
    ["tvp-sospecha-eco-y-horario-inhabil", "doppler-extremidades-2026"],
    ["eco-tvp", "doppler-extremidades-2026"],
    ["doppler", "doppler-extremidades-2026"],
    ["tvp", "doppler-extremidades-2026"],
    ["neurologia", "neurologia-integrada-2026"],
    ["neurorradiologia", "neurologia-integrada-2026"],
    ["acv-reperfusion", "neurologia-integrada-2026"],
    ["evaluacion-neurologica-distancia", "neurologia-integrada-2026"],
    ["trombolisis-acv", "neurologia-integrada-2026"],
    ["vascular-arterial", "patologia-arterial-2026"],
    ["patologia-arterial", "patologia-arterial-2026"],
    ["cirugia-vascular", "patologia-arterial-2026"],
    ["donante-neurologia", "posible-donante-2026"],
    ["posible-donante", "posible-donante-2026"],
    ["eco-donante", "posible-donante-2026"],
    ["ecocardiografia-donante", "posible-donante-2026"]
  ]);

  const titleMap = new Map([
    ["hemodinamia-urgencia-2026", { icon: "❤️", title: "Hemodinamia de urgencia", category: "Flujo" }],
    ["urologia-hedi-2026", { icon: "🚻", title: "Urgencia urológica", category: "Flujo" }],
    ["radiologia-intervencional-2026", { icon: "🖼️", title: "Radiología intervencional", category: "Flujo" }],
    ["columna-aguda-2026", { icon: "🦴", title: "Cirugía de columna", category: "Flujo" }],
    ["patologia-arterial-2026", { icon: "🫀", title: "Cirugía vascular", category: "Flujo" }],
    ["doppler-extremidades-2026", { icon: "🦵", title: "TVP horario inhábil", category: "Flujo" }],
    ["neurologia-integrada-2026", { icon: "🧠", title: "Neurología", category: "Flujo" }],
    ["neurorradiologia-intervencional-2026", { icon: "🧠", title: "Neurología", category: "Flujo" }],
    ["acv-reperfusion-distancia-2026", { icon: "🧠", title: "Neurología", category: "Flujo" }],
    ["posible-donante-2026", { icon: "🫀", title: "Posible donante", category: "Protocolo" }],
    ["neurologia-donante-2026", { icon: "🫀", title: "Posible donante", category: "Protocolo" }],
    ["ecocardiografia-donante-2026", { icon: "🫀", title: "Posible donante", category: "Protocolo" }]
  ]);

  const cards = [
    ["❤️", "Hemodinamia de urgencia", "hemodinamia-urgencia-2026", "Flujo"],
    ["🧠", "Neurología", "neurologia-integrada-2026", "Flujo"],
    ["🖼️", "Radiología intervencional", "radiologia-intervencional-2026", "Flujo"],
    ["🦴", "Cirugía de columna", "columna-aguda-2026", "Flujo"],
    ["🚻", "Urgencia urológica", "urologia-hedi-2026", "Flujo"],
    ["🫀", "Cirugía vascular", "patologia-arterial-2026", "Flujo"],
    ["🦵", "TVP horario inhábil", "doppler-extremidades-2026", "Flujo"],
    ["🫀", "Posible donante", "posible-donante-2026", "Protocolo"]
  ];

  function slugFromHash(prefix) {
    const hash = decodeURIComponent(window.location.hash || "");
    if (!hash.startsWith(prefix)) return "";
    return hash.slice(prefix.length).split("?")[0];
  }

  function redirectOldRoutes() {
    const slug = slugFromHash(protocolPrefix);
    const target = redirectMap.get(slug);
    if (target) {
      window.location.replace(consultoriaPrefix + target);
      return true;
    }
    const consultoriaSlug = slugFromHash(consultoriaPrefix);
    if (["neurorradiologia-intervencional-2026", "acv-reperfusion-distancia-2026"].includes(consultoriaSlug)) {
      window.location.replace(consultoriaPrefix + "neurologia-integrada-2026");
      return true;
    }
    if (["neurologia-donante-2026", "ecocardiografia-donante-2026"].includes(consultoriaSlug)) {
      window.location.replace(consultoriaPrefix + "posible-donante-2026");
      return true;
    }
    return false;
  }

  function overrideTitle() {
    const slug = slugFromHash(consultoriaPrefix);
    const meta = titleMap.get(slug);
    if (!meta) return;
    const title = document.querySelector("#protocolTitle");
    const category = document.querySelector("#protocolCategory");
    if (title) title.textContent = `${meta.icon} ${meta.title}`;
    if (category) category.textContent = `${meta.category} · Manual Consultoría de Llamada SSMSO 2026`;
  }

  function makeIntegratedPage(slug) {
    const title = document.querySelector("#protocolTitle");
    const category = document.querySelector("#protocolCategory");
    const detail = document.querySelector("#protocolDetail");
    if (!detail) return;
    const isNeuro = slug === "neurologia-integrada-2026";
    if (title) title.textContent = isNeuro ? "🧠 Neurología" : "🫀 Posible donante";
    if (category) category.textContent = `${isNeuro ? "Flujo" : "Protocolo"} · Manual Consultoría de Llamada SSMSO 2026`;
    detail.classList.add("consultoria-detail");
    detail.innerHTML = isNeuro ? neuroMarkup() : donorMarkup();
  }

  function neuroMarkup() {
    return `
      <article class="protocol-card"><span class="page-badge">Manual 2026 · p. 15-17 y 32-33</span><p class="protocol-summary">Flujo integrado de Neurología: neurorradiología intervencional y evaluación neurológica a distancia para ACV/reperfusión.</p><div class="tags"><span class="tag">ACV</span><span class="tag">Trombectomía</span><span class="tag">Trombólisis</span><span class="tag">Telemedicina</span><span class="tag">Neurointervención</span></div></article>
      <section class="detail-section moments-panel"><div class="route-section-head"><strong>🧩 Rutas dentro de Neurología</strong></div><div class="moment-grid">
        <article class="moment-card"><h3>1. Neurorradiología intervencional</h3><p>Angiografía, trombectomía mecánica y embolización.</p><ul><li>Criterios: oclusión aguda cerebral, HSA por aneurisma roto, vasoespasmo en HSA, MAV rota u otra hemorragia cerebral.</li><li>Isquémico: neurólogo HSR/HPH/HEDI llama al neurointervencionista y en paralelo al Articulador SSMSO +569 9253 7195.</li><li>Hemorrágico: médico a cargo solicita evaluación por neurocirujano HSR; si cumple, deriva a UEH HSR.</li></ul></article>
        <article class="moment-card"><h3>2. Evaluación neurológica a distancia ACV</h3><p>Teleconsulta para ACV isquémico en ventana o status epiléptico refractario.</p><ul><li>Inclusión ACV: >18 años, déficit focal &lt;4,5 h, NIHSS ≥4 o déficit discapacitante, MRS ≤3, glicemia 50-400 y TAC sin hemorragia.</li><li>Activación: Articulador SSMSO +569 9253 7195.</li><li>Neurólogo abre episodio en CUD: telemedicina.ssmso.cl.</li></ul></article>
      </div></section>
      <section class="detail-section"><div class="route-section-head"><strong>✅ Pasos</strong></div><div class="flow"><div class="flow-step"><span class="step-number">1</span><p>Definir si el caso es ACV isquémico en ventana, patología hemorrágica neuroquirúrgica o status epiléptico.</p></div><div class="flow-step"><span class="step-number">2</span><p>Si requiere neurointervención, contactar neurólogo/neurocirujano según tipo de lesión y llamar Articulador.</p></div><div class="flow-step"><span class="step-number">3</span><p>Si es ACV para teleconsulta, llamar Articulador para validación y contacto con neurólogo.</p></div><div class="flow-step"><span class="step-number">4</span><p>Coordinar Gestión de Camas, traslado, procedimiento o retorno según indicación del especialista.</p></div></div></section>
      <div class="warning">Neurología concentra neurorradiología intervencional y tele-neurología ACV; no mostrar como botones separados.</div>`;
  }

  function donorMarkup() {
    return `
      <article class="protocol-card"><span class="page-badge">Manual 2026 · p. 26 y 31</span><p class="protocol-summary">Protocolo único de posible/potencial donante: evaluación neurológica y ecocardiografía para apoyo al proceso de procuramiento.</p><div class="tags"><span class="tag">Donante</span><span class="tag">CLP</span><span class="tag">EEG</span><span class="tag">Ecocardiografía</span><span class="tag">Procuramiento</span></div></article>
      <section class="detail-section moments-panel"><div class="route-section-head"><strong>🧩 Componentes</strong></div><div class="moment-grid">
        <article class="moment-card"><h3>1. Evaluación neurológica</h3><p>Apoyo para certificación de muerte encefálica e interpretación EEG.</p><ul><li>Posible donante: daño neurológico severo con Glasgow ≤7.</li><li>Potencial donante: muerte encefálica certificada.</li><li>Activación por Coordinador Local de Procuramiento según rotativa.</li></ul></article>
        <article class="moment-card"><h3>2. Ecocardiografía donante</h3><p>Cardiólogo ecografista para realización e informe de ecocardiograma.</p><ul><li>Se activa si no hay especialista disponible en el momento requerido.</li><li>Activación por CLP Red Suroriente.</li><li>No es derivación ni referencia/contrarreferencia.</li></ul></article>
      </div></section>
      <section class="detail-section"><div class="route-section-head"><strong>✅ Pasos</strong></div><div class="flow"><div class="flow-step"><span class="step-number">1</span><p>Identificar posible o potencial donante.</p></div><div class="flow-step"><span class="step-number">2</span><p>CLP confirma necesidad de evaluación neurológica, EEG o ecocardiografía.</p></div><div class="flow-step"><span class="step-number">3</span><p>CLP activa especialista según rotativa y completa encuesta del proyecto.</p></div><div class="flow-step"><span class="step-number">4</span><p>Especialista realiza evaluación/informe y se registra en ficha clínica.</p></div></div></section>
      <div class="warning">Este protocolo lo activa el Coordinador Local de Procuramiento, no el médico de urgencia directamente.</div>`;
  }

  function patchCards() {
    if (!window.location.hash.startsWith(specialtiesRoute) && !window.location.hash.startsWith(callsRoute)) return;
    document.querySelectorAll(".consultoria-hub .consultoria-grid, .consultoria-2026-grid").forEach((grid) => {
      if (grid.dataset.operationalNames === "true") return;
      grid.dataset.operationalNames = "true";
      grid.innerHTML = cards.map(([icon, title, slug, category]) => `<a class="consultoria-flow-card" href="${consultoriaPrefix}${slug}"><span>${icon}</span><strong>${title}</strong><small>${category} actualizado según Manual SSMSO 2026.</small></a>`).join("");
    });
  }

  function patch() {
    if (redirectOldRoutes()) return;
    const slug = slugFromHash(consultoriaPrefix);
    if (slug === "neurologia-integrada-2026" || slug === "posible-donante-2026") makeIntegratedPage(slug);
    else overrideTitle();
    setTimeout(patchCards, 0);
    setTimeout(patchCards, 120);
  }

  window.addEventListener("hashchange", () => { setTimeout(patch, 0); setTimeout(patch, 120); setTimeout(patch, 360); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
