(() => {
  function scheduleRender(delay = 60) {
    window.CRS_SUPABASE_JEFATURA?.scheduleRender?.(delay);
  }

  function render() {
    window.CRS_SUPABASE_JEFATURA?.render?.();
  }

  window.CRS_SUPABASE_JEFATURA_LEGACY_DISABLED = true;
  window.addEventListener("hashchange", () => scheduleRender(80));
  window.addEventListener("crs:supabase-ready", () => scheduleRender(80));
})();
