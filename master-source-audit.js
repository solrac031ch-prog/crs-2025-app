(() => {
  const PREFIX = '#/especialidad/';
  let observer = null;

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const displayTitle = (title) => String(title || '')
    .replace(/^Poli Choque\s+/i, '')
    .replace(/^Flujo\s+/i, '');

  const slugify = (title) => normalize(displayTitle(title))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  function protocols() {
    return Array.isArray(window.CRS_PROTOCOLS) ? window.CRS_PROTOCOLS : [];
  }

  function findProtocol(title) {
    const wanted = normalize(title);
    return protocols().find((item) => normalize(item?.title) === wanted)
      || protocols().find((item) => normalize(displayTitle(item?.title)) === wanted)
      || null;
  }

  function referenceText(protocol) {
    const parts = [];
    if (protocol?.page) parts.push(`Referencia: ${protocol.page}`);
    const docs = Array.isArray(protocol?.sourceDocs) ? protocol.sourceDocs : [];
    if (docs.length && docs[0]?.[0]) parts.push(`Documento: ${docs[0][0]}`);
    if (!parts.length) parts.push('Referencia: ficha institucional dentro de MASTER');
    return parts.join(' · ');
  }

  function action(label, href, external = false) {
    const link = document.createElement('a');
    link.className = 'master-ai-source-action';
    link.href = href;
    link.textContent = label;
    if (external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    return link;
  }

  function enrichCard(card) {
    if (!card || card.dataset.masterAuditDone === 'true') return;
    const title = card.querySelector('strong')?.textContent?.trim();
    if (!title) return;
    const protocol = findProtocol(title);
    if (!protocol) return;

    const audit = document.createElement('div');
    audit.className = 'master-ai-source-audit';

    const ref = document.createElement('div');
    ref.className = 'master-ai-source-ref';
    ref.textContent = referenceText(protocol);

    const actions = document.createElement('div');
    actions.className = 'master-ai-source-actions';
    const slug = protocol.slug || slugify(protocol.title);
    actions.append(action('Ver protocolo', `${PREFIX}${encodeURIComponent(slug)}`));

    const docs = Array.isArray(protocol.sourceDocs) ? protocol.sourceDocs : [];
    docs.slice(0, 3).forEach((doc, index) => {
      const label = String(doc?.[0] || '').trim();
      const href = String(doc?.[1] || '').trim();
      if (!href) return;
      actions.append(action(index === 0 ? 'Abrir documento' : `Documento ${index + 1}`, href, true));
      if (label) actions.lastElementChild.title = label;
    });

    audit.append(ref, actions);
    card.append(audit);
    card.dataset.masterAuditDone = 'true';
  }

  function enrichAll(root = document) {
    root.querySelectorAll?.('.master-ai-source').forEach(enrichCard);
  }

  function watch() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.('.master-ai-source')) enrichCard(node);
          enrichAll(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    enrichAll();
  }

  function waitForQuestion(question, attempt = 0) {
    const dialog = document.querySelector('[data-master-ai-dialog]');
    const input = dialog?.querySelector('textarea');
    if (input && dialog && !dialog.hidden) {
      input.value = String(question || '').slice(0, Number(input.maxLength || 900) || 900);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus({ preventScroll: true });
      return;
    }
    if (attempt < 80) window.setTimeout(() => waitForQuestion(question, attempt + 1), 50);
  }

  function openWithQuestion(question) {
    const value = String(question || '').trim();
    if (window.CRS_MASTER_AI?.open) {
      window.CRS_MASTER_AI.open();
      window.setTimeout(() => waitForQuestion(value), 0);
      return;
    }
    window.dispatchEvent(new CustomEvent('crs:master-ai-open'));
    window.setTimeout(() => waitForQuestion(value), 0);
  }

  window.CRS_MASTER_AUDIT = Object.freeze({
    enrichAll,
    findProtocol,
    openWithQuestion,
    version: 1
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
  else watch();
})();
