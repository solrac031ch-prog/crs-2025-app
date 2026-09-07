(() => {
  const MAX_RESULTS = 14;
  const ROUTES = [
    { title: 'Inicio', subtitle: 'Panel principal', href: '#/inicio', icon: '⌂', keywords: 'inicio master urgencia' },
    { title: 'Especialidades y flujos', subtitle: 'Protocolos, CRS, poli choque y derivaciones', href: '#/especialidades', icon: '⚡', keywords: 'especialidades flujos protocolos derivar crs choque' },
    { title: 'Especialistas de llamado y UHD', subtitle: 'Rotativa vigente y hospitalización domiciliaria', href: '#/llamados', icon: '☎', keywords: 'llamados turno especialista medico uhd rotativa' },
    { title: 'Formularios de turno', subtitle: 'Documentos frecuentes', href: '#/formularios', icon: '▤', keywords: 'formularios documentos impresos solicitudes' },
    { title: 'Directorio telefónico', subtitle: 'Anexos y contactos frecuentes', href: '#/telefonos', icon: '☏', keywords: 'telefono telefonos contacto contactos anexo anexos llamar' },
    { title: 'Educación médica', subtitle: 'Material docente y procedimientos', href: '#/educacion', icon: '▦', keywords: 'educacion docencia procedimiento material' },
    { title: 'Gestión de casos', subtitle: 'Seguimiento operativo', href: '#/gestion', icon: '✓', keywords: 'gestion casos seguimiento prioridad' },
    { title: 'Jefatura', subtitle: 'Publicaciones y administración', href: '#/jefatura', icon: '⚙', keywords: 'jefatura admin administrar publicar documento' }
  ];

  let backdrop = null;
  let input = null;
  let resultsNode = null;
  let hintNode = null;
  let previousFocus = null;
  let queryVersion = 0;
  let corpusLoading = null;

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = (value) => normalize(value).split(' ').filter((token) => token.length > 1);

  const displayTitle = (title) => String(title || '')
    .replace(/^Poli Choque\s+/i, '')
    .replace(/^Flujo\s+/i, '');

  const slugify = (title) => normalize(displayTitle(title))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  function loadSharedRouteScript(key, path, version) {
    const selector = `script[data-crs-route-module="${key}"]`;
    const existing = document.querySelector(selector);
    if (existing?.dataset.crsLoaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      const done = () => {
        script.dataset.crsLoaded = 'true';
        resolve();
      };
      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', reject, { once: true });
      if (!existing) {
        script.src = `./${path}?v=${version}`;
        script.async = false;
        script.dataset.crsRouteModule = key;
        document.body.append(script);
      }
    });
  }

  function ensureCorpus() {
    if (corpusLoading) return corpusLoading;
    corpusLoading = Promise.all([
      loadSharedRouteScript('protocolo-saturacion-sea', 'protocolo-saturacion-sea.js', 1),
      loadSharedRouteScript('protocolos-2026-ajustes', 'protocolos-2026-ajustes.js', 4)
    ]).catch((error) => console.warn('Buscador MASTER continuará con el corpus ya cargado.', error));
    return corpusLoading;
  }

  function protocolHaystack(protocol) {
    return [
      protocol?.title,
      protocol?.category,
      protocol?.page,
      protocol?.summary,
      ...(protocol?.tags || []),
      ...((protocol?.fields || []).flat?.() || []),
      ...(protocol?.flow || []),
      ...((protocol?.moments || []).flatMap?.((item) => [item?.title, item?.text, item?.alert, ...(item?.steps || [])]) || []),
      ...((protocol?.pathologies || []).flat?.(2) || [])
    ].filter(Boolean).join(' ');
  }

  function protocolItems() {
    const seen = new Set();
    return (Array.isArray(window.CRS_PROTOCOLS) ? window.CRS_PROTOCOLS : [])
      .filter((protocol) => protocol?.title && protocol.category !== 'Regla general')
      .filter((protocol) => {
        const key = normalize(protocol.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((protocol) => ({
        group: 'Protocolos',
        kind: protocol.category || 'Protocolo',
        title: displayTitle(protocol.title),
        subtitle: [protocol.category, protocol.page, protocol.summary].filter(Boolean).join(' · '),
        href: `#/especialidad/${encodeURIComponent(protocol.slug || slugify(protocol.title))}`,
        icon: protocol.category === 'Protocolo' ? '▣' : protocol.category === 'CRS' ? '🏥' : '⚡',
        haystack: protocolHaystack(protocol)
      }));
  }

  function phoneItems() {
    const groups = window.CRS_APP_OPERATIONAL?.phoneDirectory || [];
    return groups.flatMap((group) => (group?.items || []).map((item) => ({
      group: 'Contactos',
      kind: 'Directorio',
      title: item.name || group.group || 'Contacto',
      subtitle: [item.detail, item.phone].filter(Boolean).join(' · '),
      href: '#/telefonos',
      icon: '☏',
      haystack: [group.group, item.name, item.detail, item.phone, ...(item.tags || [])].join(' ')
    })));
  }

  function formItems() {
    const forms = window.CRS_FORMS_DATA?.turnForms || [];
    return forms.map((item) => ({
      group: 'Formularios',
      kind: 'Formulario',
      title: item.title || item.name || item.label || 'Formulario',
      subtitle: item.description || item.detail || 'Formulario de turno',
      href: '#/formularios',
      icon: '▤',
      haystack: [item.title, item.name, item.label, item.description, item.detail, item.key].filter(Boolean).join(' ')
    }));
  }

  function routeItems() {
    return ROUTES.map((item) => ({ ...item, group: 'Accesos', kind: 'Sección', haystack: `${item.title} ${item.subtitle} ${item.keywords}` }));
  }

  function score(item, query) {
    const q = normalize(query);
    if (!q) return 0;
    const title = normalize(item.title);
    const haystack = normalize(`${item.title} ${item.subtitle || ''} ${item.haystack || ''}`);
    const wanted = tokens(q);
    let value = 0;
    if (title === q) value += 120;
    if (title.startsWith(q)) value += 75;
    if (title.includes(q)) value += 55;
    if (haystack.includes(q)) value += 35;
    wanted.forEach((token) => {
      if (title.split(' ').some((word) => word.startsWith(token))) value += 18;
      else if (haystack.split(' ').some((word) => word.startsWith(token))) value += 7;
    });
    if (wanted.length && wanted.every((token) => haystack.includes(token))) value += 24;
    return value;
  }

  function staticMatches(query) {
    return [...protocolItems(), ...phoneItems(), ...formItems(), ...routeItems()]
      .map((item) => ({ ...item, score: score(item, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'es'))
      .slice(0, MAX_RESULTS);
  }

  function resultElement(item) {
    const link = document.createElement('a');
    link.className = 'master-search-result';
    link.href = item.href || '#/inicio';
    link.addEventListener('click', close);

    const icon = document.createElement('span');
    icon.className = 'master-search-result-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = item.icon || '•';

    const copy = document.createElement('span');
    copy.className = 'master-search-result-copy';
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const subtitle = document.createElement('span');
    subtitle.textContent = item.subtitle || '';
    copy.append(strong, subtitle);

    const kind = document.createElement('span');
    kind.className = 'master-search-result-kind';
    kind.textContent = item.kind || '';
    link.append(icon, copy, kind);
    return link;
  }

  function groupResults(items) {
    const groups = new Map();
    items.forEach((item) => {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group).push(item);
    });
    return groups;
  }

  function render(items, query, append = false) {
    if (!resultsNode) return;
    if (!append) resultsNode.replaceChildren();
    const groups = groupResults(items);
    groups.forEach((groupItems, groupName) => {
      const section = document.createElement('section');
      section.className = 'master-search-group';
      const title = document.createElement('h3');
      title.textContent = groupName;
      section.append(title);
      groupItems.forEach((item) => section.append(resultElement(item)));
      resultsNode.append(section);
    });

    if (!append) {
      if (!items.length && query) {
        const empty = document.createElement('div');
        empty.className = 'master-search-empty';
        empty.textContent = 'No encontré una coincidencia directa. Puedes preguntarle a MASTER IA usando el mismo texto.';
        resultsNode.append(empty);
      }
      if (query.length >= 3) {
        const ask = document.createElement('button');
        ask.type = 'button';
        ask.className = 'master-search-ask';
        ask.textContent = '✨ Preguntar esto a MASTER IA';
        ask.addEventListener('click', () => {
          const text = input?.value?.trim() || query;
          close();
          window.CRS_MASTER_AUDIT?.openWithQuestion?.(text);
        });
        resultsNode.append(ask);
      }
    }
  }

  async function appendOnCall(query, version) {
    if (!query || query.length < 2 || !window.CRS_STRUCTURED_CALLS?.searchToday) return;
    try {
      const rows = await window.CRS_STRUCTURED_CALLS.searchToday(query);
      if (version !== queryVersion || normalize(input?.value) !== normalize(query) || !rows?.length) return;
      const items = rows.slice(0, 4).map((row) => ({
        group: 'Especialista de hoy',
        kind: 'Llamado',
        title: row.specialty,
        subtitle: `${row.doctor} · ${row.dateLabel || 'hoy'}`,
        href: '#/llamados',
        icon: '☎',
        haystack: `${row.specialty} ${row.doctor}`
      }));
      render(items, query, true);
    } catch (error) {
      console.warn('No se pudo sumar la rotativa estructurada al buscador global.', error);
    }
  }

  function update() {
    const query = String(input?.value || '').trim();
    const version = ++queryVersion;
    hintNode.textContent = query
      ? 'Busca protocolos, formularios, contactos y especialista vigente. Enter abre el primer resultado.'
      : 'Prueba: TVP, Clave Negra, urología, Sala Pulso, formulario o anexo. Atajo: ⌘/Ctrl + K.';

    if (!query) {
      render([
        ...routeItems().slice(1, 5),
        ...protocolItems().filter((item) => /TVP|Clave Negra|Sala Pulso/i.test(item.title)).slice(0, 3)
      ], '', false);
      return;
    }
    const matches = staticMatches(query);
    render(matches, query, false);
    appendOnCall(query, version);
  }

  function mountDialog() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.className = 'master-search-backdrop';
    backdrop.hidden = true;
    backdrop.dataset.masterGlobalSearch = 'true';

    const dialog = document.createElement('section');
    dialog.className = 'master-search-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Buscador clínico universal');

    const head = document.createElement('div');
    head.className = 'master-search-head';
    input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Buscar en MASTER…';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Buscar en MASTER');
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'master-search-close';
    closeButton.setAttribute('aria-label', 'Cerrar buscador');
    closeButton.textContent = '×';
    head.append(input, closeButton);

    hintNode = document.createElement('div');
    hintNode.className = 'master-search-hint';
    resultsNode = document.createElement('div');
    resultsNode.className = 'master-search-results';
    resultsNode.setAttribute('aria-live', 'polite');
    dialog.append(head, hintNode, resultsNode);
    backdrop.append(dialog);
    document.body.append(backdrop);

    input.addEventListener('input', update);
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const first = resultsNode.querySelector('.master-search-result');
      if (!first) return;
      event.preventDefault();
      first.click();
    });
    closeButton.addEventListener('click', close);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close();
    });
  }

  function open(prefill = '') {
    mountDialog();
    previousFocus = document.activeElement;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = String(prefill || '');
    update();
    input.focus({ preventScroll: true });
    ensureCorpus().then(() => update());
  }

  function close() {
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.style.overflow = '';
    previousFocus?.focus?.({ preventScroll: true });
  }

  function mountTrigger() {
    if (document.querySelector('[data-master-global-trigger]')) return;
    const topbar = document.querySelector('.topbar');
    const nav = topbar?.querySelector('.topnav');
    if (!topbar || !nav) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'master-global-trigger';
    button.dataset.masterGlobalTrigger = 'true';
    button.setAttribute('aria-label', 'Abrir buscador universal');
    button.innerHTML = '<span aria-hidden="true">⌕</span><span class="master-global-label">Buscar</span><kbd>⌘K</kbd>';
    button.addEventListener('click', () => open());
    topbar.insertBefore(button, nav);
  }

  document.addEventListener('keydown', (event) => {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (isShortcut) {
      event.preventDefault();
      if (backdrop && !backdrop.hidden) close();
      else open();
      return;
    }
    if (event.key === 'Escape' && backdrop && !backdrop.hidden) close();
  });

  window.CRS_MASTER_SEARCH = Object.freeze({ open, close, version: 1 });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountTrigger, { once: true });
  else mountTrigger();
})();
