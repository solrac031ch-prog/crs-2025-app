(() => {
  const text = (value) => String(value || "");
  const normalize = (value) => text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (typeof protocols === "undefined" || !Array.isArray(protocols)) return;

  const allText = (protocol) => normalize([
    protocol.title,
    protocol.category,
    protocol.page,
    protocol.summary,
    ...(protocol.tags || []),
    ...(protocol.sourceDocs || []).flat()
  ].join(" "));

  const findProtocol = (...needles) => protocols.find((protocol) => {
    const haystack = allText(protocol);
    return needles.every((needle) => haystack.includes(normalize(needle)));
  });

  const removeProtocols = (...needles) => {
    for (let index = protocols.length - 1; index >= 0; index -= 1) {
      const haystack = allText(protocols[index]);
      if (needles.every((needle) => haystack.includes(normalize(needle)))) protocols.splice(index, 1);
    }
  };

  const unique = (items) => Array.from(new Set((items || []).filter(Boolean)));
  const renameProtocol = (protocol, updates) => {
    if (!protocol) return null;
    Object.assign(protocol, updates);
    protocol.tags = unique(updates.tags || protocol.tags);
    return protocol;
  };

  renameProtocol(findProtocol("hemodinamia") || findProtocol("hemodinamica"), {
    title: "Hemodinamia de urgencias",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Acceso al flujo vigente de hemodinamia de urgencias 2026.",
    tags: ["Hemodinamia", "Urgencias", "Cardiologia", "2026"],
    warning: "Pendiente anexar PDF 2026 al repositorio."
  });

  renameProtocol(findProtocol("urologia", "urgencia") || findProtocol("urologica", "urgencia"), {
    title: "Urgencia urologica",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Flujo HEDI 2026 para patologia urologica de urgencia.",
    tags: ["Urologia", "Urgencia", "HEDI", "2026"],
    warning: "Pendiente anexar PDF Urologia de urgencias HEDI 2026."
  });

  renameProtocol(findProtocol("radiologia", "intervencional"), {
    title: "Neurologia",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Flujo de neurologia asociado a neuroradiologia intervencional de urgencias y evaluacion neurologica a distancia ACV.",
    tags: ["Neurologia", "Neuroradiologia intervencional", "ACV", "2026"],
    warning: "El boton antes llamado Radiologia intervencional ahora se muestra como Neurologia. Pendiente anexar PDF 2026 si corresponde."
  });

  renameProtocol(findProtocol("columna"), {
    title: "Cirugia de columna",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Flujo 2026 para patologia aguda de columna y coordinacion con centro de referencia.",
    tags: ["Cirugia de columna", "Columna", "HDSR", "Neurocirugia", "2026"],
    warning: "Pendiente anexar PDF Patologia aguda de columna 2026."
  });

  const neurologia = findProtocol("neurologia");
  if (neurologia) {
    neurologia.title = "Neurologia";
    neurologia.category = "Flujo";
    neurologia.page = "Doc. 2026";
    neurologia.summary = "Flujo unico para neuroradiologia intervencional de urgencias 2026 y evaluacion neurologica a distancia en ACV.";
    neurologia.tags = unique(["Neurologia", "Neuroradiologia intervencional", "ACV", "Trombolisis", "Trombectomia", "2026"]);
    neurologia.moments = (neurologia.moments || [])
      .filter((moment) => !normalize(moment.title).includes("donante"))
      .map((moment) => {
        if (normalize(moment.title).includes("neurorradiologia")) return { ...moment, title: "1. Neuroradiologia intervencional de urgencias" };
        if (normalize(moment.title).includes("distancia")) return { ...moment, title: "2. Evaluacion neurologica a distancia ACV" };
        return moment;
      });
    neurologia.flow = [
      "Identificar si corresponde neuroradiologia intervencional o evaluacion neurologica a distancia por ACV.",
      "Contactar al referente indicado segun el flujo vigente.",
      "Coordinar Gestion de Camas CASR si requiere procedimiento, traslado, cama o retorno.",
      "Registrar indicaciones y comunicacion en la ficha clinica."
    ];
  }

  removeProtocols("posible", "donante");
  const posibleDonante = {
    title: "Posible donante",
    category: "Protocolo",
    page: "Doc. 2026",
    summary: "Protocolo unico para evaluacion neurologica y ecografia de posible o potencial donante 2026.",
    tags: ["Posible donante", "Potencial donante", "Evaluacion neurologica", "Ecografia", "2026"],
    hidePriority: true,
    fields: [
      ["Alcance", "Paciente posible o potencial donante que requiere coordinacion segun protocolo vigente."],
      ["Evaluacion neurologica", "Activar evaluacion neurologica de posible donante 2026 segun disponibilidad y conducto local."],
      ["Ecografia", "Coordinar ecografia de posible/potencial donante 2026 segun indicacion del equipo responsable."],
      ["Registro", "Dejar trazabilidad de contactos, horarios e indicaciones en ficha clinica."]
    ],
    flow: [
      "Confirmar que el paciente corresponde a posible o potencial donante.",
      "Coordinar evaluacion neurologica segun protocolo 2026.",
      "Coordinar ecografia de posible/potencial donante cuando corresponda.",
      "Registrar responsables, horarios y respuesta de la red."
    ],
    warning: "Pendiente anexar PDFs 2026 de evaluacion neurologica y ecografia de posible/potencial donante."
  };
  const neurologiaIndex = protocols.indexOf(neurologia);
  protocols.splice(neurologiaIndex >= 0 ? neurologiaIndex + 1 : protocols.length, 0, posibleDonante);

  if (!findProtocol("cirugia vascular")) {
    protocols.splice(protocols.findIndex((item) => item.title === "Cirugia de columna") + 1 || protocols.length, 0, {
      title: "Cirugia vascular",
      category: "Flujo",
      page: "Doc. 2026",
      summary: "Flujo de patologia arterial de urgencias 2026.",
      tags: ["Cirugia vascular", "Patologia arterial", "Urgencias", "2026"],
      hidePriority: true,
      fields: [["Documento", "Patologia arterial de urgencias 2026."], ["Conducta", "Anexar documento fuente para revisar criterios y activacion."], ["Registro", "Registrar evaluacion, contacto y plan acordado."]],
      warning: "Pendiente anexar el PDF Patologia arterial de urgencias 2026."
    });
  }

  const tvp = findProtocol("tvp") || findProtocol("doppler", "inhabil");
  if (tvp) {
    tvp.title = "TVP horario inhabil";
    tvp.category = "Flujo";
    tvp.page = "Doc. 2026";
    tvp.summary = "Flujo unico para TVP en horario inhabil, incluyendo ecografia doppler de extremidades 2026.";
    tvp.tags = unique([...(tvp.tags || []), "Ecografia doppler extremidades", "2026"]);
    tvp.warning = "Pendiente anexar el PDF Ecografia doppler extremidades 2026."
  }

  const loadScriptOnce = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src*="${src.split("?")[0].replace("./", "")}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.body.append(script);
  });

  window.setTimeout(() => {
    loadScriptOnce("./arsenal-terapeutico.js?v=2")
      .then(() => loadScriptOnce("./arsenal-uso-ocasional-fix.js?v=1"))
      .catch(() => {});
    loadScriptOnce("./gestion-jefatura-v2.js?v=2")
      .then(() => loadScriptOnce("./jefatura-panel-ajustes.js?v=1"))
      .then(() => loadScriptOnce("./jefatura-presentacion-login.js?v=1"))
      .catch(() => {});
    loadScriptOnce("./limpieza-paginas-operativas.js?v=1").catch(() => {});
  }, 0);

  if (typeof renderRoute === "function") renderRoute();
})();