(() => {
  const STORAGE_KEY = "crsGestionContentV2";
  const KINDS = ["news", "education", "papers", "procedures"];

  // Contenido publico versionado con la web.
  // Para publicar noticias o papers visibles desde cualquier dispositivo,
  // se agregan items en estas listas y se sube el cambio al repositorio.
  const STATIC_CONTENT = {
    news: [],
    education: [],
    papers: [],
    procedures: []
  };

  window.CRS_STATIC_CONTENT = STATIC_CONTENT;

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function writeStore(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Si el navegador bloquea localStorage, la app igual puede seguir mostrando la web base.
    }
  }

  function normalizeItem(kind, item, index) {
    const createdAt = item.createdAt || item.fecha || new Date().toISOString();
    const month = item.month || String(createdAt).slice(0, 7);
    return {
      id: item.id || `web-${kind}-${month}-${index + 1}`,
      title: item.title || item.titulo || "Contenido publicado",
      description: item.description || item.descripcion || "",
      url: item.url || item.link || "",
      eventUrl: item.eventUrl || item.inscripcion || "",
      month,
      category: item.category || item.categoria || "",
      createdAt,
      staticContent: true
    };
  }

  function mergeList(kind, storedList = [], staticList = []) {
    const staticItems = staticList.map((item, index) => normalizeItem(kind, item, index));
    const staticIds = new Set(staticItems.map((item) => item.id));
    const localItems = (Array.isArray(storedList) ? storedList : [])
      .filter((item) => !item.staticContent && !staticIds.has(item.id));
    return [...staticItems, ...localItems]
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  const current = readStore();
  const merged = { ...current };
  KINDS.forEach((kind) => {
    merged[kind] = mergeList(kind, current[kind], STATIC_CONTENT[kind] || []);
  });
  writeStore(merged);
})();
