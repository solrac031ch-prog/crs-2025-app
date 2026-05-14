(function () {
  const protocolPageId = "protocolPage";
  const protocolPrefix = "#/especialidad/";
  const consultoriaPrefix = "#/consultoria-2026/";
  const callsRoute = "#/llamados";
  const specialtiesRoute = "#/especialidades";
  const ARTICULADOR = "+569 9253 7195";
  const COORD_RED = "+569 4402 0756";
  const COORD_HSR = "+569 9998 0214";
  const phoneHSR = "UEH Adultos HSR: Estación Enfermería 225762662 / 225762363; Reanimador 225762353; Coordinador Médico UEH +569 9998 0214.";

  const commonActivation = [
    `Llamar al Articulador SSMSO ${ARTICULADOR} cuando el proyecto lo exige.`,
    "Entregar nombre, RUN, edad, hospital solicitante, médico solicitante, RUN médico, procedimiento solicitado, criterio de llamada y médico receptor/presentado.",
    "Coordinar con Gestión de Camas para traslado, asignación de cama, retorno o contrarreferencia.",
    "Registrar en ficha clínica condiciones, indicación y activación del especialista."
  ];
  const commonReturn = [
    "Retorno coordinado por Gestión de Camas.",
    "Debe existir pase del especialista responsable.",
    "Hospital base debe asegurar cama o camilla según requerimiento.",
    "Hospital de destino/base coordina ambulancia; centro de referencia puede apoyar según necesidad."
  ];

  const urologyCriteria = ["Fournier escrotal-perineal", "Urolitiasis obstructiva unilateral o bilateral", "Testículo agudo", "Nefrectomía por cuadro séptico o hemorrágico", "Nefrostomía por cuadro obstructivo", "Priapismo", "Trauma de pene, escroto o uretra", "Lesión de uréter y/o vejiga", "Trauma complejo de vejiga", "Colecciones o abscesos retroperitoneales", "Hemovejiga"];

  const flows = [
    {
      slug: "hemodinamia-urgencia-2026",
      aliases: ["hemodinamia", "hemodinamia-2025"],
      icon: "❤️",
      title: "Hemodinamia de urgencia 2026",
      page: "Manual 2026 · p. 12-14",
      summary: "Activación 24/7 para patología cardiaca tiempo dependiente con necesidad de hemodinamia en HSR.",
      tags: ["IAM SDST", "Shock cardiogénico", "UCO HSR", "Articulador", "Retorno"],
      fields: [["Responsable", "Dr. Martín Valdebenito, Hemodinamia HSR."], ["Centro", "HSR."], ["Prestaciones", "Angioplastia primaria, coronariografía, valvuloplastía aórtica de rescate, balón de contrapulsación, sondeo cardiaco derecho por trasplante hepático y pericardiocentesis."], ["Activación final", "Residente UCO HSR activa al hemodinamista."], ["Teléfonos", phoneHSR]],
      pathologies: [["Criterios de llamado", ["IAM con SDST", "Shock cardiogénico", "Angina post PTCA reciente", "Sospecha de complicación mecánica del IAM", "IAM SSDST con angina refractaria o compromiso hemodinámico", "Angina post infarto reciente", "BCRI con angina", "Tormenta eléctrica en SCA", "Drenaje pericárdico de urgencia", "Trombolisis pulmonar mecánica por TEP masivo"]]],
      moments: [{ title: "1. Derivar", text: "HPH/HEDI con IAM SDST se traslada a UEH Adultos HSR; APS con sospecha IAM SDST va directo a UEH HSR.", steps: [`Avisar Coordinador Médico UEH HSR ${COORD_HSR}.`, `Llamar Articulador SSMSO ${ARTICULADOR}.`, "Avisar a Gestión de Camas HSR." ] }, { title: "2. Validar", text: "UEH HSR presenta a residente UCO; UCO define pertinencia y activa hemodinamista.", steps: ["Estabilizar.", "Registrar indicación.", "Consentimiento informado."] }, { title: "3. Retornar", text: "Retorno inmediato a hospital base si está en condiciones.", steps: ["No retornan: balón de contrapulsación o inestabilidad hemodinámica/eléctrica.", "Ventilación mecánica no impide retorno.", "Entrega médica telefónica si retorna a UEH."] }],
      flow: ["Confirmar criterio de llamada.", "Avisar Coordinador Médico UEH HSR y Articulador.", "Trasladar a UEH Adultos HSR si corresponde.", "UCO evalúa y activa hemodinamista.", "Procedimiento y registro clínico.", "Coordinar retorno o cama según condición."],
      warning: "IAM SDST desde APS: directo a UEH HSR, no pasar por hospital base."
    },
    {
      slug: "neurorradiologia-intervencional-2026",
      aliases: ["neurologia", "neurorradiologia", "trombectomia", "stroke"],
      icon: "🧠",
      title: "Neurorradiología intervencional de urgencia 2026",
      page: "Manual 2026 · p. 15-17",
      summary: "Angiografía, trombectomía o embolización para patología vascular cerebral.",
      tags: ["ACV", "Trombectomía", "HSA", "MAV", "Neurointervención"],
      fields: [["Responsable", "Dr. Juan Carlos Zamora, Neurocirugía HSR."], ["Prestaciones", "Angiografía cerebral diagnóstica, trombectomía mecánica y embolización."], ["Activación", "Neurocirujano HSR o neurólogo HSR/HPH/HEDI según ubicación."], ["Plazos", "Pertinencia ≤2 h; prestación dentro de 24 h si cumple."], ["Teléfonos", phoneHSR]],
      pathologies: [["Criterios", ["Oclusión aguda de arterias cerebrales", "HSA por aneurisma roto", "Vasoespasmo en HSA", "MAV rota", "Hemorragia cerebral de otra causal"]]],
      moments: [{ title: "1. Isquémico", text: "Neurólogo a cargo llama directamente al neurointervencionista.", steps: [`Llamar paralelo al Articulador ${ARTICULADOR}.`, "Paciente recibido en pabellón de angiografía con ingreso administrativo por UEH HSR.", "Retorno o permanencia según indicación."] }, { title: "2. Hemorrágico", text: "Médico a cargo solicita evaluación por neurocirujano HSR.", steps: ["Si cumple, HPH/HEDI derivan a UEH HSR.", "APS deriva a hospital base.", "Si no cumple criterio, retorno inmediato al hospital base."] }, { title: "3. Contrarreferencia", text: "Retorno según pase de neurología/neurocirugía.", steps: commonReturn }],
      flow: ["Definir isquémico vs hemorrágico.", "Contactar neurólogo/neurocirujano según flujo.", "Llamar Articulador.", "Coordinar Gestión de Camas.", "Traslado/procedimiento.", "Retorno con pase si corresponde."],
      warning: "No mezclar flujo isquémico con hemorrágico: activación y destino son distintos."
    },
    {
      slug: "radiologia-intervencional-2026",
      aliases: ["radiologia-intervencional", "radiologia-intervencional-2025"],
      icon: "🖼️",
      title: "Radiología intervencional de urgencia 2026",
      page: "Manual 2026 · p. 18-19",
      summary: "Embolización terapéutica en sangrado activo traumático o no traumático.",
      tags: ["Embolización", "AngioTAC", "Sangrado activo", "Trauma", "HSR"],
      fields: [["Responsable", "Dr. Claudio Montenegro, Imagenología HSR."], ["Prestación", "Embolización terapéutica."], ["Activación", "Jefe turno cirugía UEH HSR, Coordinador Medicina Urgencia o Coordinador UTU."], ["Requisito", "Hemodinamia estable y AngioTAC <24 h con sangrado activo."], ["Teléfonos", phoneHSR]],
      pathologies: [["Criterios", ["Hemorragia aguda traumática o no traumática en tórax, abdomen, pelvis o extremidades", "Sangrado susceptible de tratamiento endovascular", "Cirugía no resuelve o aumenta morbimortalidad", "AngioTAC <24 h con sangrado activo", "Si inestable: primero cirugía de control de daños"]]],
      moments: [{ title: "1. Evaluación", text: "Evaluación por jefe de turno de cirugía del hospital donde consulta.", steps: ["Hemoptisis masiva/HDA/HDB requieren subespecialista quirúrgico previo.", "Luego presentar a HSR."] }, { title: "2. Activación", text: "Presentar a cirugía UEH HSR, Coordinador Medicina o UTU.", steps: [`Llamar Articulador ${ARTICULADOR}.`, "Pertinencia ≤2 h.", "Prestación ≤24 h."] }, { title: "3. Destino", text: "Trauma grave lo organiza UTU; no traumático va a UEH HSR.", steps: ["APS deriva a hospital base.", "Post procedimiento: cama HSR o retorno."] }],
      flow: ["Confirmar sangrado activo y estabilidad.", "AngioTAC <24 h.", "Evaluación quirúrgica previa.", "Presentar a HSR y llamar Articulador.", "Coordinar traslado/Gestión de Camas.", "Procedimiento y retorno según condición."],
      warning: "No activar RI en paciente inestable sin control de daños previo."
    },
    {
      slug: "columna-aguda-2026",
      aliases: ["cirugia-de-columna", "patologia-aguda-de-columna"],
      icon: "🦴",
      title: "Patología aguda de columna 2026",
      page: "Manual 2026 · p. 20-21",
      summary: "Resolución quirúrgica urgente de patología aguda de columna por HSR.",
      tags: ["TRM", "Compresión medular", "Absceso peridural", "RNM", "HSR"],
      fields: [["Responsable", "Dr. Luis Omar Hernández, equipo columna HSR."], ["Prestaciones", "Discectomía, laminectomía, fijación, artrodesis u otros."], ["Condición", "Siempre con estabilidad hemodinámica."], ["Activación", "Traumatólogo turno UEH HSR o cirujano HSR."], ["Plazos", "Pertinencia ≤2 h; prestación ≤24 h."]],
      pathologies: [["Criterios", ["TRM con paraplejia/tetraplejia observada", "Compresión medular", "Mielitis transversa infecciosa o absceso peridural con compromiso neurológico", "Inestabilidad de columna por trauma sin compromiso neurológico"]]],
      moments: [{ title: "1. Doble tarea", text: "El médico hace dos acciones, sin importar orden.", steps: [`Llamar Articulador ${ARTICULADOR}.`, "Presentar a traumatólogo o jefe turno UEH HSR."] }, { title: "2. Pertinencia", text: "HSR define pertinencia y activa especialista de columna.", steps: ["Depende de pabellón, anestesia y cama.", "Si requiere RNM, espera en HSR.", "Si no procede, retorno inmediato."] }, { title: "3. Retorno", text: "Cama HSR o retorno según condición.", steps: commonReturn }],
      flow: ["Confirmar estabilidad.", "Verificar criterio columna.", "Llamar Articulador y presentar a HSR.", "HSR define pertinencia.", "RNM si se requiere.", "Procedimiento o retorno."],
      warning: "APS deriva a hospital base; HSR recibe derivación hospitalaria."
    },
    {
      slug: "urologia-hsr-2026",
      aliases: ["urologia-hsr"],
      icon: "🚻",
      title: "Urología de urgencia HSR 2026",
      page: "Manual 2026 · p. 22-23",
      summary: "Resolución urológica quirúrgica en HSR; apoya HPH/HEDI si HEDI no tiene especialista.",
      tags: ["Fournier", "Testículo agudo", "Urolitiasis", "HSR", "UTU"],
      fields: [["Responsable", "Dr. José Arenas, Urología HSR."], ["Prestaciones", "Nefrectomía, uretrectomía/plastía, ureterostomía, pielotomía, nefrostomía, cirugía litiasis renal, reparación quirúrgica."], ["Activación", "Jefe turno cirugía UEH HSR y/o Coordinador UTU."], ["Destino HPH", "Si cumple para HSR, derivar a UEH Adultos HSR."], ["Plazos", "Pertinencia ≤2 h; prestación ≤24 h."]],
      pathologies: [["Criterios", urologyCriteria]],
      moments: [{ title: "1. Doble tarea", text: "Llamar Articulador y presentar a HSR.", steps: [`Articulador ${ARTICULADOR}.`, "Presentar a cirujano, UTU o jefe turno HSR.", "Llamado inicial a estación de enfermería UEH HSR."] }, { title: "2. Pertinencia", text: "UTU/cirugía define y activa urólogo HSR.", steps: ["Autorización de traslado por HSR.", "Coordinar Gestión de Camas.", "Depende de pabellón, anestesia y cama."] }, { title: "3. Retorno", text: "Cama HSR o retorno con pase de Urología HSR.", steps: commonReturn }],
      flow: ["Confirmar criterio urológico.", "Llamar Articulador.", "Presentar a HSR.", "HSR define pertinencia y activa urólogo.", "Derivar si procede.", "Procedimiento o retorno."],
      warning: "HPH puede derivar a HSR o HEDI según rotativa/pertinencia. Confirmar centro receptor."
    },
    {
      slug: "urologia-hedi-2026",
      aliases: ["urologia-hedi", "urgencias-urologicas", "patologia-urologia-de-urgencia-2025"],
      icon: "🚻",
      title: "Urología de urgencia HEDI 2026",
      page: "Manual 2026 · p. 24-25",
      summary: "Resolución urológica quirúrgica en HEDI, principalmente HEDI y HPH.",
      tags: ["Fournier", "Testículo agudo", "Urolitiasis", "HEDI", "HPH"],
      fields: [["Responsable", "Dr. Joan Bassa, Urología HEDI."], ["Prestaciones", "Nefrectomía, uretrectomía/plastía, ureterostomía, pielotomía, nefrostomía, cirugía litiasis renal, reparación quirúrgica."], ["Activación", "Jefe turno cirugía UEH Adultos HEDI."], ["Destino HPH", "Si cumple para HEDI, derivar a UEH Adultos HEDI."], ["Plazos", "Pertinencia ≤2 h; prestación ≤24 h."]],
      pathologies: [["Criterios", urologyCriteria]],
      moments: [{ title: "1. Doble tarea", text: "Llamar Articulador y presentar a HEDI.", steps: [`Articulador ${ARTICULADOR}.`, "Presentar a cirujano turno UEH Adultos HEDI.", "Informar médico receptor HEDI."] }, { title: "2. Pertinencia", text: "Cirugía HEDI define y activa urólogo.", steps: ["Autorización de traslado por HEDI.", "Coordinar Gestión de Camas.", "Depende de pabellón, anestesia y cama."] }, { title: "3. Retorno", text: "Cama HEDI o retorno con pase de Urología HEDI.", steps: commonReturn }],
      flow: ["Confirmar criterio urológico.", "Llamar Articulador.", "Presentar a HEDI.", "HEDI define pertinencia y activa urólogo.", "Derivar si procede.", "Procedimiento o retorno."],
      warning: "Confirmar rotativa: HPH puede ir a HEDI o HSR."
    },
    {
      slug: "neurologia-donante-2026",
      aliases: ["donante-neurologia", "posible-donante"],
      icon: "🧠",
      title: "Evaluación neurológica posible donante 2026",
      page: "Manual 2026 · p. 26",
      summary: "Evaluación neurológica y EEG para certificación de muerte encefálica en posible/potencial donante.",
      tags: ["Donante", "CLP", "EEG", "Muerte encefálica"],
      fields: [["Responsable", "Dr. Eduardo Cisternas, CLP HSR - SSMSO."], ["Prestaciones", "Evaluación neurológica para certificación de muerte encefálica e interpretación EEG."], ["Criterios", "Posible o potencial donante y ausencia de especialista."], ["Activación", "Coordinador Local de Procuramiento activa y completa encuesta."], ["Referencia", "No aplica."]],
      flow: ["Identificar posible/potencial donante.", "CLP confirma necesidad.", "CLP activa especialista por rotativa.", "Completar encuesta.", "Especialista evalúa y registra.", "EEG si corresponde."],
      warning: "Lo activa CLP, no urgencia de forma directa."
    },
    {
      slug: "patologia-arterial-2026",
      aliases: ["vascular-arterial", "patologia-arterial", "cirugia-vascular"],
      icon: "🫀",
      title: "Patología arterial de urgencia 2026",
      page: "Manual 2026 · p. 27-28",
      summary: "Resolución quirúrgica o endovascular de patología arterial urgente en HSR.",
      tags: ["Vascular", "Isquemia", "Aneurisma", "Disección", "UTU"],
      fields: [["Responsable", "Dr. Gabriel Seguel, Cirugía Vascular HSR."], ["Quirúrgico", "Reparación arterial central/periférica compleja, trombectomía abierta o bypass."], ["Endovascular", "Trombectomía arterial, reparación aneurisma/disección complicada, trombectomía venosa profunda, reparación trauma arterial."], ["Activación", "Jefe turno cirugía UEH HSR y/o Coordinador UTU HSR."], ["Plazos", "Pertinencia ≤2 h; prestación ≤24 h."]],
      pathologies: [["Criterios", ["Disección aórtica tipo B complicada", "Aneurisma roto", "Reconstrucción arterial compleja", "Isquemia aguda Rutherford 2b", "Isquemia mesentérica aguda", "Isquemia territorio esplácnico", "Flegmasia"]]],
      moments: [{ title: "1. Doble tarea", text: "Llamar Articulador y presentar a HSR.", steps: [`Articulador ${ARTICULADOR}.`, "Presentar a cirugía, UTU o jefe turno HSR.", "Entregar criterio y datos completos."] }, { title: "2. Destino", text: "HPH/HEDI con pertinencia: destino según contexto.", steps: ["Trauma: unidad indicada por UTU.", "No traumático: UEH HSR.", "APS deriva a hospital base."] }, { title: "3. Retorno", text: "Aneurisma roto suele quedar en HSR; disección aórtica aprox. 48 h en HSR antes de retorno si procede.", steps: commonReturn }],
      flow: ["Confirmar criterio vascular.", "Llamar Articulador.", "Presentar a cirugía/UTU HSR.", "HSR define pertinencia.", "Derivar según trauma/no trauma.", "Procedimiento, cama HSR o retorno."],
      warning: "El documento tiene una errata donde dice urólogo; por contexto corresponde cirujano vascular."
    },
    {
      slug: "doppler-extremidades-2026",
      aliases: ["tvp-sospecha-eco-y-horario-inhabil", "eco-tvp", "doppler", "tvp"],
      icon: "🦵",
      title: "Ecografía Doppler extremidades 2026",
      page: "Manual 2026 · p. 29-30",
      summary: "Doppler sábados, domingos y festivos 09:00-12:00 para sospecha de TVP ambulatoria en UEH.",
      tags: ["TVP", "Doppler", "Imagenología HSR", "Sala 9", "Cupos"],
      fields: [["Responsable", "Dr. Claudio Montenegro, Imagenología HSR."], ["Horario", "Sábados, domingos y festivos 09:00-12:00."], ["Población", "Mayores de 15 años, ambulatorios en UEH."], ["Cupos", "5 cupos diarios HPH/HEDI/CHSJM. 09:20, 09:50, 10:20, 10:50, 11:20."], ["Destino", "Sala ecografía N°9, Block Central HSR. No pasar por UEH HSR."], ["Formulario", "https://docs.google.com/forms/d/e/1FAIpQLSdkgwTx1dr00gxIMOdjIZVqibjhqYgwZqlmgmdSi_CfzbwQbg/viewform"]],
      moments: [{ title: "1. Antes de enviar", text: "HPH/HEDI llama antes de encuesta para asignar hora.", steps: [`Hábil: Coordinador Red Urgencia ${COORD_RED}.`, `Inhábil: Articuladora ${ARTICULADOR}.`, "Luego completar Google Forms."] }, { title: "2. Traslado", text: "Paciente llega 20 minutos antes.", steps: ["No se reciben después de 12:00.", "No pasar por UEH HSR.", "Orden médica con firma y timbre de jefe de turno."] }, { title: "3. Resultado", text: "Informe en RISPACS máximo 1 hora.", steps: ["Paciente retorna a hospital base.", "Hospital base define recepción y transporte."] }],
      flow: ["Sospecha TVP en paciente ambulatorio UEH >15 años.", "Confirmar sábado/domingo/festivo 09:00-12:00.", "Llamar para asignar hora.", "Completar Google Forms.", "Enviar directo a sala 9 HSR con orden firmada/timbrada.", "Retorno con resultado."],
      warning: "Cambio clave: directo a Imagenología HSR, no a UEH HSR."
    },
    {
      slug: "ecocardiografia-donante-2026",
      aliases: ["eco-donante", "ecocardiografia-donante"],
      icon: "🫀",
      title: "Ecocardiografía posible/potencial donante 2026",
      page: "Manual 2026 · p. 31",
      summary: "Cardiólogo ecografista 24/7 para eco e informe en posible/potencial donante.",
      tags: ["Donante", "Ecocardiograma", "CLP", "HEDI"],
      fields: [["Responsable", "Dr. Miguel Andrade, Cardiología HEDI."], ["Prestaciones", "Realización e informe de ecocardiograma."], ["Criterios", "Posible/potencial donante y ausencia de especialista."], ["Activación", "CLP Red Suroriente activa especialista y completa encuesta."], ["Referencia", "No aplica."]],
      flow: ["CLP identifica posible/potencial donante.", "Confirmar ausencia de especialista.", "CLP activa cardiólogo según rotativa.", "Completar encuesta.", "Realizar eco en establecimiento solicitante.", "Registrar informe."],
      warning: "No es derivación: es activación por CLP."
    },
    {
      slug: "acv-reperfusion-distancia-2026",
      aliases: ["acv-reperfusion", "evaluacion-neurologica-distancia", "trombolisis-acv"],
      icon: "🧠",
      title: "Evaluación neurológica a distancia ACV 2026",
      page: "Manual 2026 · p. 32-33",
      summary: "Teleconsulta neurológica para ACV isquémico en ventana y status epiléptico refractario.",
      tags: ["ACV", "Trombólisis", "Telemedicina", "NIHSS", "Status"],
      fields: [["Responsable", "Dr. Reinaldo Uribe, Neurología HSR."], ["Activación", `Articulador SSMSO ${ARTICULADOR}.`], ["CUD", "telemedicina.ssmso.cl"], ["Correo HPH", "teleconsultaacv@hurtadohosp.cl"], ["Correo HEDI", "saudHEDI@gmail.com"], ["Prestaciones", "Evaluación inicial, reevaluación post trombólisis y recontrol."]],
      pathologies: [["Inclusión ACV", ["Mayor de 18 años", "Déficit focal <4,5 h", "NIHSS ≥4 o déficit discapacitante", "MRS previo ≤3", "Glicemia >50 y <400", "TAC sin hemorragia"]], ["Exclusión", ["Neoplasia/MAV/aneurisma intracraneano", "ACV o TEC últimos 3 meses", "Hemorragia cerebral antigua", "Sin síntomas al evaluar", "Punción sitio no compresible <7 días", "Cirugía mayor últimas 2 semanas", "Hemorragia interna activa", "PAS >185 o PAD >110 pese a labetalol 20 mg en 2 bolos"]], ["Status epiléptico", ["Adultos o pediátricos", "Crisis en racimo", "Status clínico o electroencefalográfico", "Sin respuesta a tratamiento inicial"]]],
      moments: [{ title: "1. Activar", text: "Médico a cargo presenta al Articulador.", steps: [`Llamar ${ARTICULADOR}.`, "Articulador completa encuesta.", "Si cumple, contacta neurólogo."] }, { title: "2. Teleconsulta", text: "Neurólogo abre episodio CUD y videollamada.", steps: ["Enlace llega al correo del hospital.", "Especialista da indicaciones.", "Registro visible por VIAU."] }, { title: "3. Recontrol", text: "Post trombólisis o SOS sigue mismo flujo.", steps: ["Volver a llamar Articulador.", "Reevaluación o recontrol según necesidad."] }],
      flow: ["Confirmar ventana ACV o status refractario.", "TAC sin hemorragia si ACV.", "Llamar Articulador.", "Articulador valida y contacta neurólogo.", "Neurólogo abre CUD y videollamada.", "Ejecutar indicaciones."],
      warning: "No activar trombólisis si hay exclusión o PA no controlada según manual."
    }
  ];

  const flowBySlug = new Map(flows.map((f) => [f.slug, f]));
  const aliasToSlug = new Map();
  flows.forEach((f) => { aliasToSlug.set(f.slug, f.slug); f.aliases.forEach((a) => aliasToSlug.set(a, f.slug)); });

  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function addStyles() {
    if (document.getElementById("consultoria-flujos-2026-style")) return;
    const style = document.createElement("style");
    style.id = "consultoria-flujos-2026-style";
    style.textContent = `.consultoria-hub{display:grid;gap:14px;margin:0 0 14px}.consultoria-hub-hero{display:grid;gap:8px;padding:16px;color:#fff;background:linear-gradient(135deg,#1f2937,#be123c);border-radius:14px;box-shadow:var(--shadow)}.consultoria-hub-hero h2{margin:0;font-size:clamp(1.35rem,3vw,2rem);line-height:1.1}.consultoria-hub-hero p{margin:0;color:#ffe3ea;line-height:1.4}.consultoria-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.consultoria-flow-card{display:grid;gap:7px;min-height:128px;padding:14px;background:#fff;border:1px solid var(--line);border-top:5px solid #be123c;border-radius:12px;box-shadow:var(--shadow)}.consultoria-flow-card strong{font-size:1.04rem;line-height:1.15}.consultoria-flow-card span{font-size:1.7rem}.consultoria-flow-card small{color:var(--muted);line-height:1.25}.consultoria-detail{display:grid;gap:14px}.consultoria-detail .protocol-card{border-left:7px solid #be123c}.consultoria-detail .page-badge{background:#fff7f9;color:#be123c;border-color:#ffd0dd}.consultoria-detail .flow-step{border-left-color:#be123c}.consultoria-detail .step-number{background:#be123c}.consultoria-detail .moment-card{border-left-color:#be123c}.consultoria-detail .moment-card:nth-child(2){border-left-color:#0f766e}.consultoria-detail .moment-card:nth-child(3){border-left-color:#2563eb}.consultoria-transversal{border-left-color:#be123c}.consultoria-transversal ul{margin:0;padding-left:18px}.consultoria-transversal li{margin:4px 0;line-height:1.35}`;
    document.head.append(style);
  }
  function showPage(pageId) { document.querySelectorAll(".page").forEach((n) => n.classList.remove("active")); const page = document.getElementById(pageId); if (page) page.classList.add("active"); }
  function fieldMarkup(fields) { return fields?.length ? `<section class="detail-section"><div class="route-section-head"><strong>📌 Datos clave</strong></div><div class="grid">${fields.map(([k,v]) => `<div class="field"><strong>${escapeHtml(k)}</strong><span>${escapeHtml(v)}</span></div>`).join("")}</div></section>` : ""; }
  function tagsMarkup(tags) { return `<div class="tags">${(tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`; }
  function pathologiesMarkup(groups) { return groups?.length ? `<section class="detail-section"><div class="route-section-head"><strong>🔎 Criterios</strong></div><div class="pathologies">${groups.map(([title, items]) => `<div class="pathology-group"><h3>${escapeHtml(title)}</h3><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>`).join("")}</div></section>` : ""; }
  function momentsMarkup(moments) { return moments?.length ? `<section class="detail-section moments-panel"><div class="route-section-head"><strong>🧩 Momentos críticos</strong></div><div class="moment-grid">${moments.map((m) => `<article class="moment-card"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.text)}</p><ul>${(m.steps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></article>`).join("")}</div></section>` : ""; }
  function flowMarkup(flow) { return flow?.length ? `<section class="detail-section"><div class="route-section-head"><strong>✅ Pasos</strong></div><div class="flow">${flow.map((s, i) => `<div class="flow-step"><span class="step-number">${i+1}</span><p>${escapeHtml(s)}</p></div>`).join("")}</div></section>` : ""; }
  function renderFlow(flow) {
    showPage(protocolPageId);
    const title = document.querySelector("#protocolTitle"); const category = document.querySelector("#protocolCategory"); const detail = document.querySelector("#protocolDetail");
    if (title) title.textContent = `${flow.icon} ${flow.title}`;
    if (category) category.textContent = `Consultoría llamada 2026 · ${flow.page}`;
    if (!detail) return;
    detail.classList.add("consultoria-detail");
    detail.innerHTML = `<article class="protocol-card"><span class="page-badge">${escapeHtml(flow.page)}</span><p class="protocol-summary">${escapeHtml(flow.summary)}</p>${tagsMarkup(flow.tags)}</article>${fieldMarkup(flow.fields)}${pathologiesMarkup(flow.pathologies)}${momentsMarkup(flow.moments)}${flowMarkup(flow.flow)}${flow.warning ? `<div class="warning">${escapeHtml(flow.warning)}</div>` : ""}<section class="detail-section consultoria-transversal"><div class="route-section-head"><strong>📞 Activación transversal</strong></div><ul>${commonActivation.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></section>`;
  }
  function slugFromHash() { const hash = decodeURIComponent(window.location.hash || ""); if (hash.startsWith(consultoriaPrefix)) return hash.slice(consultoriaPrefix.length).split("?")[0]; if (hash.startsWith(protocolPrefix)) return hash.slice(protocolPrefix.length).split("?")[0]; return ""; }
  function patchRoute() { const slug = slugFromHash(); const target = aliasToSlug.get(slug); if (!target) return false; renderFlow(flowBySlug.get(target)); return true; }
  function hubMarkup() { return `<section class="consultoria-hub" data-consultoria-hub="true"><div class="consultoria-hub-hero"><h2>📞 Consultoría de llamada SSMSO 2026</h2><p>Flujos actualizados según Manual 2026. Usa estos accesos para prestaciones de llamada y derivación tiempo dependiente.</p></div><div class="consultoria-grid">${flows.map((f) => `<a class="consultoria-flow-card" href="${consultoriaPrefix}${f.slug}"><span>${f.icon}</span><strong>${escapeHtml(f.title)}</strong><small>${escapeHtml(f.summary)}</small></a>`).join("")}</div></section>`; }
  function patchSpecialtiesPage() { if (!window.location.hash.startsWith(specialtiesRoute)) return; const page = document.querySelector("#specialtiesPage"); if (!page || page.querySelector('[data-consultoria-hub="true"]')) return; const rules = document.querySelector("#rulesPreview"); if (rules) rules.insertAdjacentHTML("afterend", hubMarkup()); }
  function patchCallsPage() { if (!window.location.hash.startsWith(callsRoute)) return; const page = document.querySelector("#callsPage"); if (!page || page.querySelector('[data-consultoria-flujos-calls="true"]')) return; const head = page.querySelector(".page-head"); if (head) head.insertAdjacentHTML("afterend", `<section class="consultoria-hub" data-consultoria-flujos-calls="true">${hubMarkup()}</section>`); }
  function patch() { addStyles(); if (patchRoute()) return; patchSpecialtiesPage(); patchCallsPage(); }
  const observer = new MutationObserver(() => window.setTimeout(patch, 0)); if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => { setTimeout(patch, 50); setTimeout(patch, 250); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patch); else patch();
})();
