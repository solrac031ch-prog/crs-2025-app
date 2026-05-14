(function () {
  const consultoriaPrefix = "#/consultoria-2026/";
  const protocolPrefix = "#/especialidad/";

  const redirectMap = new Map([
    ["hemodinamia-urgencia-2026", "hemodinamia"],
    ["urologia-hedi-2026", "urgencias-urologicas"],
    ["radiologia-intervencional-2026", "radiologia-intervencional"],
    ["columna-aguda-2026", "cirugia-de-columna"],
    ["patologia-arterial-2026", "cirugia-vascular"],
    ["doppler-extremidades-2026", "tvp-sospecha-eco-y-horario-inhabil"],
    ["neurorradiologia-intervencional-2026", "neurologia"],
    ["acv-reperfusion-distancia-2026", "neurologia"],
    ["neurologia-donante-2026", "posible-donante"],
    ["ecocardiografia-donante-2026", "posible-donante"]
  ]);

  const titleMap = new Map([
    ["hemodinamia", "❤️ Hemodinamia de urgencia"],
    ["urgencias-urologicas", "🚻 Urgencia urológica"],
    ["radiologia-intervencional", "🖼️ Radiología intervencional"],
    ["cirugia-de-columna", "🦴 Cirugía de columna"],
    ["cirugia-vascular", "🫀 Cirugía vascular"],
    ["tvp-sospecha-eco-y-horario-inhabil", "🦵 TVP horario inhábil"],
    ["neurologia", "🧠 Neurología"],
    ["posible-donante", "🧠🫀 Posible donante"]
  ]);

  const categoryMap = new Map([
    ["posible-donante", "Protocolo · Manual SSMSO 2026"],
    ["cirugia-vascular", "Flujo · Manual SSMSO 2026"],
    ["tvp-sospecha-eco-y-horario-inhabil", "Flujo · Manual SSMSO 2026"],
    ["neurologia", "Flujo · Manual SSMSO 2026"]
  ]);

  function slugFromHash() {
    const hash = decodeURIComponent(window.location.hash || "");
    if (hash.startsWith(consultoriaPrefix)) return hash.slice(consultoriaPrefix.length).split("?")[0];
    if (hash.startsWith(protocolPrefix)) return hash.slice(protocolPrefix.length).split("?")[0];
    return "";
  }

  function canonicalSlug() {
    const slug = slugFromHash();
    return redirectMap.get(slug) || slug;
  }

  function redirectConsultoriaRoutes() {
    const hash = decodeURIComponent(window.location.hash || "");
    if (!hash.startsWith(consultoriaPrefix)) return false;
    const raw = slugFromHash();
    const target = redirectMap.get(raw);
    if (!target) return false;
    window.location.replace(protocolPrefix + target);
    return true;
  }

  function setTitle() {
    const slug = canonicalSlug();
    const title = titleMap.get(slug);
    const titleNode = document.querySelector("#protocolTitle");
    if (title && titleNode && titleNode.textContent !== title) titleNode.textContent = title;
    const categoryNode = document.querySelector("#protocolCategory");
    const category = categoryMap.get(slug);
    if (category && categoryNode && !categoryNode.textContent.startsWith(category)) categoryNode.textContent = category;
  }

  function addMergedSection() {
    const slug = canonicalSlug();
    const detail = document.querySelector("#protocolDetail");
    if (!detail) return;
    if (slug === "neurologia" && !detail.querySelector("[data-merged-neuro-2026]")) {
      detail.insertAdjacentHTML("afterbegin", `
        <section class="consultoria-2026-card" data-merged-neuro-2026="true">
          <span class="consultoria-2026-badge">Flujo combinado</span>
          <h2>🧠 Neurología</h2>
          <p>Este flujo concentra neurorradiología intervencional y evaluación neurológica a distancia para ACV.</p>
          <div class="consultoria-2026-actions">
            <a href="#/consultoria-2026/neurorradiologia-intervencional-2026">Neurorradiología intervencional</a>
            <a href="#/consultoria-2026/acv-reperfusion-distancia-2026">ACV reperfusión a distancia</a>
          </div>
        </section>
      `);
    }
    if (slug === "posible-donante" && !detail.querySelector("[data-merged-donor-2026]")) {
      detail.insertAdjacentHTML("afterbegin", `
        <section class="consultoria-2026-card" data-merged-donor-2026="true">
          <span class="consultoria-2026-badge">Protocolo único</span>
          <h2>🧠🫀 Posible donante</h2>
          <p>Este protocolo agrupa evaluación neurológica de posible/potencial donante y ecocardiografía de posible/potencial donante.</p>
          <div class="consultoria-2026-actions">
            <a href="#/consultoria-2026/neurologia-donante-2026">Evaluación neurológica</a>
            <a href="#/consultoria-2026/ecocardiografia-donante-2026">Ecocardiografía donante</a>
          </div>
        </section>
      `);
    }
  }

  function renameCards() {
    const labels = new Map([
      ["Hemodinamia de urgencia 2026", "Hemodinamia de urgencia"],
      ["Urología de urgencia HEDI 2026", "Urgencia urológica"],
      ["Radiología intervencional de urgencia 2026", "Radiología intervencional"],
      ["Patología aguda de columna 2026", "Cirugía de columna"],
      ["Patología arterial de urgencia 2026", "Cirugía vascular"],
      ["Ecografía Doppler extremidades 2026", "TVP horario inhábil"],
      ["Neurorradiología intervencional de urgencia 2026", "Neurología"],
      ["Evaluación neurológica a distancia ACV 2026", "Neurología"],
      ["Evaluación neurológica posible donante 2026", "Posible donante"],
      ["Ecocardiografía posible/potencial donante 2026", "Posible donante"]
    ]);
    document.querySelectorAll(".consultoria-flow-card strong,.consultoria-2026-pill strong,.specialty-button strong").forEach((node) => {
      const text = node.textContent.trim();
      const replacement = labels.get(text);
      if (replacement) node.textContent = replacement;
    });

    const seen = new Set();
    document.querySelectorAll(".consultoria-flow-card,.consultoria-2026-pill").forEach((card) => {
      const text = card.querySelector("strong")?.textContent?.trim();
      if (!text) return;
      if (["Urología HSR"].includes(text)) {
        card.style.display = "none";
        return;
      }
      const key = ["Neurología", "Posible donante"].includes(text) ? text : null;
      if (key && seen.has(key)) card.style.display = "none";
      if (key) seen.add(key);
    });
  }

  function patch() {
    if (redirectConsultoriaRoutes()) return;
    setTitle();
    addMergedSection();
    renameCards();
  }

  window.addEventListener("hashchange", () => {
    setTimeout(patch, 20);
    setTimeout(patch, 160);
    setTimeout(patch, 500);
  });
  const observer = new MutationObserver(() => setTimeout(patch, 0));
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
