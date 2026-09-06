(() => {
  const RUNTIME_VERSION = 1;
  const STYLE_VERSION = 1;
  let loading = null;

  function addLauncherStyle() {
    if (document.querySelector('#master-ai-launcher-style')) return;
    const style = document.createElement('style');
    style.id = 'master-ai-launcher-style';
    style.textContent = `
      .master-ai-launcher{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(18px,calc(env(safe-area-inset-bottom) + 18px));z-index:70;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 16px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:#0f766e;color:#fff;box-shadow:0 14px 34px rgba(15,23,42,.24);font:800 .92rem/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
      .master-ai-launcher:hover{background:#115e59}.master-ai-launcher:focus-visible{outline:3px solid #99f6e4;outline-offset:3px}.master-ai-launcher-icon{font-size:1.08rem}.master-ai-launcher[aria-expanded="true"]{opacity:0;pointer-events:none}
      @media(max-width:560px){.master-ai-launcher{right:12px;bottom:max(12px,calc(env(safe-area-inset-bottom) + 12px));min-height:46px;padding:0 13px;font-size:.86rem}}
      @media(print){.master-ai-launcher{display:none!important}}
    `;
    document.head.append(style);
  }

  function ensureStyle() {
    if (document.querySelector('link[data-master-ai-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `./master-ai.css?v=${STYLE_VERSION}`;
    link.dataset.masterAiStyle = 'true';
    document.head.append(link);
  }

  function ensureRuntime() {
    if (window.CRS_MASTER_AI?.open) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      ensureStyle();
      const script = document.createElement('script');
      script.src = `./master-ai.js?v=${RUNTIME_VERSION}`;
      script.dataset.masterAiRuntime = 'true';
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error('No se pudo cargar MASTER IA.'));
      };
      document.body.append(script);
    });
    return loading;
  }

  function mount() {
    if (document.querySelector('[data-master-ai-launcher]')) return;
    addLauncherStyle();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'master-ai-launcher';
    button.dataset.masterAiLauncher = 'true';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir Preguntar al MASTER');
    button.innerHTML = '<span class="master-ai-launcher-icon" aria-hidden="true">✨</span><span>MASTER IA</span>';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await ensureRuntime();
        window.CRS_MASTER_AI?.open?.();
      } catch (error) {
        console.error(error);
        button.disabled = false;
      }
    });
    document.body.append(button);
  }

  window.addEventListener('crs:master-ai-open', () => ensureRuntime().then(() => window.CRS_MASTER_AI?.open?.()).catch(console.error));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
