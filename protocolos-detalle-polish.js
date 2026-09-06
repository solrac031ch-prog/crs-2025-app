(() => {
  window.CRS_PROTOCOL_POLISH_BOOTSTRAP = true;

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
