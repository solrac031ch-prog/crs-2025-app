(() => {
  const TABLE = 'crs_call_schedules';
  const ROUTE = '#/jefatura';
  let observer = null;
  let running = false;

  const route = () => String(location.hash || '#/inicio').split('?')[0];
  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const dateValue = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  function specialistForm() {
    return document.querySelector('[data-upload-call][data-call-type="especialistas"]');
  }

  function structuredApi() {
    return window.CRS_STRUCTURED_CALLS || null;
  }

  async function latestDocument() {
    const docs = await window.CRS_SUPABASE?.fetchDocuments?.(['llamados']);
    return (docs || []).find((doc) => doc.key === 'especialistas' && doc.status === 'published') || null;
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
      row.norm = String(row.text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    });
    rows.sort((a, b) => b.y - a.y);
    return rows;
  }

  async function pagesFromPublishedDocument(doc) {
    if (!doc?.url) throw new Error('La rotativa vigente no tiene un PDF público asociado.');
    const response = await fetch(doc.url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No pude descargar el PDF vigente (${response.status}).`);
    const lib = await pdfJs();
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdf = await lib.getDocument({ data: bytes }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push({ pageNo, rows: groupRows(content.items) });
    }
    return pages;
  }

  function inferMeta(doc, pages) {
    const api = structuredApi();
    const direct = api?.parseMonthYear?.(doc?.title || doc?.file_name || '');
    if (direct) return direct;
    const text = (pages || []).flatMap((page) => page.rows.map((row) => row.text)).join(' ');
    return api?.parseMonthYear?.(text) || null;
  }

  function validateAssignments(rows, meta) {
    const expected = daysInMonth(meta.year, meta.month);
    const uniqueDays = new Set(rows.map((row) => row.schedule_date));
    const specialties = new Set(rows.map((row) => String(row.specialty || '').toLowerCase()));
    if (rows.length < expected * 3 || uniqueDays.size < Math.max(3, expected - 2) || specialties.size < 5) {
      throw new Error('No fue seguro transformar el PDF vigente a filas. No se modificó la base estructurada.');
    }
    const coverage = structuredApi()?.coverageFor?.(rows);
    if (!coverage?.complete) {
      const detail = coverage ? ` (${coverage.present}/${coverage.expected} especialidades reconocidas)` : '';
      throw new Error(`La extracción estructurada quedó incompleta${detail}. No se modificó la base estructurada.`);
    }
  }

  async function currentRows(api, meta) {
    const first = dateValue(meta.year, meta.month, 1);
    const last = dateValue(meta.year, meta.month, daysInMonth(meta.year, meta.month));
    const { data, error } = await api.from(TABLE)
      .select('id,specialty,source_updated_at')
      .eq('type', 'especialistas')
      .gte('schedule_date', first)
      .lte('schedule_date', last);
    if (error) throw error;
    return data || [];
  }

  function alreadyCurrent(rows, meta, doc) {
    const minimum = daysInMonth(meta.year, meta.month) * 3;
    if (rows.length < minimum) return false;
    const coverage = structuredApi()?.coverageFor?.(rows);
    if (!coverage?.complete) return false;
    const sourceTime = Date.parse(doc?.updated_at || doc?.updatedAt || 0);
    if (!sourceTime) return true;
    return rows.every((row) => Date.parse(row.source_updated_at || 0) >= sourceTime - 1000);
  }

  async function replaceMonth(api, rows, meta, doc, user) {
    const first = dateValue(meta.year, meta.month, 1);
    const last = dateValue(meta.year, meta.month, daysInMonth(meta.year, meta.month));
    const { error: deleteError } = await api.from(TABLE)
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
      source_updated_at: doc.updated_at || doc.updatedAt || new Date().toISOString()
    }));

    for (let start = 0; start < payload.length; start += 250) {
      const { error } = await api.from(TABLE).insert(payload.slice(start, start + 250));
      if (error) throw error;
    }
  }

  function statusNode() {
    return document.querySelector('[data-calls-structured-backfill-status]');
  }

  function setStatus(message, error = false, ok = false) {
    const node = statusNode();
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('sb-error', Boolean(error));
    node.classList.toggle('sb-ok', Boolean(ok));
  }

  async function indexCurrentPublished() {
    if (running) return { status: 'running' };
    running = true;
    const button = document.querySelector('[data-calls-structured-backfill]');
    if (button) button.disabled = true;
    try {
      const api = window.CRS_SUPABASE?.client?.();
      if (!api) throw new Error('Supabase no está disponible.');
      const structured = structuredApi();
      if (!structured?.extractAssignments || !structured?.parseMonthYear || !structured?.coverageFor) {
        throw new Error('El indexador estructurado todavía no está listo. Recarga la página e intenta otra vez.');
      }
      const { data: userData, error: userError } = await api.auth.getUser();
      if (userError) throw userError;
      const user = userData?.user;
      if (!user) throw new Error('Inicia sesión en Jefatura para construir la base estructurada.');

      setStatus('Descargando y validando la rotativa vigente…');
      const doc = await latestDocument();
      if (!doc) throw new Error('No encontré una rotativa de especialistas publicada.');
      const pages = await pagesFromPublishedDocument(doc);
      const meta = inferMeta(doc, pages);
      if (!meta) throw new Error('No pude identificar mes y año dentro del PDF vigente.');

      const existing = await currentRows(api, meta);
      if (alreadyCurrent(existing, meta, doc)) {
        setStatus(`La base estructurada de ${meta.label} ya está al día (${existing.length} asignaciones).`, false, true);
        return { status: 'current', count: existing.length, meta };
      }

      const rows = structured.extractAssignments(pages, meta);
      validateAssignments(rows, meta);
      setStatus(`PDF validado. Guardando ${rows.length} asignaciones de ${meta.label}…`);
      await replaceMonth(api, rows, meta, doc, user);
      await structured.loadRows?.(true);
      window.dispatchEvent(new CustomEvent('crs:calls-structured-updated', { detail: { month: meta.label, count: rows.length, backfill: true } }));
      setStatus(`✓ Base estructurada lista: ${rows.length} asignaciones para ${meta.label}.`, false, true);
      return { status: 'indexed', count: rows.length, meta };
    } catch (error) {
      console.error('No se pudo indexar la rotativa vigente', error);
      setStatus(`${error?.message || 'No se pudo construir la base estructurada.'} El PDF vigente sigue intacto como respaldo.`, true);
      throw error;
    } finally {
      running = false;
      if (button) button.disabled = false;
    }
  }

  function mount() {
    if (route() !== ROUTE) return;
    const form = specialistForm();
    if (!form || document.querySelector('[data-calls-structured-backfill-wrap]')) return;

    const wrap = document.createElement('div');
    wrap.dataset.callsStructuredBackfillWrap = 'true';
    wrap.className = 'calls-structured-backfill';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'document-button';
    button.dataset.callsStructuredBackfill = 'true';
    button.textContent = 'Construir base estructurada desde PDF vigente';
    button.addEventListener('click', () => indexCurrentPublished().catch(() => {}));

    const status = document.createElement('div');
    status.dataset.callsStructuredBackfillStatus = 'true';
    status.className = 'calls-structured-backfill-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Úsalo una vez para convertir la rotativa ya publicada a filas consultables. No reemplaza el PDF.';

    wrap.append(button, status);
    form.insertAdjacentElement('afterend', wrap);
  }

  function boot() {
    mount();
    if (!observer && document.body) {
      observer = new MutationObserver(() => mount());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.CRS_CALLS_BACKFILL = Object.freeze({ indexCurrentPublished, mount, version: 2 });
  window.addEventListener('hashchange', () => setTimeout(mount, 60));
  window.addEventListener('crs:ui-section-ready', () => setTimeout(mount, 100));
  window.addEventListener('crs:supabase-ready', () => setTimeout(mount, 100));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();