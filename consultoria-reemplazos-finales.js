(function () {
  const specialtiesRoute = "#/especialidades";
  const consultoriaPrefix = "#/consultoria-2026/";
  const replacements = [
    ["Flujo", "❤️", "Hemodinamia de urgencias", "hemodinamia-urgencia-2026", "Reemplaza flujo Hemodinamia."],
    ["Flujo", "🚻", "Urgencia urológica", "urologia-hedi-2026", "Reemplaza urgencias urológicas."],
    ["Flujo", "🖼️", "Radiología intervencional", "radiologia-intervencional-2026", "Reemplaza radiología intervencional."],
    ["Flujo", "🦴", "Cirugía de columna", "columna-aguda-2026", "Reemplaza patología aguda de columna."],
    ["Protocolo", "🧠", "Posible donante", "posible-donante-2026", "Neurología + ecocardiografía donante."],
    ["Flujo", "🫀", "Cirugía vascular", "patologia-arterial-2026", "Patología arterial de urgencia."],
    ["Flujo", "🦵", "TVP horario inhábil", "doppler-extremidades-2026", "Doppler extremidades 2026."],
    ["Flujo", "🧠", "Neurología", "neurologia-2026", "Neurorradiología + ACV a distancia."]
  ];

  function addStyles() {
    if (document.getElementById("consultoria-reemplazos-finales-style")) return;
    const style = document.createElement("style");
    style.id = "consultoria-reemplazos-finales-style";
    style.textContent = `
      #specialtiesPage .consultoria-hub[data-consultoria-hub="true"]{display:none!important}
      .final-2026-section{display:grid;gap:12px;margin:0 0 14px;padding:14px;background:#fff;border:1px solid var(--line);border-left:7px solid #0f766e;border-radius:14px;box-shadow:var(--shadow)}
      .final-2026-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}.final-2026-head h2{margin:0;font-size:1.28rem}.final-2026-head span{padding:5px 8px;color:#0b4f49;background:#dff5ef;border-radius:999px;font-weight:900;font-size:.78rem;text-transform:uppercase}.final-2026-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.final-2026-card{display:grid;gap:7px;padding:14px;background:#fbfffd;border:1px solid #d8e9e3;border-top:5px solid #0f766e;border-radius:12px;box-shadow:0 8px 18px rgba(16,18,20,.06)}.final-2026-card strong{font-size:1.07rem;line-height:1.15}.final-2026-card span{font-size:1.65rem}.final-2026-card small{color:var(--muted);line-height:1.28}.final-2026-card[data-category="Protocolo"]{border-top-color:#be123c}.final-2026-card[data-category="Protocolo"] span{color:#be123c}
    `;
    document.head.append(style);
  }

  function sectionMarkup() {
    return `<section class="final-2026-section" data-final-2026-section="true"><div class="final-2026-head"><h2>✅ Flujos actualizados 2026</h2><span>Reemplazos finales</span></div><div class="final-2026-grid">${replacements.map(([category, icon, title, slug, desc]) => `<a class="final-2026-card" data-category="${category}" href="${consultoriaPrefix}${slug}"><span>${icon}</span><strong>${title}</strong><small>${desc}</small></a>`).join("")}</div></section>`;
  }

  function patchSpecialties() {
    if (!window.location.hash.startsWith(specialtiesRoute)) return;
    const page = document.querySelector("#specialtiesPage");
    if (!page || page.querySelector('[data-final-2026-section="true"]')) return;
    const rules = document.querySelector("#rulesPreview");
    if (rules) rules.insertAdjacentHTML("afterend", sectionMarkup());
  }

  function patchTitles() {
    const hash = window.location.hash;
    const title = document.querySelector("#protocolTitle");
    if (!title) return;
    const map = new Map([
      ["hemodinamia-urgencia-2026", "❤️ Hemodinamia de urgencias"],
      ["urologia-hedi-2026", "🚻 Urgencia urológica"],
      ["radiologia-intervencional-2026", "🖼️ Radiología intervencional"],
      ["columna-aguda-2026", "🦴 Cirugía de columna"],
      ["patologia-arterial-2026", "🫀 Cirugía vascular"],
      ["doppler-extremidades-2026", "🦵 TVP horario inhábil"]
    ]);
    for (const [slug, label] of map) {
      if (hash.includes(slug) && title.textContent !== label) title.textContent = label;
    }
  }

  function run() {
    addStyles();
    patchSpecialties();
    patchTitles();
  }

  window.addEventListener("hashchange", () => { setTimeout(run, 80); setTimeout(run, 300); });
  const observer = new MutationObserver(() => setTimeout(run, 0));
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
