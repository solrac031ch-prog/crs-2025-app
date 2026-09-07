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
  const BLOCKED_ALIASES = new Map([
    ['urologia', new Set(['renal'])]
  ]);

  let currentDoc = null;
  let currentMeta = null;
  let cachedRows = null;
  let cachePromise = null;
  let panelObserver = null;
  let mounting = false;

  const clean = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = (value) => clean(value).split(' ').filter(Boolean);
  const catalog = () => window.CRS_APP_OPERATIONAL?.onCallSchedule?.rows || [];
  const currentRoute = () => String(location.hash || '#/inicio').split('?')[0];

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function dateValue(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function localDateValue(date = new Date()) {
    return dateValue(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

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

  async function extractPages(file) {
    const lib = await pdfJs();
    const buffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push({ pageNo, rows: groupRows(content.items) });
    }
    return pages;
  }

  function dayBlocks(page) {
    const headers = page.rows
      .map((row) => {
        const columns = new Map();
        row.items.forEach((item) => {
          if (!/^\d{1,2}$/.test(item.text)) return;
          const day = Number(item.text);
          if (!Number.isInteger(day) || day < 1 || day > 31 || columns.has(day)) return;
          columns.set(day, item.x + item.width / 2);
        });
        return { y: row.y, row, columns };
      })
      .filter(({ columns }) => columns.size >= 3)
      .sort((a, b) => b.y - a.y);

    return headers.map((header, index) => ({
      ...header,
      upperY: header.y,
      lowerY: headers[index + 1]?.y ?? -Infinity
    }));
  }

  function blockForDay(page, day) {
    return dayBlocks(page).find((block) => block.columns.has(day)) || null;
  }

  function rowsInBlock(page, block) {
    if (!block) return [];
    return page.rows.filter((row) => row.y < block.upperY - 1 && row.y > block.lowerY + 1).sort((a, b) => b.y - a.y);
  }

  function labelsFor(catalogRow) {
    const key = clean(catalogRow.specialty);
    return (LABELS.get(key) || [key]).map(clean);
  }

  function rowMatchesLabel(row, label, catalogRow) {
    const norm = row.norm;
    if (!norm || !label) return false;
    const key = clean(catalogRow.specialty);
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
    const gaps = xs.slice(1).map((value, index) => value - xs[index]).filter((gap) => gap > 10);
    if (!gaps.length) return 72;
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)];
  }

  function cleanCellText(value) {
    return String(value || '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+/g, ' ').trim();
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
    const parts = row.items
      .filter((item) => {
        const center = item.x + item.width / 2;
        return center >= left && center < right;
      })
      .sort((a, b) => a.x - b.x)
      .map((item) => item.text)
      .filter((text) => !/^\d{1,2}$/.test(text));
    const text = cleanCellText(parts.join(' '));
    if (/^x$/i.test(text)) return 'Sin disponibilidad registrada';
    if (text.length > 140) return '';
    return text;
  }

  function extractAssignments(pages, meta) {
    const rows = [];
    const seen = new Set();
    for (let day = 1; day <= daysInMonth(meta.year, meta.month); day += 1) {
      for (const page of pages || []) {
        const block = blockForDay(page, day);
        if (!block) continue;
        const blockRows = rowsInBlock(page, block);
        for (const catalogRow of catalog()) {
          const row = findRowForCatalog(blockRows, catalogRow);
          if (!row) continue;
          const doctor = cellForDay(row, block, day);
          if (!doctor) continue;
          const scheduleDate = dateValue(meta.year, meta.month, day);
          const key = `${scheduleDate}|${clean(catalogRow.specialty)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ specialty: catalogRow.specialty, doctor, schedule_date: scheduleDate, day_label: scheduleDate });
        }
      }
    }
    return rows;
  }

  function validateAssignments(rows, meta) {
    const uniqueDays = new Set(rows.map((row) => row.schedule_date));
    const uniqueSpecialties = new Set(rows.map((row) => clean(row.specialty)));
    const expectedDays = daysInMonth(meta.year, meta.month);
    if (rows.length < expectedDays * 3 || uniqueDays.size < Math.max(3, expectedDays - 2) || uniqueSpecialties.size < 5) {
      throw new Error('La rotativa se publicó, pero no fue seguro transformarla a filas estructuradas. El buscador PDF seguirá disponible.');
    }
  }

  function statusBox(form) {
    return form?.querySelector?.('[data-calls-monthly-guard-status]') || null;
  }

  function setIndexStatus(form, message, error = false) {
    const box = statusBox(form);
    if (!box) return;
    box.className = error ? 'sb-error' : 'sb-ok';
    box.textContent = message;
  }

  async function waitForPublished(label, startedAt) {
    for (let attempt = 0; attempt < 28; attempt += 1) {
      const docs = await window.CRS_SUPABASE?.fetchDocuments?.(['llamados']);
      const doc = (docs || []).find((item) => item.key === 'especialistas' && item.status === 'published');
      const updated = Date.parse(doc?.updated_at || doc?.updatedAt || 0);
      if (doc && clean(doc.title) === clean(label) && updated >= startedAt - 2500) return doc;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('No pude confirmar la publicación nueva antes de indexarla.');
  }

  async function replaceMonth(rows, meta, doc) {
    const api = window.CRS_SUPABASE?.client?.();
    if (!api) throw new Error('Supabase no está disponible para indexar la rotativa.');
    const { data: userData } = await api.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error('Se necesita sesión de Jefatura para indexar la rotativa.');

    const first = dateValue(meta.year, meta.month, 1);
    const last = dateValue(meta.year, meta.month, daysInMonth(meta.year, meta.month));
    const { error: deleteError } = await api
      .from(TABLE)
      .delete()
      .eq('type', 'especialistas')
      .gte('schedule_date', first)
      .lte('schedule_date', last);
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
      source_updated_at: doc.updated_at || new Date().toISOString()
    }));

    for (let start = 0; start < payload.length; start += 250) {
      const { error } = await api.from(TABLE).insert(payload.slice(start, start + 250));
      if (error) throw error;
    }
  }

  async function indexUploadedFile(file, label, form, startedAt) {
    setIndexStatus(form, `PDF validado: ${label}. Publicando e indexando la rotativa…`);
    try {
      const [pages, doc] = await Promise.all([extractPages(file), waitForPublished(label, startedAt)]);
      const meta = parseMonthYear(label) || parseMonthYear(doc.title);
      if (!meta) throw new Error('No pude identificar el mes de la rotativa publicada.');
      const rows = extractAssignments(pages, meta);
      validateAssignments(rows, meta);
      await replaceMonth(rows, meta, doc);
      currentDoc = doc;
      currentMeta = meta;
      cachedRows = rows.map((row) => ({ ...row, title: meta.label, url: doc.url || '' }));
      cachePromise = null;
      setIndexStatus(form, `Rotativa publicada e indexada: ${rows.length} asignaciones estructuradas para ${meta.label}.`);
      window.dispatchEvent(new CustomEvent('crs:calls-structured-updated', { detail: { month: meta.label, count: rows.length } }));
    } catch (error) {
      console.error('No se pudo indexar la rotativa estructurada', error);
      setIndexStatus(form, `${error?.message || 'No se pudo indexar la rotativa.'} El PDF publicado se mantiene como respaldo.`, true);
    }
  }

  function isSpecialistUpload(form) {
    return Boolean(form?.matches?.('[data-upload-call]') && String(form.dataset.callType || '').toLowerCase() === 'especialistas');
  }

  // Este listener se carga entre el guard mensual y el backend. La primera
  // sumisión inválida queda detenida por el guard; aquí sólo llega la segunda,
  // ya validada, antes de que el backend haga reset del input file.
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!isSpecialistUpload(form)) return;
    const file = form.file?.files?.[0] || form.querySelector('input[type="file"]')?.files?.[0] || null;
    if (!file) return;
    const label = form.querySelector('[name="title"]')?.value || form.dataset.callsMonthlyLabel || '';
    const startedAt = Date.now();
    const fileRef = file;
    window.setTimeout(() => indexUploadedFile(fileRef, label, form, startedAt), 0);
  }, true);

  function aliasesFor(row) {
    const blocked = BLOCKED_ALIASES.get(clean(row.specialty));
    return (row.aliases || []).filter((alias) => !blocked?.has(clean(alias)));
  }

  function wholePhrase(text, phrase) {
    const haystack = ` ${clean(text)} `;
    const needle = ` ${clean(phrase)} `;
    return Boolean(clean(phrase)) && haystack.includes(needle);
  }

  function tokenPrefixMatch(text, query) {
    const haystack = tokens(text);
    const wanted = tokens(query);
    if (!wanted.length) return false;
    return wanted.every((needle) => needle.length >= 2 && haystack.some((word) => word.startsWith(needle)));
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

  function specialtyScore(row, query) {
    let score = termScore(query, row.specialty);
    if (score) score += 120;
    aliasesFor(row).forEach((alias) => { score = Math.max(score, termScore(query, alias)); });
    return score;
  }

  function specialtiesForQuery(query) {
    const q = clean(query);
    if (!q) return [];
    return catalog()
      .map((row, index) => ({ row, index, score: specialtyScore(row, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ row }) => row);
  }

  async function latestDocument() {
    const docs = await window.CRS_SUPABASE?.fetchDocuments?.(['llamados']);
    return (docs || []).find((doc) => doc.key === 'especialistas' && doc.status === 'published') || null;
  }

  async function loadRows(force = false) {
    if (cachedRows && !force) return cachedRows;
    if (cachePromise && !force) return cachePromise;
    cachePromise = (async () => {
      const doc = await latestDocument();
      const meta = parseMonthYear(doc?.title || doc?.file_name || '');
      if (!doc || !meta) return [];
      const api = window.CRS_SUPABASE?.client?.();
      if (!api) return [];
      const first = dateValue(meta.year, meta.month, 1);
      const last = dateValue(meta.year, meta.month, daysInMonth(meta.year, meta.month));
      const { data, error } = await api
        .from(TABLE)
        .select('specialty,doctor,schedule_date,day_label,title,url,source_updated_at')
        .eq('type', 'especialistas')
        .eq('status', 'published')
        .gte('schedule_date', first)
        .lte('schedule_date', last)
        .order('schedule_date', { ascending: true });
      if (error) {
        if (/schedule_date|column/i.test(String(error.message || ''))) return [];
        throw error;
      }
      currentDoc = doc;
      currentMeta = meta;
      cachedRows = data || [];
      return cachedRows;
    })().finally(() => { cachePromise = null; });
    return cachePromise;
  }

  function resultsFor(query, selectedDate, rows = cachedRows || []) {
    const selected = specialtiesForQuery(query);
    if (!selected.length) return [];
    const names = new Set(selected.map((row) => clean(row.specialty)));
    const exactDate = String(selectedDate || '');
    const out = [];
    const seen = new Set();
    rows.forEach((row) => {
      if (row.schedule_date !== exactDate || !names.has(clean(row.specialty))) return;
      const key = `${clean(row.specialty)}|${clean(row.doctor)}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ specialty: row.specialty, doctor: row.doctor || 'Sin disponibilidad registrada', date: exactDate, dateLabel: formatDate(exactDate) });
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
    if (mounting || currentRoute() !== ROUTE || !cachedRows?.length || !currentMeta) return;
    const panel = document.querySelector('#callsSearchPanel');
    if (!panel) return;
    if (panel.querySelector('[data-calls-structured-search]')) return;
    mounting = true;
    try {
      const now = new Date();
      const inMonth = now.getFullYear() === currentMeta.year && now.getMonth() + 1 === currentMeta.month;
      const defaultDate = inMonth ? localDateValue(now) : dateValue(currentMeta.year, currentMeta.month, 1);
      const min = dateValue(currentMeta.year, currentMeta.month, 1);
      const max = dateValue(currentMeta.year, currentMeta.month, daysInMonth(currentMeta.year, currentMeta.month));

      panel.replaceChildren();
      const shell = document.createElement('section');
      shell.className = 'on-call-search on-call-live';
      shell.dataset.callsStructuredSearch = 'true';

      const source = document.createElement('div');
      source.className = 'on-call-live-source';
      const sourceCopy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = currentMeta.label;
      const span = document.createElement('span');
      span.textContent = 'Rotativa vigente · Jefatura';
      sourceCopy.append(strong, span);
      const badge = document.createElement('span');
      badge.className = 'calls-structured-badge';
      badge.textContent = '✓ Base estructurada';
      source.append(sourceCopy, badge);

      const controls = document.createElement('div');
      controls.className = 'on-call-controls';
      const dateLabel = document.createElement('label');
      dateLabel.className = 'on-call-field';
      const dateCaption = document.createElement('span');
      dateCaption.textContent = 'Fecha consultada';
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = defaultDate;
      dateInput.min = min;
      dateInput.max = max;
      dateLabel.append(dateCaption, dateInput);
      const queryLabel = document.createElement('label');
      queryLabel.className = 'on-call-field';
      const queryCaption = document.createElement('span');
      queryCaption.textContent = 'Buscar especialidad';
      const queryInput = document.createElement('input');
      queryInput.type = 'search';
      queryInput.placeholder = 'Ej: cardiología, infectología, uro...';
      queryInput.autocomplete = 'off';
      queryLabel.append(queryCaption, queryInput);
      controls.append(dateLabel, queryLabel);

      const status = document.createElement('div');
      status.className = 'on-call-live-status';
      status.setAttribute('aria-live', 'polite');
      const results = document.createElement('div');
      results.className = 'on-call-results';
      const note = document.createElement('p');
      note.className = 'calls-structured-note';
      note.textContent = 'Consulta primero filas confirmadas de la rotativa mensual. El Documento global queda disponible como respaldo visual.';
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
    if (currentRoute() !== ROUTE) return;
    try {
      const rows = await loadRows(force);
      if (!rows.length) return;
      mountStructuredSearch();
      const panel = document.querySelector('#callsSearchPanel');
      if (panel && !panelObserver) {
        panelObserver = new MutationObserver(() => {
          if (currentRoute() === ROUTE && cachedRows?.length && !panel.querySelector('[data-calls-structured-search]')) {
            window.setTimeout(mountStructuredSearch, 0);
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

  window.CRS_STRUCTURED_CALLS = Object.freeze({
    parseMonthYear,
    extractAssignments,
    specialtiesForQuery,
    searchToday,
    loadRows,
    version: 1
  });

  window.addEventListener('hashchange', () => window.setTimeout(() => prepareRoute(), 80));
  window.addEventListener('crs:ui-section-ready', () => window.setTimeout(() => prepareRoute(), 120));
  window.addEventListener('crs:calls-structured-updated', () => {
    cachedRows = null;
    currentDoc = null;
    currentMeta = null;
    prepareRoute(true);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prepareRoute(), { once: true });
  else prepareRoute();
})();
