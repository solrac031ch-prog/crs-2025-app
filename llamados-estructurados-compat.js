(() => {
  let observer = null;

  function patch() {
    const shell = document.querySelector('[data-calls-structured-search]');
    if (!shell) return;

    shell.dataset.callLiveSearch = 'true';
    const source = shell.querySelector('.on-call-live-source');
    if (source) source.dataset.callLiveSource = 'true';

    const fields = shell.querySelectorAll('.on-call-field input');
    const date = [...fields].find((input) => input.type === 'date');
    const query = [...fields].find((input) => input.type === 'search');
    const status = shell.querySelector('.on-call-live-status');
    const results = shell.querySelector('.on-call-results');
    if (date) date.dataset.callLiveDate = 'true';
    if (query) query.dataset.callLiveQuery = 'true';
    if (status) status.dataset.callLiveStatus = 'true';
    if (results) results.dataset.callLiveResults = 'true';

    if (query && !shell.querySelector('[data-call-live-clear]')) {
      const actions = document.createElement('div');
      actions.className = 'route-actions calls-route-actions';
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'back-link on-call-clear';
      clear.dataset.callLiveClear = 'true';
      clear.textContent = 'Limpiar';
      clear.hidden = !query.value;
      query.addEventListener('input', () => { clear.hidden = !query.value.trim(); });
      clear.addEventListener('click', () => {
        query.value = '';
        query.dispatchEvent(new Event('input', { bubbles: true }));
        query.focus();
      });
      actions.append(clear);
      shell.append(actions);
    }
  }

  function boot() {
    patch();
    if (!observer && document.body) {
      observer = new MutationObserver(patch);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.addEventListener('hashchange', () => setTimeout(patch, 80));
  window.addEventListener('crs:calls-structured-updated', () => setTimeout(patch, 80));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
