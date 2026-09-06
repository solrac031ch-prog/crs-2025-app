(() => {
  window.CRS_PROTOCOL_POLISH_BOOTSTRAP = true;

  // MASTER IA mantiene el arranque global ligero: solo monta el botón.
  // La interfaz y el motor local se cargan al primer uso, sin servicios de IA externos.
  if (!document.querySelector('script[data-master-ai-launcher-script]')) {
    const script = document.createElement('script');
    script.src = './master-ai-launcher.js?v=3';
    script.dataset.masterAiLauncherScript = 'true';
    script.async = false;
    document.body.append(script);
  }
})();
