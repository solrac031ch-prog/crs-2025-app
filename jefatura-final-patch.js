(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

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

  function patch() {
    if (location.hash.split("?")[0] !== "#/jefatura") return;
    patchPaperForm();
    patchNewsForm();
  }

  const observer = new MutationObserver(patch);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => setTimeout(patch, 80));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch);
  else patch();
})();
