(() => {
  window.CRS_PROTOCOL_POLISH_BOOTSTRAP = true;

  function addStyle(href, key) {
    if (document.querySelector(`link[data-master-upgrade="${key}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.masterUpgrade = key;
    document.head.append(link);
  }

  function addScript(src, key) {
    if (document.querySelector(`script[data-master-upgrade="${key}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.masterUpgrade = key;
    script.async = false;
    document.body.append(script);
  }

  addStyle('./master-upgrade.css?v=1', 'style');
  addScript('./llamados-estructurados.js?v=2', 'calls-structured');
  addScript('./master-source-audit.js?v=1', 'source-audit');
  addScript('./master-search.js?v=1', 'search');

  // MASTER IA mantiene el arranque global ligero: solo monta el botón.
  // La interfaz y estilos completos se cargan al primer uso.
  if (!document.querySelector('script[data-master-ai-launcher-script]')) {
    const script = document.createElement('script');
    script.src = './master-ai-launcher.js?v=2';
    script.dataset.masterAiLauncherScript = 'true';
    script.async = false;
    document.body.append(script);
  }
})();
