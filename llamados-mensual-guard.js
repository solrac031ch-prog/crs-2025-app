(() => {
  const MONTHS = new Map([
    ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5], ["junio", 6],
    ["julio", 7], ["agosto", 8], ["septiembre", 9], ["setiembre", 9], ["octubre", 10], ["noviembre", 11], ["diciembre", 12]
  ]);
  const MONTH_LABELS = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const clean = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function parseMonthYear(text) {
    const normalized = clean(text);
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
      const existing = document.querySelector("script[data-pdfjs]");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.pdfjsLib), { once: true });
        existing.addEventListener("error", () => reject(new Error("No se pudo cargar el lector del PDF.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.dataset.pdfjs = "true";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = () => reject(new Error("No se pudo cargar el lector del PDF."));
      document.head.append(script);
    }).then((lib) => {
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      }
      return lib;
    });
  }

  function groupRows(rawItems) {
    const rows = [];
    const items = (rawItems || [])
      .filter((item) => String(item.str || "").trim())
      .map((item) => ({
        text: String(item.str || "").trim(),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0)
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    for (const item of items) {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.6);
      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }
      row.items.push(item);
    }

    rows.forEach((row) => {
      row.items.sort((a, b) => a.x - b.x);
      row.text = row.items.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim();
      row.norm = clean(row.text);
    });
    rows.sort((a, b) => b.y - a.y);
    return rows;
  }

  function headerDays(row) {
    const values = [];
    row.items.forEach((item) => {
      if (!/^\d{1,2}$/.test(item.text)) return;
      const day = Number(item.text);
      if (Number.isInteger(day) && day >= 1 && day <= 31 && !values.includes(day)) values.push(day);
    });
    return values;
  }

  function catalogLabels() {
    const rows = window.CRS_APP_OPERATIONAL?.onCallSchedule?.rows || [];
    return rows
      .map((row) => clean(row?.specialty))
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index);
  }

  function observedSpecialties(rows) {
    const labels = catalogLabels();
    return labels.filter((label) => rows.some((row) => row.norm === label || row.norm.startsWith(`${label} `)));
  }

  async function validateFile(file) {
    if (!file) throw new Error("Selecciona el PDF mensual antes de publicar.");
    if (!/pdf/i.test(`${file.type || ""} ${file.name || ""}`)) {
      throw new Error("La rotativa de especialistas debe cargarse en formato PDF.");
    }

    const lib = await pdfJs();
    let pdf;
    try {
      const buffer = await file.arrayBuffer();
      pdf = await lib.getDocument({ data: new Uint8Array(buffer) }).promise;
    } catch (error) {
      throw new Error("El archivo no pudo leerse como PDF. Se mantuvo la rotativa vigente anterior.");
    }

    const allRows = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      allRows.push(...groupRows(content.items));
    }

    const documentText = allRows.map((row) => row.text).join(" ");
    const meta = parseMonthYear(documentText);
    if (!meta) {
      throw new Error("No pude identificar mes y año dentro del PDF. No se reemplazó la rotativa vigente.");
    }

    const headers = allRows
      .map((row) => ({ row, days: headerDays(row) }))
      .filter(({ days }) => days.length >= 3);
    const foundDays = new Set(headers.flatMap(({ days }) => days));
    const expectedLastDay = daysInMonth(meta.year, meta.month);
    const missingDays = [];
    for (let day = 1; day <= expectedLastDay; day += 1) {
      if (!foundDays.has(day)) missingDays.push(day);
    }

    if (headers.length < 4 || missingDays.length) {
      const missing = missingDays.length ? ` Faltan días: ${missingDays.join(", ")}.` : "";
      throw new Error(`El PDF no conserva la estructura mensual esperada.${missing} No se reemplazó la rotativa vigente.`);
    }

    const specialties = observedSpecialties(allRows);
    const catalogCount = catalogLabels().length;
    const minimumSpecialties = Math.min(6, Math.max(3, catalogCount));
    if (specialties.length < minimumSpecialties) {
      throw new Error("El PDF no contiene suficientes filas reconocibles de especialidades. No se reemplazó la rotativa vigente.");
    }

    return Object.freeze({
      valid: true,
      month: meta.month,
      year: meta.year,
      label: meta.label,
      daysInMonth: expectedLastDay,
      blockCount: headers.length,
      specialtyCount: specialties.length,
      missingDays: Object.freeze([])
    });
  }

  function statusBox(form) {
    let box = form.querySelector("[data-calls-monthly-guard-status]");
    if (!box) {
      box = document.createElement("div");
      box.dataset.callsMonthlyGuardStatus = "true";
      box.setAttribute("role", "status");
      box.style.marginTop = "10px";
      form.append(box);
    }
    return box;
  }

  function setStatus(form, message, isError = false) {
    const box = statusBox(form);
    box.className = isError ? "sb-error" : "sb-ok";
    box.textContent = message;
  }

  function forceMonthlyTitle(form, label) {
    let input = form.querySelector('[name="title"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "title";
      input.dataset.callsMonthlyGeneratedTitle = "true";
      form.append(input);
    }
    input.value = label;
  }

  function isSpecialistUpload(form) {
    return Boolean(
      form?.matches?.("[data-upload-call]") &&
      String(form.dataset.callType || "").toLowerCase() === "especialistas"
    );
  }

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!isSpecialistUpload(form)) return;

    if (form.dataset.callsMonthlyGuardApproved === "true") {
      delete form.dataset.callsMonthlyGuardApproved;
      return;
    }

    const file = form.file?.files?.[0] || form.querySelector('input[type="file"]')?.files?.[0] || null;
    if (!file) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const submit = form.querySelector('button[type="submit"],input[type="submit"]');
    if (submit) submit.disabled = true;
    setStatus(form, "Validando mes, días y estructura de la rotativa antes de publicarla…");

    validateFile(file)
      .then((result) => {
        forceMonthlyTitle(form, result.label);
        setStatus(form, `PDF validado: ${result.label}. Publicando como rotativa vigente…`);
        form.dataset.callsMonthlyGuardApproved = "true";
        if (submit) submit.disabled = false;
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      })
      .catch((error) => {
        console.error("Rotativa mensual rechazada", error);
        setStatus(form, error?.message || "No se pudo validar el PDF. Se mantuvo la rotativa vigente anterior.", true);
        if (submit) submit.disabled = false;
      });
  }, true);

  window.CRS_CALLS_MONTHLY_GUARD = Object.freeze({
    parseMonthYear,
    validateFile,
    version: 1
  });
})();
