(() => {
  const MAX_QUESTION = 900;
  const MAX_SOURCES = 5;
  const MAX_SOURCE_TEXT = 5200;
  const examples = [
    'TVP en horario inhábil: ¿cuál es el flujo?',
    '¿Cómo activo Clave Negra?',
    'Glaucoma agudo: ¿dónde se deriva?',
    'Sonda Foley obstruida: ¿qué flujo corresponde?',
    '¿Cómo coordino Sala Pulso?'
  ];
  const expansions = {
    tvp: ['trombosis', 'venosa', 'doppler', 'eco'],
    hda: ['hemorragia', 'digestiva', 'alta', 'endoscopia', 'eda'],
    eda: ['endoscopia', 'digestiva'],
    uro: ['urologia', 'urologica', 'foley', 'sonda'],
    oftalmo: ['oftalmologia', 'glaucoma', 'ocular'],
    neuro: ['neurologia', 'neurocirugia', 'acv'],
    pulso: ['sala', 'transfusion'],
    taco: ['taco', 'control'],
    negra: ['clave', 'saturacion'],
    clave: ['negra', 'saturacion'],
    shock: ['choque'],
    choque: ['shock']
  };
  const stopWords = new Set(['como','cual','cuales','donde','cuando','para','por','que','del','las','los','una','uno','unos','unas','con','sin','sobre','desde','hasta','este','esta','estos','estas','hay','hago','hacer','activo','activar']);
  let dialog = null;
  let previousFocus = null;

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  function tokens(value) {
    const base = normalize(value).split(' ').filter((item) => item.length > 1);
    const expanded = new Set(base);
    base.forEach((item) => (expansions[item] || []).forEach((extra) => expanded.add(extra)));
    return [...expanded];
  }

  function meaningfulTokens(value) {
    return tokens(value).filter((item) => item.length > 2 && !stopWords.has(item));
  }

  function protocolText(protocol) {
    const lines = [];
    if (protocol.summary) lines.push(`Resumen: ${protocol.summary}`);
    (protocol.fields || []).forEach((field) => {
      if (Array.isArray(field) && field.length >= 2) lines.push(`${field[0]}: ${field[1]}`);
    });
    if (Array.isArray(protocol.flow) && protocol.flow.length) {
      protocol.flow.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
    }
    if (protocol.warning) lines.push(`Advertencia: ${protocol.warning}`);
    (protocol.pathologies || []).forEach((group) => {
      if (!Array.isArray(group)) return;
      const label = group[0] || 'Patologías';
      const items = Array.isArray(group[1]) ? group[1] : [];
      if (items.length) lines.push(`${label}: ${items.join('; ')}`);
    });
    return lines.join('\n').slice(0, MAX_SOURCE_TEXT);
  }

  function sourceScore(protocol, question) {
    const q = normalize(question);
    const words = tokens(question);
    const title = normalize(protocol.title);
    const tags = normalize((protocol.tags || []).join(' '));
    const summary = normalize(protocol.summary);
    const body = normalize(protocolText(protocol));
    let score = 0;

    if (q && title === q) score += 80;
    if (q && title.includes(q)) score += 36;
    if (q && tags.includes(q)) score += 20;
    words.forEach((word) => {
      if (title.split(' ').includes(word)) score += 16;
      else if (title.includes(word)) score += 8;
      if (tags.split(' ').includes(word)) score += 9;
      else if (tags.includes(word)) score += 4;
      if (summary.includes(word)) score += 3;
      if (body.includes(word)) score += 1;
    });
    return score;
  }

  function retrieve(question) {
    const protocols = Array.isArray(window.CRS_PROTOCOLS) ? window.CRS_PROTOCOLS : [];
    return protocols
      .map((protocol) => ({ protocol, score: sourceScore(protocol, question) }))
      .filter((item) => item.score >= 5)
      .sort((a, b) => b.score - a.score || String(a.protocol.title).localeCompare(String(b.protocol.title), 'es'))
      .slice(0, MAX_SOURCES)
      .map(({ protocol, score }) => ({
        title: String(protocol.title || 'Sin título'),
        category: String(protocol.category || ''),
        page: String(protocol.page || ''),
        summary: String(protocol.summary || ''),
        fields: Array.isArray(protocol.fields) ? protocol.fields.filter((field) => Array.isArray(field) && field.length >= 2).map((field) => [String(field[0]), String(field[1])]) : [],
        flow: Array.isArray(protocol.flow) ? protocol.flow.map(String) : [],
        warning: String(protocol.warning || ''),
        pathologies: Array.isArray(protocol.pathologies) ? protocol.pathologies : [],
        text: protocolText(protocol),
        score
      }));
  }

  function likelyIdentifier(value) {
    const text = String(value || '');
    return [
      /\b\d{1,2}\.?\d{3}\.?\d{3}-[0-9kK]\b/,
      /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
      /\b(?:rut|run|ficha|n[°º]?\s*ficha)\s*[:#-]?\s*[a-z0-9.-]+/i
    ].some((pattern) => pattern.test(text));
  }

  function matchingPathologies(source, question) {
    const terms = meaningfulTokens(question);
    if (!terms.length) return [];
    const matches = [];
    (source.pathologies || []).forEach((group) => {
      if (!Array.isArray(group)) return;
      const label = String(group[0] || 'Patologías');
      const items = Array.isArray(group[1]) ? group[1].map(String) : [];
      const selected = items.filter((item) => terms.some((term) => normalize(item).includes(term))).slice(0, 6);
      if (selected.length) matches.push([label, selected]);
    });
    return matches;
  }

  function localAnswer(question, sources) {
    if (!sources.length) return 'No encuentro respaldo suficiente en MASTER para responder con seguridad.';
    const source = sources[0];
    const lines = [`Según MASTER — ${source.title}`];

    if (source.summary) lines.push('', source.summary);

    if (source.fields.length) {
      lines.push('', 'Datos del flujo:');
      source.fields.slice(0, 10).forEach(([label, value]) => lines.push(`• ${label}: ${value}`));
    }

    if (source.flow.length) {
      lines.push('', 'Pasos:');
      source.flow.slice(0, 10).forEach((step, index) => lines.push(`${index + 1}. ${step}`));
    }

    const pathologyMatches = matchingPathologies(source, question);
    pathologyMatches.forEach(([label, items]) => {
      lines.push('', `${label}:`);
      items.forEach((item) => lines.push(`• ${item}`));
    });

    if (source.warning) lines.push('', `⚠️ Advertencia: ${source.warning}`);
    lines.push('', `Fuente MASTER: ${source.title}${source.page ? ` · ${source.page}` : ''}`);
    return lines.join('\n');
  }

  function setStatus(message, error = false) {
    const node = dialog?.querySelector('[data-master-ai-status]');
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('error', error);
  }

  function renderSources(sources) {
    const target = dialog?.querySelector('[data-master-ai-sources]');
    if (!target) return;
    target.innerHTML = '';
    if (!sources.length) return;
    const title = document.createElement('h3');
    title.textContent = `Fuentes de MASTER (${sources.length})`;
    target.append(title);
    sources.forEach((source, index) => {
      const card = document.createElement('div');
      card.className = 'master-ai-source';
      if (index === 0) card.dataset.masterAiPrimarySource = 'true';
      const strong = document.createElement('strong');
      strong.textContent = source.title;
      const meta = document.createElement('span');
      meta.textContent = [source.category, source.page].filter(Boolean).join(' · ');
      card.append(strong, meta);
      target.append(card);
    });
  }

  function renderAnswer(answer, sources) {
    const box = dialog?.querySelector('[data-master-ai-answer]');
    const text = dialog?.querySelector('[data-master-ai-answer-text]');
    const config = dialog?.querySelector('[data-master-ai-config]');
    if (!box || !text || !config) return;
    text.textContent = answer;
    renderSources(sources);
    config.textContent = 'Modo local $0: esta consulta no se envió a OpenAI, Cloudflare ni otro servicio de IA externo.';
    config.hidden = false;
    box.hidden = false;
  }

  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector('textarea');
    const question = String(input?.value || '').trim();
    const answerBox = dialog?.querySelector('[data-master-ai-answer]');
    if (answerBox) answerBox.hidden = true;

    if (question.length < 3) {
      setStatus('Escribe una pregunta un poco más específica.', true);
      input?.focus();
      return;
    }
    if (question.length > MAX_QUESTION) {
      setStatus(`La consulta puede tener hasta ${MAX_QUESTION} caracteres.`, true);
      return;
    }
    if (likelyIdentifier(question)) {
      setStatus('Retira RUT, ficha, correo u otros datos identificatorios del paciente antes de consultar.', true);
      return;
    }

    const sources = retrieve(question);
    if (!sources.length) {
      renderAnswer('No encontré respaldo suficiente dentro de los protocolos cargados en MASTER para responder esa consulta. Prueba con el nombre del flujo, especialidad o procedimiento.', []);
      setStatus('Sin fuentes institucionales suficientes.', true);
      return;
    }

    renderAnswer(localAnswer(question, sources), sources);
    setStatus('Respuesta local · $0 · solo contenido de MASTER.');
  }

  function close() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.body.style.overflow = '';
    const launcher = document.querySelector('[data-master-ai-launcher]');
    launcher?.setAttribute('aria-expanded', 'false');
    launcher && (launcher.disabled = false);
    previousFocus?.focus?.({ preventScroll: true });
  }

  function mount() {
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.className = 'master-ai-backdrop';
    dialog.dataset.masterAiDialog = 'true';
    dialog.hidden = true;
    dialog.innerHTML = `
      <section class="master-ai-sheet" role="dialog" aria-modal="true" aria-labelledby="masterAiTitle">
        <header class="master-ai-head">
          <div class="master-ai-head-copy"><span class="master-ai-kicker">Asistente institucional local · $0</span><h2 id="masterAiTitle">Preguntar al MASTER</h2><p>Busca dentro de los protocolos cargados en la app y muestra únicamente contenido institucional.</p></div>
          <button class="master-ai-close" type="button" data-master-ai-close aria-label="Cerrar">×</button>
        </header>
        <div class="master-ai-body">
          <div class="master-ai-notice">No ingreses nombre, RUT, ficha, correo ni otros datos identificatorios de pacientes. La consulta se procesa localmente en este dispositivo y no reemplaza el juicio clínico ni la verificación del documento vigente.</div>
          <div class="master-ai-examples" data-master-ai-examples></div>
          <form class="master-ai-form" data-master-ai-form>
            <label for="masterAiQuestion">Pregunta sobre un flujo, protocolo o procedimiento HPH</label>
            <textarea id="masterAiQuestion" maxlength="${MAX_QUESTION}" placeholder="Ej: TVP en horario inhábil, ¿qué hago?"></textarea>
            <button class="master-ai-submit" type="submit">Consultar MASTER</button>
          </form>
          <div class="master-ai-status" data-master-ai-status aria-live="polite"></div>
          <section class="master-ai-answer" data-master-ai-answer hidden>
            <span class="master-ai-answer-label">Respuesta basada en MASTER</span>
            <div class="master-ai-answer-text" data-master-ai-answer-text></div>
            <div class="master-ai-sources" data-master-ai-sources></div>
            <div class="master-ai-config" data-master-ai-config hidden></div>
          </section>
          <p class="master-ai-footer">Motor local de recuperación clínica: no usa una API de IA de pago. Si el contenido cargado no respalda la pregunta, MASTER debe decirlo.</p>
        </div>
      </section>`;

    const examplesBox = dialog.querySelector('[data-master-ai-examples]');
    examples.forEach((example) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'master-ai-example';
      button.textContent = example;
      button.addEventListener('click', () => {
        const input = dialog.querySelector('textarea');
        input.value = example;
        input.focus();
      });
      examplesBox.append(button);
    });

    dialog.querySelector('[data-master-ai-form]').addEventListener('submit', submit);
    dialog.querySelector('[data-master-ai-close]').addEventListener('click', close);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dialog && !dialog.hidden) close();
    });
    document.body.append(dialog);
    return dialog;
  }

  function open() {
    mount();
    previousFocus = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    const launcher = document.querySelector('[data-master-ai-launcher]');
    launcher?.setAttribute('aria-expanded', 'true');
    launcher && (launcher.disabled = false);
    setStatus('Escribe una consulta. Se procesará localmente sin costo por uso.');
    window.setTimeout(() => dialog.querySelector('textarea')?.focus({ preventScroll: true }), 0);
  }

  window.CRS_MASTER_AI = Object.freeze({ open, close, retrieve, localAnswer });
})();
