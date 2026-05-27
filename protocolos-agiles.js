(() => {
  const protocolPrefix = "#/especialidad/";
  const routeAliases = new Map([
    ["endoscopia-de-urgencias", "eda"],
    ["hemodinamia", "hemodinamia-2025"],
    ["neurocirugia", "hemorragia-intracerebral"],
    ["cirugia-de-columna", "patologia-aguda-de-columna"],
    ["urgencias-urologicas", "patologia-urologia-de-urgencia-2025"],
    ["radiologia-intervencional", "radiologia-intervencional-2025"]
  ]);

  function normalizeHashAlias() {
    if (!window.location.hash.startsWith(protocolPrefix)) return;
    const slug = window.location.hash.slice(protocolPrefix.length).split("?")[0];
    const target = routeAliases.get(decodeURIComponent(slug));
    if (target) window.location.replace(protocolPrefix + target);
  }

  window.addEventListener("hashchange", normalizeHashAlias);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", normalizeHashAlias, { once: true });
  } else {
    normalizeHashAlias();
  }
})();