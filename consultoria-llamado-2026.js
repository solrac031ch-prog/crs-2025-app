(function () {
  const callsRoute = "#/llamados";
  const projects = [
    ["❤️", "Hemodinamia de urgencia", "hemodinamia-urgencia-2026"],
    ["🧠", "Neurorradiología intervencional", "neurorradiologia-intervencional-2026"],
    ["🖼️", "Radiología intervencional", "radiologia-intervencional-2026"],
    ["🦴", "Patología aguda de columna", "columna-aguda-2026"],
    ["🚻", "Urología HSR", "urologia-hsr-2026"],
    ["🚻", "Urología HEDI", "urologia-hedi-2026"],
    ["🧠", "Neurología posible donante", "neurologia-donante-2026"],
    ["🫀", "Patología arterial", "patologia-arterial-2026"],
    ["🦵", "Doppler extremidades / TVP", "doppler-extremidades-2026"],
    ["🫀", "Ecocardiografía donante", "ecocardiografia-donante-2026"],
    ["🧠", "ACV reperfusión a distancia", "acv-reperfusion-distancia-2026"]
  ];

  function addStyles() {
    if (document.getElementById("consultoria-2026-style")) return;
    const style = document.createElement("style");
    style.id = "consultoria-2026-style";
    style.textContent = `
      .consultoria-2026-card{display:grid;gap:12px;padding:16px;background:#fff;border:1px solid var(--line);border-left:7px solid #be123c;border-radius:12px;box-shadow:var(--shadow)}
      .consultoria-2026-card h2,.consultoria-2026-card h3{margin:0;line-height:1.15}.consultoria-2026-card p{margin:0;color:var(--muted);line-height:1.45}.consultoria-2026-badge{justify-self:start;padding:5px 8px;color:#fff;background:#be123c;border-radius:999px;font-size:.76rem;font-weight:900;text-transform:uppercase}.consultoria-2026-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.consultoria-2026-pill{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:center;padding:9px 10px;background:#fff7f9;border:1px solid #ffd0dd;border-radius:10px;font-weight:800;line-height:1.25}.consultoria-2026-pill:hover{border-color:#be123c;box-shadow:0 8px 18px rgba(190,18,60,.12)}.consultoria-2026-note{padding:10px 11px;background:#fff4d7;border:1px solid #f4d28a;border-radius:10px;color:#6f4200;font-weight:750;line-height:1.4}.consultoria-2026-actions{display:flex;flex-wrap:wrap;gap:8px}.consultoria-2026-actions a{min-height:38px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;color:#fff;background:#0b4f49;border-radius:8px;font-weight:850}
    `;
    document.head.append(style);
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
        <p>Flujos 2026 disponibles como rutas propias. Esta tarjeta no modifica pantallas de protocolos para evitar alternancia visual.</p>
        <div class="consultoria-2026-grid">${projects.map(([icon, label, slug]) => `<a class="consultoria-2026-pill" href="#/consultoria-2026/${slug}"><span>${icon}</span><strong>${label}</strong></a>`).join("")}</div>
        <div class="consultoria-2026-actions"><a href="#/especialidades">Ver todos en Especialidades</a></div>
        <div class="consultoria-2026-note">Usar siempre rotativa vigente y confirmar con jefatura de turno antes de traslado o procedimiento.</div>
      </section>
    `;
    if (head) head.insertAdjacentHTML("afterend", markup);
  }

  function patch() {
    addStyles();
    patchCallsPage();
  }

  window.addEventListener("hashchange", () => setTimeout(patch, 80));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
