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
      if (needles.every((needle) => haystack.includes(normalize(needle)))) {
        protocols.splice(index, 1);
      }
    }
  };

  const unique = (items) => Array.from(new Set((items || []).filter(Boolean)));

  const renameProtocol = (protocol, updates) => {
    if (!protocol) return null;
    Object.assign(protocol, updates);
    protocol.tags = unique(updates.tags || protocol.tags);
    return protocol;
  };

  const hemodinamia = findProtocol("hemodinamia") || findProtocol("hemodinamica");
  renameProtocol(hemodinamia, {
    title: "Hemodinamia de urgencias",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Acceso al flujo vigente de hemodinamia de urgencias 2026.",
    tags: ["Hemodinamia", "Urgencias", "Cardiologia", "2026"],
    sourceDocs: [["Hemodinamica de urgencias 2026", "./protocol-docs/hemodinamia-2025.pdf"]]
  });

  const urgenciaUrologica = findProtocol("urologia", "urgencia") || findProtocol("urologica", "urgencia");
  renameProtocol(urgenciaUrologica, {
    title: "Urgencia urologica",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Flujo HEDI 2026 para patologia urologica de urgencia.",
    tags: ["Urologia", "Urgencia", "HEDI", "2026"],
    sourceDocs: [["Urologia de urgencias HEDI 2026", "./protocol-docs/patologia-urologia-urgencia-2025.pdf"]]
  });

  const radiologia = findProtocol("radiologia", "intervencional");
  renameProtocol(radiologia, {
    title: "Radiologia intervencional",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Acceso al flujo vigente de radiologia intervencional de urgencias 2026.",
    tags: ["Radiologia intervencional", "Urgencias", "2026"],
    sourceDocs: [["Radiologia intervencional de urgencias 2026", "./protocol-docs/radiologia-intervencional-2025.pdf"]]
  });

  const columna = findProtocol("columna");
  renameProtocol(columna, {
    title: "Cirugia de columna",
    category: "Flujo",
    page: "Doc. 2026",
    summary: "Flujo 2026 para patologia aguda de columna y coordinacion con centro de referencia.",
    tags: ["Cirugia de columna", "Columna", "HDSR", "Neurocirugia", "2026"],
    sourceDocs: [["Patologia aguda de columna 2026", "./protocol-docs/patologia-aguda-columna-2025.pdf"]]
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
        if (normalize(moment.title).includes("neurorradiologia")) {
          return { ...moment, title: "1. Neuroradiologia intervencional de urgencias" };
        }
        if (normalize(moment.title).includes("distancia")) {
          return { ...moment, title: "2. Evaluacion neurologica a distancia ACV" };
        }
        return moment;
      });
    neurologia.flow = [
      "Identificar si corresponde neuroradiologia intervencional o evaluacion neurologica a distancia por ACV.",
      "Contactar al referente indicado segun el flujo vigente.",
      "Coordinar Gestion de Camas CASR si requiere procedimiento, traslado, cama o retorno.",
      "Registrar indicaciones y comunicacion en la ficha clinica."
    ];
    neurologia.sourceDocs = [["Neuroradiologia intervencional de urgencias 2026 y evaluacion neurologica a distancia ACV", "./protocol-docs/flujos-neuro-2025.pdf"]];
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
    sourceDocs: [["Evaluacion neurologica posible donante 2026 / Ecografia de posible o potencial donante 2026", "./protocol-docs/flujos-neuro-2025.pdf"]]
  };
  const neurologiaIndex = protocols.indexOf(neurologia);
  protocols.splice(neurologiaIndex >= 0 ? neurologiaIndex + 1 : protocols.length, 0, posibleDonante);

  if (!findProtocol("cirugia vascular")) {
    protocols.splice(protocols.findIndex((item) => item === columna) + 1 || protocols.length, 0, {
      title: "Cirugia vascular",
      category: "Flujo",
      page: "Doc. 2026",
      summary: "Flujo de patologia arterial de urgencias 2026.",
      tags: ["Cirugia vascular", "Patologia arterial", "Urgencias", "2026"],
      hidePriority: true,
      fields: [
        ["Documento", "Patologia arterial de urgencias 2026."],
        ["Conducta", "Abrir el documento fuente y seguir criterios, contactos y secuencia de activacion vigentes."],
        ["Registro", "Registrar evaluacion, contacto con especialista y plan acordado."]
      ],
      sourceDocs: [["Patologia arterial de urgencias 2026", "./protocol-docs/patologia-arterial-urgencias-2026.pdf"]],
      warning: "Pendiente anexar el PDF 2026 al repositorio para abrir el documento fuente desde este boton."
    });
  }

  const tvp = findProtocol("tvp") || findProtocol("doppler", "inhabil");
  if (tvp) {
    tvp.title = "TVP horario inhabil";
    tvp.category = "Flujo";
    tvp.page = "Doc. 2026";
    tvp.summary = "Flujo unico para TVP en horario inhabil, incluyendo ecografia doppler de extremidades 2026.";
    tvp.tags = unique([...(tvp.tags || []), "Ecografia doppler extremidades", "2026"]);
    tvp.moments = tvp.moments || [];
    if (!tvp.moments.some((moment) => normalize(moment.title).includes("doppler extremidades"))) {
      tvp.moments.push({
        title: "4. Ecografia doppler extremidades 2026",
        text: "Solicitud y coordinacion de ecografia doppler de extremidades dentro del flujo TVP en horario inhabil.",
        steps: [
          "Confirmar sospecha clinica y horario de solicitud.",
          "Seguir el conducto TVP horario inhabil vigente.",
          "Registrar destino, hora y responsable de la coordinacion."
        ]
      });
    }
    tvp.sourceDocs = unique([...(tvp.sourceDocs || []), ["Ecografia doppler extremidades 2026", "./protocol-docs/ecografia-doppler-extremidades-2026.pdf"]]);
  }

  if (typeof renderRoute === "function") renderRoute();
})();
