(() => {
  const MAX_QUESTION = 900;
  const MAX_SOURCES = 5;
  const MAX_SOURCE_TEXT = 4200;
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

  function protocolText(protocol) {
    const lines = [];
    if (protocol.summary) lines.push(`Resumen: ${protocol.summary}`);
    (protocol.fields || []).forEach((field) => {
      if (Array.isArray(field) && field.length >= 2) lines.push(`${field[0]}: ${field[1]}`);
    });
    if (Array.isArray(protocol.flow) && protocol.flow.length) {
      lines.push('Flujo:');
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
    sources.forEach((source) => {
      const card = document.createElement('div');
      card.className = 'master-ai-source';
      const strong = document.createElement('strong');
      strong.textContent = source.title;
      const meta = document.createElement('span');
      meta.textContent = [source.category, source.page].filter(Boolean).join(' · ');
      card.append(strong, meta);
      target.append(card);
    });
  }

  function renderAnswer(answer, sources, configured) {
    const box = dialog?.querySelector('[data-master-ai-answer]');
    const text = dialog?.querySelector('[data-master-ai-answer-text]');
    const config = dialog?.querySelector('[data-master-ai-config]');
    if (!box || !text || !config) return;
    text.textContent = answer;
    renderSources(sources);
    config.hidden = configured;
    box.hidden = false;
  }

  async function ask(question, sources) {
    const api = window.CRS_SUPABASE?.client?.();
    if (!api?.functions?.invoke) {
      return {
        configured: false,
        answer: 'Encontré fuentes pertinentes dentro de MASTER, pero el servicio de IA todavía no está disponible en este dispositivo.',
        sources
      };
    }
    const { data, error } = await api.functions.invoke('master-ai', {
      body: {
        question,
        sources: sources.map(({ title, category, page, summary, text }) => ({ title, category, page, summary, text }))
      }
    });
    if (error) throw error;
    return data || {};
  }

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector('textarea');
    const button = form.querySelector('button[type="submit"]');
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
      renderSources([]);
      renderAnswer('No encontré respaldo suficiente dentro de los protocolos cargados en MASTER para responder esa consulta. Prueba con el nombre del flujo, especialidad o procedimiento.', [], true);
      setStatus('Sin fuentes institucionales suficientes.', true);
      return;
    }

    button.disabled = true;
    setStatus(`Revisando ${sources.length} fuente${sources.length === 1 ? '' : 's'} de MASTER…`);
    try {
      const result = await ask(question, sources);
      const answer = String(result.answer || '').trim() || 'No fue posible generar una respuesta.';
      renderAnswer(answer, Array.isArray(result.sources) && result.sources.length ? result.sources : sources, Boolean(result.configured));
      setStatus(result.configured ? 'Respuesta generada únicamente con las fuentes recuperadas.' : 'Fuentes recuperadas; falta activar la credencial de IA en el servidor.');
    } catch (error) {
      console.error('MASTER IA', error);
      renderAnswer('Encontré las fuentes que ves abajo, pero no pude completar la respuesta de IA. Puedes abrir el flujo correspondiente directamente en MASTER.', sources, true);
      setStatus('No se pudo contactar el servicio de IA.', true);
    } finally {
      button.disabled = false;
    }
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
          <div class="master-ai-head-copy"><span class="master-ai-kicker">Asistente institucional beta</span><h2 id="masterAiTitle">Preguntar al MASTER</h2><p>Busca primero en los protocolos de la app y responde solo con ese respaldo.</p></div>
          <button class="master-ai-close" type="button" data-master-ai-close aria-label="Cerrar">×</button>
        </header>
        <div class="master-ai-body">
          <div class="master-ai-notice">No ingreses nombre, RUT, ficha, correo ni otros datos identificatorios de pacientes. Esta herramienta apoya el acceso al protocolo; no reemplaza el juicio clínico ni la verificación del documento vigente.</div>
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
            <div class="master-ai-config" data-master-ai-config hidden>La recuperación de fuentes ya funciona. Para habilitar la redacción por IA falta configurar OPENAI_API_KEY como secreto de la Edge Function en Supabase.</div>
          </section>
          <p class="master-ai-footer">Si el contenido recuperado no respalda la pregunta, el asistente debe decirlo en vez de completar información por conocimiento general.</p>
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
    setStatus('Escribe una consulta. Primero buscaré respaldo dentro de MASTER.');
    window.setTimeout(() => dialog.querySelector('textarea')?.focus({ preventScroll: true }), 0);
  }

  window.CRS_MASTER_AI = Object.freeze({ open, close, retrieve });
})();
