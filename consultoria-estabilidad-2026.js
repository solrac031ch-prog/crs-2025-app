(function () {
  const protocolPrefix = "#/especialidad/";
  const consultoriaPrefix = "#/consultoria-2026/";
  const aliases = new Map([
    ["hemodinamia", "hemodinamia-urgencia-2026"],
    ["hemodinamia-2025", "hemodinamia-urgencia-2026"],
    ["neurologia", "neurorradiologia-intervencional-2026"],
    ["neurorradiologia", "neurorradiologia-intervencional-2026"],
    ["trombectomia", "neurorradiologia-intervencional-2026"],
    ["stroke", "neurorradiologia-intervencional-2026"],
    ["radiologia-intervencional", "radiologia-intervencional-2026"],
    ["radiologia-intervencional-2025", "radiologia-intervencional-2026"],
    ["cirugia-de-columna", "columna-aguda-2026"],
    ["patologia-aguda-de-columna", "columna-aguda-2026"],
    ["urgencias-urologicas", "urologia-hedi-2026"],
    ["patologia-urologia-de-urgencia-2025", "urologia-hedi-2026"],
    ["tvp-sospecha-eco-y-horario-inhabil", "doppler-extremidades-2026"],
    ["eco-tvp", "doppler-extremidades-2026"],
    ["doppler", "doppler-extremidades-2026"],
    ["tvp", "doppler-extremidades-2026"],
    ["donante-neurologia", "neurologia-donante-2026"],
    ["posible-donante", "neurologia-donante-2026"],
    ["vascular-arterial", "patologia-arterial-2026"],
    ["patologia-arterial", "patologia-arterial-2026"],
    ["cirugia-vascular", "patologia-arterial-2026"],
    ["eco-donante", "ecocardiografia-donante-2026"],
    ["ecocardiografia-donante", "ecocardiografia-donante-2026"],
    ["acv-reperfusion", "acv-reperfusion-distancia-2026"],
    ["evaluacion-neurologica-distancia", "acv-reperfusion-distancia-2026"],
    ["trombolisis-acv", "acv-reperfusion-distancia-2026"]
  ]);

  function currentSlug() {
    const hash = decodeURIComponent(window.location.hash || "");
    if (!hash.startsWith(protocolPrefix)) return "";
    return hash.slice(protocolPrefix.length).split("?")[0];
  }

  function stabilizeRoute() {
    const slug = currentSlug();
    if (!slug) return false;
    const target = aliases.get(slug);
    if (!target) return false;
    const next = consultoriaPrefix + target;
    if (window.location.hash !== next) {
      window.location.replace(next);
      return true;
    }
    return false;
  }

  function markConsultoriaStable() {
    if (!window.location.hash.startsWith(consultoriaPrefix)) return;
    document.documentElement.dataset.consultoria2026Route = "true";
    const detail = document.querySelector("#protocolDetail");
    if (detail) detail.dataset.consultoria2026Stable = "true";
  }

  function run() {
    if (stabilizeRoute()) return;
    markConsultoriaStable();
  }

  window.addEventListener("hashchange", () => {
    run();
    setTimeout(run, 50);
    setTimeout(run, 200);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
