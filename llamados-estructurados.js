(() => {
  const ROUTE = '#/llamados';
  const TABLE = 'crs_call_schedules';
  const MONTHS = new Map([
    ['enero', 1], ['febrero', 2], ['marzo', 3], ['abril', 4], ['mayo', 5], ['junio', 6],
    ['julio', 7], ['agosto', 8], ['septiembre', 9], ['setiembre', 9], ['octubre', 10], ['noviembre', 11], ['diciembre', 12]
  ]);
  const MONTH_LABELS = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const LABELS = new Map([
    ['broncopulmonar', ['bronco']],
    ['gastroenterologia', ['gastro']],
    ['nefrologia habil', ['nefrologia habil']],
    ['nefrologia inhabil', ['nefrologia']],
    ['reumatologia am', ['reumatologia']],
    ['reumatologia pm', ['reumatologia pm']]
  ]);
  const BLOCKED_ALIASES = new Map([['urologia', new Set(['renal'])]]);

  let currentDoc = null;
  let currentMeta = null;
  let cachedRows = null;
  let loadPromise = null;
  let panelObserver = null;
  let mounting = false;
  const pendingUploads = new WeakMap();

  const clean = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = (value) => clean(value).split(' ').filter(Boolean);
  const catalog = () => window.CRS_APP_OPERATIONAL?.onCallSchedule?.rows || [];
  const route = () => String(location.hash || '#/inicio').split('?')[0];
  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const dateValue = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const localDateValue = (date = new Date()) => dateValue(date.getFullYear(), date.getMonth() + 1, date.getDate());

  function formatDate(value) {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return 'Fecha seleccionada';
    return new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(year, month - 1, day, 12));
  }

  function parseMonthYear(value) {
    const normalized = clean(value);
    const monthName = [...MONTHS.keys()].find((name) => normalized.includes(name));
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    if (!monthName || !yearMatch) return null;
    const month = MONTHS.get(monthName);
    const year = Number(yearMatch[1]);
    return { month, year, label: `${MONTH_LABELS[month]} ${year}` };
  }

  function pdfJs() {
    if (window.pdfjsLib?.getDocument) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-pdfjs]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.pdfjsLib), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      script.dataset.pdfjs = 'true';
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = () => reject(new Error('No se pudo cargar el lector PDF.'));
      document.head.append(script);
    }).then((lib) => {
      if (lib?.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      return lib;
    });
  }

  function groupRows(rawItems) {
    const rows = [];
    const items = (rawItems || [])
      .filter((item) => String(item.str || '').trim())
      .map((item) => ({
        text: String(item.str || '').trim(),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0)
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    items.forEach((item) => {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.6);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    });

    rows.forEach((row) => {
      row.items.sort((a, b) => a.x - b.x);
      row.text = row.items.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
      row.norm = clean(row.text);
    });
    rows.sort((a, b) => b.y - a.y);
    return rows;
  }

  async function pagesFromBytes(bytes) {
    const lib = await pdfJs();
    const pdf = await lib.getDocument({ data: bytes }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push({ pageNo, rows: groupRows(content.items) });
    }
    return pages;
  }

  async function extractPages(file) {
    return pagesFromBytes(new Uint8Array(await file.arrayBuffer()));
  }

  async function extractPagesFromUrl(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No pude descargar la rotativa vigente (${response.status}).`);
    return pagesFromBytes(new Uint8Array(await response.arrayBuffer()));
  }

  function dayBlocks(page) {
    const headers = (page?.rows || []).map((row) => {
      const columns = new Map();
      row.items.forEach((item) => {
        if (!/^\d{1,2}$/.test(item.text)) return;
        const day = Number(item.text);
        if (Number.isInteger(day) && day >= 1 && day <= 31 && !columns.has(day)) columns.set(day, item.x + item.width / 2);
      });
      return { y: row.y, columns };
    }).filter(({ columns }) => columns.size >= 3).sort((a, b) => b.y - a.y);
    return headers.map((header, index) => ({ ...header, upperY: header.y, lowerY: headers[index + 1]?.y ?? -Infinity }));
  }

  function blocksForDay(page, day) {
    return dayBlocks(page).filter((block) => block.columns.has(day));
  }

  function rowsInBlock(page, block) {
    if (!block) return [];
    return (page?.rows || [])
      .filter((row) => row.y < block.upperY - 1 && row.y > block.lowerY + 1)
      .sort((a, b) => b.y - a.y);
  }

  function labelsFor(row) {
    return (LABELS.get(clean(row.specialty)) || [clean(row.specialty)]).map(clean);
  }

  function rowMatchesLabel(row, label, catalogRow) {
    const norm = row.norm;
    const key = clean(catalogRow.specialty);
    if (!norm || !label) return false;
    if (key === 'nefrologia inhabil') return norm === 'nefrologia' || (norm.startsWith('nefrologia ') && !norm.startsWith('nefrologia habil'));
    if (key === 'reumatologia am') return norm === 'reumatologia' || (norm.startsWith('reumatologia ') && !norm.startsWith('reumatologia pm'));
    return norm === label || norm.startsWith(`${label} `);
  }

  function findRowForCatalog(blockRows, catalogRow) {
    for (const label of labelsFor(catalogRow)) {
      const match = blockRows.find((row) => rowMatchesLabel(row, label, catalogRow));
      if (match) return match;
    }
    return null;
  }

  function typicalGap(columns) {
    const xs = [...columns.values()].sort((a, b) => a - b);
    const gaps = xs.slice(1).map((value, index) => value - xs[index]).filter((gap) => gap > 10).sort((a, b) => a - b);
    return gaps.length ? gaps[Math.floor(gaps.length / 2)] : 72;
  }

  function cellForDay(row, block, day) {
    const columns = block?.columns;
    if (!columns?.has(day)) return '';
    const sorted = [...columns.entries()].sort((a, b) => a[1] - b[1]);
    const index = sorted.findIndex(([value]) => value === day);
    const x = sorted[index][1];
    const gap = typicalGap(columns);
    const left = index > 0 ? (sorted[index - 1][1] + x) / 2 : x - gap / 2;
    const right = index < sorted.length - 1 ? (x + sorted[index + 1][1]) / 2 : x + gap / 2;
    const text = row.items
      .filter((item) => {
        const center = item.x + item.width / 2;
        return center >= left && center < right;
      })
      .sort((a, b) => a.x - b.x)
      .map((item) => item.text)
      .filter((text) => !/^\d{1,2}$/.test(text))
      .join(' ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s+/g, ' ')
      .trim();
    if (/^x$/i.test(text)) return 'Sin disponibilidad registrada';
    return text.length <= 140 ? text : '';
  }

  function metaFromPages(pages) {
    return parseMonthYear((pages || []).flatMap((page) => page.rows.map((row) => row.text)).join(' '));
  }

  function observedSpecialties(pages) {
    const found = new Set();
    for (const page of pages || []) {
      for (const block of dayBlocks(page)) {
        const blockRows = rowsInBlock(page, block);
        for (const catalogRow of catalog()) {
          if (findRowForCatalog(blockRows, catalogRow)) found.add(clean(catalogRow.specialty));
        }
      }
    }
    return found;
  }

  function extractAssignments(pages, meta) {
    const out = [];
    const seen = new Set();
    for (let day = 1; day <= daysInMonth(meta.year, meta.month); day += 1) {
      for (const page of pages || []) {
        for (const block of blocksForDay(page, day)) {
          const blockRows = rowsInBlock(page, block);
          for (const catalogRow of catalog()) {
            const sourceRow = findRowForCatalog(blockRows, catalogRow);
            if (!sourceRow) continue;
            const doctor = cellForDay(sourceRow, block, day);
            if (!doctor) continue;
            const scheduleDate = dateValue(meta.year, meta.month, day);
            const key = `${scheduleDate}|${clean(catalogRow.specialty)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ specialty: catalogRow.specialty, doctor, schedule_date: scheduleDate, day_label: scheduleDate });
          }
        }
      }
    }
    return out;
  }

  function assignmentKey(row) {
    return `${row.schedule_date}|${clean(row.specialty)}|${clean(row.doctor)}`;
  }

  function assignmentFingerprint(rows) {
    return [...new Set((rows || []).map(assignmentKey))].sort().join('\n');
  }

  function validateAssignments(rows, meta, pages = null) {
    const expectedDays = daysInMonth(meta.year, meta.month);
    const uniqueDays = new Set(rows.map((row) => row.schedule_date));
    const extractedSpecialties = new Set(rows.map((row) => clean(row.specialty)));
    if (rows.length < expectedDays * 3 || uniqueDays.size < Math.max(3, expectedDays - 2) || extractedSpecialties.size < 5) {
      throw new Error('No fue seguro transformar este PDF a filas. El buscador PDF seguirá siendo el respaldo.');
    }
    if (pages) {
      const observed = observedSpecialties(pages);
      const missing = [...observed].filter((name) => !extractedSpecialties.has(name));
      if (missing.length) {
        throw new Error(`La indexación quedó incompleta (${missing.length} especialidad${missing.length === 1 ? '' : 'es'} sin filas). El PDF seguirá siendo el respaldo.`);
      }
    }
    return { rows: rows.length, days: uniqueDays.size, specialties: extractedSpecialties.size };
  }

  function isSpecialistForm(form) {
    return Boolean(form?.matches?.('[data-upload-call]') && String(form.dataset.callType || '').toLowerCase() === 'especialistas');
  }

  function statusBox(form) {
    return form?.querySelector?.('[data-calls-monthly-guard-status]') || null;
  }

  function setStatus(form, message, error = false) {
    const box = statusBox(form);
    if (!box) return;
    box.className = error ? 'sb-error' : 'sb-ok';
    box.textContent = message;
  }

  async function latestDocument() {
    const docs = await window.CRS_SUPABASE?.fetchDocuments?.(['llamados']);
    return (docs || []).find((doc) => doc.key === 'especialistas' && doc.status === 'published') || null;
  }

  async function waitForPublished(meta, startedAt) {
    for (let attempt = 0; attempt < 28; attempt += 1) {
      const doc = await latestDocument();
      const docMeta = parseMonthYear(doc?.title || doc?.file_name || '');
      const updated = Date.parse(doc?.updated_at || doc?.updatedAt || 0);
      if (doc && docMeta?.year === meta.year && docMeta?.month === meta.month && updated >= startedAt - 2500) return doc;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('No pude confirmar la publicación nueva; no se tocó la base estructurada.');
  }

  async function replaceMonth(rows, meta, doc) {
    const api = window.CRS_SUPABASE?.client?.();
    if (!api) throw new Error('Supabase no está disponible para indexar la rotativa.');
    const { data: userData, error: userError } = await api.auth.getUser();
    if (userError) throw userError;
    const user = userData?.user;
    if (!user) throw new Error('Se necesita sesión de Jefatura para indexar la rotativa.');
    const first = dateValue(meta.year, meta.month, 1);
    const last = dateValue(meta.year, meta.month, daysInMonth(meta.year, meta.month));
    const { error: deleteError } = await api.from(TABLE).delete().eq('type', 'especialistas').gte('schedule_date', first).lte('schedule_date', last);
    if (deleteError) throw deleteError;
    const payload = rows.map((row) => ({
      type: 'especialistas',
      title: meta.label,
      specialty: row.specialty,
      day_label: row.day_label,
      doctor: row.doctor,
      phone: null,
      url: doc.url || '',
      file_path: doc.file_path || null,
      file_name: doc.file_name || null,
      file_type: doc.file_type || null,
      file_size: doc.file_size || null,
      status: 'published',
      created_by: user.id,
      created_by_email: user.email || '',
      schedule_date: row.schedule_date,
      source_document_key: 'especialistas',
      source_updated_at: doc.updated_at || doc.updatedAt || new Date().toISOString()
    }));
    for (let start = 0; start < payload.length; start += 250) {
      const { error } = await api.from(TABLE).insert(payload.slice(start, start + 250));
      if (error) throw error;
    }
  }

  async function indexPending(form, pending) {
    if (!pending || pending.running) return;
    pending.running = true;
    try {
      setStatus(form, 'Validando, publicando e indexando la rotativa mensual…');
      const pages = await extractPages(pending.file);
      const meta = metaFromPages(pages);
      if (!meta) throw new Error('No pude identificar mes y año dentro del PDF para indexarlo.');
      const rows = extractAssignments(pages, meta);
      validateAssignments(rows, meta, pages);
      const doc = await waitForPublished(meta, pending.startedAt);
      await replaceMonth(rows, meta, doc);
      currentDoc = doc;
      currentMeta = meta;
      cachedRows = rows.map((row) => ({ ...row, title: meta.label, url: doc.url || '' }));
      loadPromise = null;
      setStatus(form, `Rotativa publicada e indexada: ${rows.length} asignaciones estructuradas para ${meta.label}.`);
      window.dispatchEvent(new CustomEvent('crs:calls-structured-updated', { detail: { month: meta.label, count: rows.length } }));
    } catch (error) {
      console.error('No se pudo indexar la rotativa estructurada', error);
      setStatus(form, `${error?.message || 'No se pudo indexar la rotativa.'} El PDF vigente sigue disponible como respaldo.`, true);
    } finally {
      pendingUploads.delete(form);
    }
  }

  document.addEventListener('change', (event) => {
    const input = event.target;
    const form = input?.form;
    if (!isSpecialistForm(form) || input.type !== 'file') return;
    const file = input.files?.[0];
    if (file) pendingUploads.set(form, { file, startedAt: 0, running: false });
    else pendingUploads.delete(form);
  }, true);

  document.addEventListener('click', (event) => {
    const submit = event.target.closest?.('button[type="submit"],input[type="submit"]');
    const form = submit?.form;
    if (!isSpecialistForm(form)) return;
    const pending = pendingUploads.get(form);
    if (!pending || pending.running) return;
    pending.startedAt = Date.now();
    window.setTimeout(() => indexPending(form, pending), 0);
  }, true);

  function aliasesFor(row) {
    const blocked = BLOCKED_ALIASES.get(clean(row.specialty));
    return (row.aliases || []).filter((alias) => !blocked?.has(clean(alias)));
  }

  function wholePhrase(text, phrase) {
    return Boolean(clean(phrase)) && ` ${clean(text)} `.includes(` ${clean(phrase)} `);
  }

  function tokenPrefixMatch(text, query) {
    const haystack = tokens(text);
    const wanted = tokens(query);
    return wanted.length > 0 && wanted.every((needle) => needle.length >= 2 && haystack.some((word) => word.startsWith(needle)));
  }

  function termScore(query, term) {
    const q = clean(query);
    const t = clean(term);
    if (!q || !t) return 0;
    if (q === t) return 1000;
    if (wholePhrase(t, q)) return 900;
    if (tokenPrefixMatch(t, q)) return 700;
    return 0;
  }

  function specialtiesForQuery(query) {
    const q = clean(query);
    if (!q) return [];
    return catalog().map((row, index) => {
      let score = termScore(q, row.specialty);
      if (score) score += 120;
      aliasesFor(row).forEach((alias) => { score = Math.max(score, termScore(q, alias)); });
      return { row, index, score };
    }).filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ row }) => row);
  }

  function minimumStructuredSpecialties() {
    return Math.max(5, Math.ceil(catalog().length * 0.6));
  }

  function structuredRowsHealthy(rows) {
    const specialties = new Set((rows || []).map((row) => clean(row.specialty)));
    return rows.length >= 1 && specialties.size >= minimumStructuredSpecialties();
  }

  async function loadRows(force = false) {
    if (cachedRows && !force) return cachedRows;
    if (loadPromise && !force) return loadPromise;
    loadPromise = (async () => {
      const doc = await latestDocument();
      const meta = parseMonthYear(doc?.title || doc?.file_name || '');
      if (!doc || !meta) return [];
      const api = window.CRS_SUPABASE?.client?.();
      if (!api) return [];
      const first = dateValue(meta.year, meta.month, 1);
      const last = dateValue(meta.year, meta.month, daysInMonth(meta.year, meta.month));
      const { data, error } = await api.from(TABLE)
        .select('specialty,doctor,schedule_date,day_label,title,url,source_updated_at')
        .eq('type', 'especialistas')
        .eq('status', 'published')
        .gte('schedule_date', first)
        .lte('schedule_date', last)
        .order('schedule_date', { ascending: true });
      if (error) throw error;
      const rows = data || [];
      if (!structuredRowsHealthy(rows)) {
        console.warn('Base estructurada incompleta; se mantiene el lector PDF como respaldo.');
        currentDoc = null;
        currentMeta = null;
        cachedRows = [];
        return cachedRows;
      }
      currentDoc = doc;
      currentMeta = meta;
      cachedRows = rows;
      return cachedRows;
    })().finally(() => { loadPromise = null; });
    return loadPromise;
  }

  function resultsFor(query, selectedDate, rows = cachedRows || []) {
    const selected = specialtiesForQuery(query);
    const names = new Set(selected.map((row) => clean(row.specialty)));
    if (!names.size) return [];
    const out = [];
    const seen = new Set();
    rows.forEach((row) => {
      if (row.schedule_date !== selectedDate || !names.has(clean(row.specialty))) return;
      const key = `${clean(row.specialty)}|${clean(row.doctor)}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        specialty: row.specialty,
        doctor: row.doctor || 'Sin disponibilidad registrada',
        date: selectedDate,
        dateLabel: formatDate(selectedDate)
      });
    });
    return out.slice(0, 4);
  }

  function buildCard(result) {
    const unavailable = result.doctor === 'Sin disponibilidad registrada';
    const card = document.createElement('article');
    card.className = `on-call-result on-call-live-result calls-live-card calls-structured-card ${unavailable ? 'unavailable' : 'available'}`;
    const head = document.createElement('div');
    head.className = 'on-call-result-head';
    const specialty = document.createElement('span');
    specialty.className = 'on-call-specialty';
    specialty.textContent = result.specialty;
    head.append(specialty);
    const doctor = document.createElement('strong');
    doctor.textContent = result.doctor;
    const date = document.createElement('p');
    date.textContent = result.dateLabel || formatDate(result.date);
    card.append(head, doctor, date);
    return card;
  }

  function mountStructuredSearch() {
    if (mounting || route() !== ROUTE || !cachedRows?.length || !currentMeta) return;
    const panel = document.querySelector('#callsSearchPanel');
    if (!panel || panel.querySelector('[data-calls-structured-search]')) return;
    mounting = true;
    try {
      const now = new Date();
      const defaultDate = now.getFullYear() === currentMeta.year && now.getMonth() + 1 === currentMeta.month
        ? localDateValue(now)
        : dateValue(currentMeta.year, currentMeta.month, 1);
      panel.replaceChildren();
      const shell = document.createElement('section');
      shell.className = 'on-call-search on-call-live';
      shell.dataset.callsStructuredSearch = 'true';
      const source = document.createElement('div');
      source.className = 'on-call-live-source';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = currentMeta.label;
      const span = document.createElement('span');
      span.textContent = 'Rotativa vigente · Jefatura';
      copy.append(strong, span);
      const badge = document.createElement('span');
      badge.className = 'calls-structured-badge';
      badge.textContent = '✓ Base estructurada';
      source.append(copy, badge);

      const controls = document.createElement('div');
      controls.className = 'on-call-controls';
      const dateLabel = document.createElement('label');
      dateLabel.className = 'on-call-field';
      dateLabel.innerHTML = '<span>Fecha consultada</span>';
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = defaultDate;
      dateInput.min = dateValue(currentMeta.year, currentMeta.month, 1);
      dateInput.max = dateValue(currentMeta.year, currentMeta.month, daysInMonth(currentMeta.year, currentMeta.month));
      dateLabel.append(dateInput);
      const queryLabel = document.createElement('label');
      queryLabel.className = 'on-call-field';
      queryLabel.innerHTML = '<span>Buscar especialidad</span>';
      const queryInput = document.createElement('input');
      queryInput.type = 'search';
      queryInput.placeholder = 'Ej: cardiología, infectología, uro...';
      queryInput.autocomplete = 'off';
      queryLabel.append(queryInput);
      controls.append(dateLabel, queryLabel);

      const status = document.createElement('div');
      status.className = 'on-call-live-status';
      status.setAttribute('aria-live', 'polite');
      const results = document.createElement('div');
      results.className = 'on-call-results';
      const note = document.createElement('p');
      note.className = 'calls-structured-note';
      note.textContent = 'Consulta filas confirmadas de la rotativa mensual. El Documento global queda disponible como respaldo visual.';
      shell.append(source, controls, status, results, note);
      panel.append(shell);

      const render = () => {
        results.replaceChildren();
        const query = queryInput.value.trim();
        if (!query) {
          status.textContent = '';
          return;
        }
        const found = resultsFor(query, dateInput.value);
        if (!found.length) {
          status.textContent = 'No encontré esa especialidad para la fecha seleccionada en la base estructurada vigente.';
          return;
        }
        status.textContent = '';
        found.forEach((item) => results.append(buildCard(item)));
      };
      queryInput.addEventListener('input', render);
      dateInput.addEventListener('change', render);
    } finally {
      mounting = false;
    }
  }

  async function prepareRoute(force = false) {
    if (route() !== ROUTE) return;
    try {
      const rows = await loadRows(force);
      if (!rows.length) return;
      mountStructuredSearch();
      const panel = document.querySelector('#callsSearchPanel');
      if (panel && !panelObserver) {
        panelObserver = new MutationObserver(() => {
          if (route() === ROUTE && cachedRows?.length && !panel.querySelector('[data-calls-structured-search]')) {
            setTimeout(mountStructuredSearch, 0);
          }
        });
        panelObserver.observe(panel, { childList: true, subtree: false });
      }
    } catch (error) {
      console.warn('Rotativa estructurada no disponible; se mantiene el lector PDF.', error);
    }
  }

  async function searchToday(query) {
    const rows = await loadRows();
    if (!rows.length || !currentMeta) return [];
    const today = localDateValue();
    const [year, month] = today.split('-').map(Number);
    if (year !== currentMeta.year || month !== currentMeta.month) return [];
    return resultsFor(query, today, rows);
  }

  async function extractPublished(url, title = '') {
    const pages = await extractPagesFromUrl(url);
    const meta = parseMonthYear(title) || metaFromPages(pages);
    if (!meta) throw new Error('No pude identificar mes y año dentro del PDF.');
    const rows = extractAssignments(pages, meta);
    const health = validateAssignments(rows, meta, pages);
    return {
      meta,
      rows,
      health,
      observedSpecialties: [...observedSpecialties(pages)].sort()
    };
  }

  window.CRS_STRUCTURED_CALLS = Object.freeze({
    parseMonthYear,
    extractAssignments,
    extractPublished,
    validateAssignments,
    assignmentFingerprint,
    specialtiesForQuery,
    searchToday,
    loadRows,
    version: 3
  });

  window.addEventListener('hashchange', () => setTimeout(() => prepareRoute(), 80));
  window.addEventListener('crs:ui-section-ready', () => setTimeout(() => prepareRoute(), 120));
  window.addEventListener('crs:calls-structured-updated', () => {
    cachedRows = null;
    currentDoc = null;
    currentMeta = null;
    prepareRoute(true);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prepareRoute(), { once: true });
  else prepareRoute();
})();
