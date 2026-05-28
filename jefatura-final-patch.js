(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  let pdfLoading = null;

  function currentRoute() {
    return location.hash.split("?")[0] || "#/inicio";
  }

  function loadPdfJs() {
    if (window.pdfjsLib?.getDocument) return Promise.resolve(window.pdfjsLib);
    if (pdfLoading) return pdfLoading;
    pdfLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = reject;
      document.head.append(script);
    }).then((lib) => {
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      }
      return lib;
    });
    return pdfLoading;
  }

  async function extractPaperMeta(file) {
    if (!file || !/pdf/i.test(file.type || file.name || "")) return {};
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = Math.min(pdf.numPages || 1, 3);
    const chunks = [];
    for (let pageNo = 1; pageNo <= pages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      chunks.push(content.items.map((item) => item.str || "").join(" "));
    }
    const text = chunks.join(" ").replace(/\s+/g, " ").trim();
    const abstract = text.match(/\babstract\b[:\s-]*(.{120,1600}?)(?:\bkeywords\b|\bintroduction\b|\bbackground\b|\bmethods\b|$)/i);
    const beforeAbstract = text.split(/\babstract\b/i)[0] || text;
    const title = beforeAbstract.split(/[.!?]\s/)[0]?.slice(0, 180).trim();
    return {
      title: title || "",
      description: abstract ? abstract[1].trim() : ""
    };
  }

  function patchPaperForm(root = document) {
    const form = $('form[data-content="paper"]', root);
    if (!form) return;
    const title = form.elements.title;
    const description = form.elements.description;
    const file = form.elements.file;
    if (title) {
      title.required = false;
      title.placeholder = "Opcional: se extrae desde el PDF";
      const label = title.closest("label");
      if (label?.firstChild) label.firstChild.textContent = "Titulo opcional";
    }
    if (description) {
      description.placeholder = "Opcional: se extrae desde el PDF";
      const label = description.closest("label");
      if (label?.firstChild) label.firstChild.textContent = "Abstract opcional";
    }
    if (file) file.accept = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";
    if (file && !file.dataset.pdfExtractReady) {
      file.dataset.pdfExtractReady = "true";
      file.addEventListener("change", async () => {
        const selected = file.files?.[0];
        if (!selected || !/pdf/i.test(selected.type || selected.name || "")) return;
        const button = form.querySelector("button[type='submit']");
        const oldText = button?.textContent;
        if (button) {
          button.disabled = true;
          button.textContent = "Leyendo PDF...";
        }
        try {
          const meta = await extractPaperMeta(selected);
          if (meta.title && title && !title.value.trim()) title.value = meta.title;
          if (meta.description && description && !description.value.trim()) description.value = meta.description;
        } catch (error) {
          console.warn("No se pudo extraer titulo/abstract del PDF", error);
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = oldText || "Publicar paper";
          }
        }
      });
    }
    const card = form.closest("article");
    const intro = card?.querySelector("p");
    if (intro) intro.textContent = "Sube el PDF. Si dejas titulo o abstract vacio, la app intentara tomarlos directamente del archivo.";
  }

  function patchNewsForm(root = document) {
    const form = $('form[data-content="mixed"]', root);
    if (!form) return;
    const eventUrl = form.elements.eventUrl;
    const file = form.elements.file;
    if (eventUrl) {
      const label = eventUrl.closest("label");
      if (label?.firstChild) label.firstChild.textContent = "Enlace de la noticia / inscripcion";
    }
    if (file) {
      file.accept = "image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt";
      const label = file.closest("label");
      if (label?.firstChild) label.firstChild.textContent = "Imagen, poster o archivo";
    }
    const card = form.closest("article");
    const intro = card?.querySelector("p");
    if (intro) intro.textContent = "Publica noticias, cursos, posters, enlaces, podcast o material docente. Para noticias, puedes subir una imagen o poster para que la tarjeta se vea atractiva.";
  }

  function setEyebrow(pageSelector, text) {
    const node = $(`${pageSelector} .page-head .eyebrow`);
    if (node && node.textContent !== text) node.textContent = text;
  }

  function removeChiefGestionLinks() {
    document.querySelectorAll("#chiefContent a").forEach((link) => {
      if (/volver\s+a\s+gestion/i.test(link.textContent || "") || link.getAttribute("href") === "#/gestion") {
        link.remove();
      }
    });
  }

  function patchRouteChrome() {
    const hash = currentRoute();
    if (hash === "#/gestion") setEyebrow("#managementPage", "Seguimiento operativo");
    if (hash === "#/gestion/pacientes") setEyebrow("#managementPage", "Gestion pacientes");
    if (hash === "#/noticias") setEyebrow("#managementPage", "Noticias");
    if (hash === "#/paper") setEyebrow("#managementPage", "Paper del mes");
    if (hash === "#/procedimientos") setEyebrow("#managementPage", "Procedimientos medicos");
    if (hash === "#/educacion") setEyebrow("#educationPage", "Educacion medica");
    if (hash === "#/jefatura") {
      setEyebrow("#chiefPage", "Espacio jefatura");
      removeChiefGestionLinks();
    }
  }

  function patch() {
    patchRouteChrome();
    if (currentRoute() !== "#/jefatura") return;
    patchPaperForm();
    patchNewsForm();
  }

  const observer = new MutationObserver(patch);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => {
    setTimeout(patch, 80);
    setTimeout(patch, 420);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
