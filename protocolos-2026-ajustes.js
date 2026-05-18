(() => {
  const text = (value) => String(value || "");
  const normalize = (value) => text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (typeof protocols === "undefined" || !Array.isArray(protocols)) return;

  const ARTICULADOR = "+569 9253 7195";
  const COORD_RED = "+569 4402 0756";
  const COORD_HSR = "+569 9998 0214";
  const HSR_PHONE = "UEH Adultos HSR: estación enfermería 225762662 / 225762363; reanimador 225762353; coordinador médico UEH +569 9998 0214.";
  const BASE_2026_TAGS = ["Manual SSMSO 2026", "Consultoría de llamada", "2026"];

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

  const removeMatching = (...needles) => {
    for (let index = protocols.length - 1; index >= 0; index -= 1) {
      const haystack = allText(protocols[index]);
      if (needles.every((needle) => haystack.includes(normalize(needle)))) protocols.splice(index, 1);
    }
  };

  const unique = (items) => Array.from(new Set((items || []).filter(Boolean)));
  const withTags = (...tags) => unique([...BASE_2026_TAGS, ...tags]);
  const upsertByTitle = (title, data, insertAfterTitle = null) => {
    const current = protocols.find((item) => normalize(item.title) === normalize(title));
    if (current) {
      Object.assign(current, data, { title });
      current.tags = unique(current.tags || data.tags || []);
      return current;
    }
    const protocol = { title, ...data };
    const afterIndex = insertAfterTitle ? protocols.findIndex((item) => normalize(item.title) === normalize(insertAfterTitle)) : -1;
    protocols.splice(afterIndex >= 0 ? afterIndex + 1 : protocols.length, 0, protocol);
    return protocol;
  };

  const replaceProtocol = (matchers, title, data, insertAfterTitle = null) => {
    let target = null;
    for (const matcher of matchers) {
      target = findProtocol(...matcher);
      if (target) break;
    }
    if (target) {
      Object.assign(target, data, { title });
      target.tags = unique(data.tags || target.tags || []);
      return target;
    }
    return upsertByTitle(title, data, insertAfterTitle);
  };

  // Elimina residuos de parches intermedios si quedaron persistidos en el arreglo.
  removeMatching("hemodinamia de urgencia 2026");
  removeMatching("radiologia intervencional de urgencia 2026");
  removeMatching("patologia aguda de columna 2026");
  removeMatching("urologia de urgencia hsr 2026");
  removeMatching("urologia de urgencia hedi 2026");
  removeMatching("ecografia doppler extremidades 2026");
  removeMatching("patologia arterial de urgencia 2026");
  removeMatching("evaluacion neurologica posible donante 2026");
  removeMatching("ecocardiografia posible potencial donante 2026");
  removeMatching("neurorradiologia intervencional de urgencia 2026");
  removeMatching("evaluacion neurologica a distancia acv 2026");
  removeMatching("neurologia integrada 2026");
  removeMatching("posible donante 2026");

  replaceProtocol([["hemodinamia"]], "Hemodinamia de urgencia", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 12-14",
    summary: "Flujo vigente para activación de hemodinamia de urgencia en HSR.",
    tags: withTags("Hemodinamia", "IAM SDST", "Shock cardiogénico", "UCO HSR"),
    fields: [
      ["Responsable", "Hemodinamia HSR."],
      ["Centro", "Hospital Dr. Sótero del Río."],
      ["Activación final", "Residente UCO HSR activa al hemodinamista."],
      ["Coordinación", `Avisar a Coordinador Médico UEH HSR ${COORD_HSR} y llamar Articulador SSMSO ${ARTICULADOR}.`],
      ["Teléfonos", HSR_PHONE]
    ],
    pathologies: [["Criterios de llamado", [
      "IAM con SDST",
      "Shock cardiogénico",
      "Angina post PTCA reciente",
      "Sospecha de complicación mecánica del IAM",
      "IAM SSDST con angina refractaria o compromiso hemodinámico",
      "Angina post infarto reciente",
      "BCRI con angina",
      "Tormenta eléctrica en SCA",
      "Drenaje pericárdico de urgencia",
      "Trombolisis pulmonar mecánica por TEP masivo"
    ]]],
    flow: [
      "Confirmar criterio de hemodinamia de urgencia.",
      `Avisar a Coordinador Médico UEH HSR ${COORD_HSR} y llamar Articulador SSMSO ${ARTICULADOR}.",
      "Trasladar a UEH Adultos HSR si corresponde.",
      "UEH HSR presenta a residente UCO; UCO define pertinencia y activa hemodinamista.",
      "Coordinar con Gestión de Camas retorno o cama según condición."
    ],
    warning: "IAM SDST desde APS debe ir directo a UEH HSR; no demorar en hospital base."
  });

  replaceProtocol([["urgencias", "urologicas"], ["urologia", "urgencia"], ["urologica", "urgencia"]], "Urgencia urológica", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 24-25",
    summary: "Flujo HEDI 2026 para patología urológica de urgencia; confirmar rotativa y centro receptor según jefatura.",
    tags: withTags("Urología", "HEDI", "Fournier", "Testículo agudo", "Urolitiasis"),
    fields: [
      ["Centro operativo", "HEDI para el flujo principal solicitado; HPH puede requerir HEDI o HSR según rotativa/pertinencia."],
      ["Activación", "Médico jefe de turno de cirugía UEH Adultos HEDI."],
      ["Articulador", ARTICULADOR],
      ["Plazos", "Respuesta de pertinencia ≤2 horas; prestación dentro de 24 horas si cumple criterio."]
    ],
    pathologies: [["Criterios de llamado", [
      "Fournier escrotal-perineal",
      "Urolitiasis obstructiva unilateral o bilateral",
      "Testículo agudo",
      "Nefrectomía por cuadro séptico o hemorrágico",
      "Nefrostomía por cuadro obstructivo",
      "Priapismo",
      "Trauma de pene, escroto o uretra",
      "Lesión de uréter y/o vejiga",
      "Trauma complejo de vejiga",
      "Colecciones o abscesos retroperitoneales",
      "Hemovejiga"
    ]]],
    flow: [
      "Confirmar criterio urológico urgente.",
      `Llamar Articulador SSMSO ${ARTICULADOR}.",
      "Presentar a cirujano de turno UEH Adultos HEDI.",
      "Cirugía HEDI define pertinencia y contacta al urólogo de llamada.",
      "Coordinar Gestión de Camas, traslado, procedimiento o retorno."
    ],
    warning: "Confirmar rotativa antes de derivar: HPH puede ir a HEDI o HSR según disponibilidad y pertinencia."
  });

  replaceProtocol([["radiologia", "intervencional"]], "Radiología intervencional", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 18-19",
    summary: "Flujo 2026 para embolización terapéutica en sangrado activo traumático o no traumático.",
    tags: withTags("Radiología intervencional", "Embolización", "AngioTAC", "Sangrado activo", "HSR"),
    fields: [
      ["Responsable", "Imagenología HSR."],
      ["Prestación", "Embolización terapéutica."],
      ["Requisito", "Paciente hemodinámicamente estable y AngioTAC <24 horas con sangrado activo."],
      ["Activación", "Jefe turno cirugía UEH HSR, Coordinador Medicina Urgencia o Coordinador UTU HSR."],
      ["Articulador", ARTICULADOR]
    ],
    pathologies: [["Criterios de llamado", [
      "Hemorragia aguda traumática o no traumática en tórax, abdomen, pelvis o extremidades",
      "Sangrado susceptible de tratamiento endovascular",
      "Cirugía no resuelve o aumenta morbimortalidad",
      "AngioTAC <24 h con sangrado activo",
      "Si hay inestabilidad: cirugía de control de daños antes de activar RI"
    ]]],
    flow: [
      "Confirmar sangrado activo, estabilidad y AngioTAC <24 horas.",
      "Solicitar evaluación por jefe de turno de cirugía del hospital derivador.",
      "Presentar a cirugía UEH HSR, Coordinador Medicina Urgencia o UTU según contexto.",
      `Llamar Articulador SSMSO ${ARTICULADOR}.",
      "Coordinar traslado, procedimiento y retorno/cama con Gestión de Camas."
    ],
    warning: "No activar radiología intervencional en paciente inestable sin control de daños previo."
  });

  replaceProtocol([["columna"]], "Cirugía de columna", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 20-21",
    summary: "Flujo 2026 para patología aguda de columna y coordinación con HSR.",
    tags: withTags("Cirugía de columna", "TRM", "Compresión medular", "Absceso peridural", "HSR"),
    fields: [
      ["Condición", "Paciente hemodinámicamente estable."],
      ["Activación", "Traumatólogo de turno UEH HSR o cirujano de turno HSR."],
      ["Articulador", ARTICULADOR],
      ["Plazos", "Respuesta de pertinencia ≤2 horas; prestación dentro de 24 horas si corresponde."]
    ],
    pathologies: [["Criterios de llamado", [
      "TRM con compromiso neurológico observado: paraplejia o tetraplejia",
      "Compresión medular",
      "Mielitis transversa infecciosa o absceso peridural con compromiso neurológico",
      "Inestabilidad de columna por trauma sin compromiso neurológico"
    ]]],
    flow: [
      "Confirmar estabilidad hemodinámica y criterio de columna aguda.",
      `Llamar Articulador SSMSO ${ARTICULADOR}.",
      "Presentar caso a traumatólogo o jefe de turno UEH HSR.",
      "HSR define pertinencia y activa especialista de columna.",
      "Coordinar RNM, traslado, pabellón, cama o retorno según indicación."
    ],
    warning: "APS deriva a hospital base; HSR recibe derivación hospitalaria."
  });

  const neurologia = replaceProtocol([["neurologia"]], "Neurología", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 15-17 y 32-33",
    summary: "Flujo único para neurorradiología intervencional y evaluación neurológica a distancia en ACV/status epiléptico.",
    tags: withTags("Neurología", "Neurorradiología", "ACV", "Trombectomía", "Trombólisis", "Telemedicina"),
    fields: [
      ["Neurorradiología intervencional", "Angiografía cerebral, trombectomía mecánica y embolización."],
      ["ACV a distancia", "Teleconsulta para ACV isquémico en ventana y status epiléptico refractario."],
      ["Articulador", ARTICULADOR],
      ["CUD", "telemedicina.ssmso.cl"],
      ["Correo HPH", "teleconsultaacv@hurtadohosp.cl"]
    ],
    moments: [
      {
        title: "1. Neurorradiología intervencional",
        text: "Para oclusión aguda cerebral, HSA por aneurisma roto, vasoespasmo en HSA, MAV rota u otra hemorragia cerebral.",
        steps: [
          "Isquémico: neurólogo HSR/HPH/HEDI llama directamente al neurointervencionista.",
          `Llamar en paralelo al Articulador SSMSO ${ARTICULADOR}.",
          "Hemorrágico: solicitar evaluación por neurocirujano HSR; si cumple pertinencia, derivar a UEH HSR."
        ]
      },
      {
        title: "2. Evaluación neurológica a distancia ACV",
        text: "Para ACV isquémico en ventana o status epiléptico refractario.",
        steps: [
          "Criterios ACV: >18 años, déficit focal <4,5 h, NIHSS ≥4 o déficit discapacitante, MRS ≤3, glicemia 50-400 y TAC sin hemorragia.",
          `Activar mediante Articulador SSMSO ${ARTICULADOR}.",
          "Neurólogo abre episodio en CUD y envía enlace de videollamada al correo del hospital."
        ]
      }
    ],
    flow: [
      "Definir si corresponde neurointervención, ACV para teleconsulta o status epiléptico.",
      "Si es neurointervención, contactar neurólogo/neurocirujano según tipo de lesión y llamar Articulador.",
      "Si es ACV telemático, llamar Articulador para validación y contacto con neurólogo.",
      "Coordinar Gestión de Camas, traslado, procedimiento o retorno según indicación del especialista."
    ],
    warning: "Neurología agrupa neurorradiología intervencional y evaluación neurológica a distancia ACV; no deben mostrarse como botones separados."
  });

  upsertByTitle("Posible donante", {
    category: "Protocolo",
    page: "Manual SSMSO 2026 · p. 26 y 31",
    summary: "Protocolo único para posible/potencial donante: evaluación neurológica y ecocardiografía.",
    tags: withTags("Posible donante", "Potencial donante", "Evaluación neurológica", "EEG", "Ecocardiografía", "Procuramiento"),
    hidePriority: true,
    fields: [
      ["Posible donante", "Daño neurológico severo con Glasgow ≤7."],
      ["Potencial donante", "Muerte encefálica certificada."],
      ["Evaluación neurológica", "Apoyo para certificación de muerte encefálica e interpretación EEG."],
      ["Ecocardiografía", "Cardiólogo ecografista para realización e informe si no hay especialista disponible."],
      ["Activación", "Coordinador Local de Procuramiento activa según rotativa y completa encuesta del proyecto."]
    ],
    flow: [
      "Identificar posible o potencial donante.",
      "CLP confirma necesidad de evaluación neurológica, EEG o ecocardiografía.",
      "CLP activa especialista según rotativa y completa encuesta.",
      "Especialista realiza evaluación/informe.",
      "Registrar todo en ficha clínica."
    ],
    warning: "Este protocolo lo activa el Coordinador Local de Procuramiento, no el médico de urgencia directamente."
  }, neurologia ? neurologia.title : null);

  upsertByTitle("Cirugía vascular", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 27-28",
    summary: "Flujo 2026 para patología arterial de urgencia con resolución quirúrgica o endovascular en HSR.",
    tags: withTags("Cirugía vascular", "Patología arterial", "Isquemia", "Aneurisma roto", "Disección aórtica", "HSR"),
    hidePriority: true,
    fields: [
      ["Centro", "HSR."],
      ["Activación", "Jefe turno cirugía UEH HSR y/o Coordinador UTU HSR."],
      ["Articulador", ARTICULADOR],
      ["Destino", "Trauma: unidad indicada por UTU. No traumático: UEH HSR. APS deriva a hospital base."]
    ],
    pathologies: [["Criterios de llamado", [
      "Disección aórtica tipo B complicada",
      "Aneurisma roto",
      "Reconstrucción arterial compleja",
      "Isquemia aguda Rutherford 2b",
      "Isquemia mesentérica aguda",
      "Isquemia territorio esplácnico",
      "Flegmasia"
    ]]],
    flow: [
      "Confirmar criterio vascular arterial.",
      `Llamar Articulador SSMSO ${ARTICULADOR}.",
      "Presentar a cirugía/UTU HSR.",
      "HSR define pertinencia y activa cirugía vascular.",
      "Coordinar traslado, procedimiento, cama HSR o retorno según condición."
    ],
    warning: "El documento tiene una errata donde menciona urólogo; por contexto corresponde cirugía vascular."
  }, "Cirugía de columna");

  const tvp = replaceProtocol([["tvp"], ["doppler", "inhabil"]], "TVP horario inhábil", {
    category: "Flujo",
    page: "Manual SSMSO 2026 · p. 29-30",
    summary: "Flujo 2026 para sospecha de TVP en horario inhábil con ecografía Doppler de extremidades en HSR.",
    tags: withTags("TVP", "Doppler", "Horario inhábil", "Imagenología HSR", "Sala 9"),
    hidePriority: true,
    fields: [
      ["Horario", "Sábados, domingos y festivos de 09:00 a 12:00."],
      ["Población", "Mayores de 15 años, ambulatorios en UEH, con sospecha de TVP de extremidades superiores o inferiores."],
      ["Cupos", "5 cupos diarios HPH/HEDI/CHSJM: 09:20, 09:50, 10:20, 10:50 y 11:20."],
      ["Coordinación", `Hábil: Coordinador Red Urgencia ${COORD_RED}. Inhábil: Articuladora SSMSO ${ARTICULADOR}.`],
      ["Destino", "Sala de ecografía N°9, Block Central HSR. No pasar por UEH HSR."]
    ],
    flow: [
      "Confirmar sospecha de TVP en paciente ambulatorio UEH >15 años.",
      "Confirmar que sea sábado, domingo o festivo entre 09:00 y 12:00.",
      "Llamar para asignación de hora antes de completar formulario.",
      "Enviar directo a sala 9 de Imagenología HSR con orden firmada y timbrada por jefe de turno.",
      "Paciente retorna al hospital base; informe disponible en RISPACS en máximo 1 hora."
    ],
    warning: "Cambio clave 2026: el paciente va directo a Imagenología HSR; no debe pasar por UEH HSR."
  });

  // Mantiene orden clínico de los flujos nuevos si se agregaron al final.
  const desiredOrder = [
    "Hemodinamia de urgencia",
    "Neurología",
    "Radiología intervencional",
    "Cirugía de columna",
    "Urgencia urológica",
    "Cirugía vascular",
    "TVP horario inhábil",
    "Posible donante"
  ];
  protocols.sort((a, b) => {
    const ai = desiredOrder.findIndex((title) => normalize(title) === normalize(a.title));
    const bi = desiredOrder.findIndex((title) => normalize(title) === normalize(b.title));
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  window.__CRS_CONSULTORIA_2026_CANONICAL__ = true;
  if (typeof renderRoute === "function") renderRoute();
})();
