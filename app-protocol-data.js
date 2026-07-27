(() => {
  window.CRS_PROTOCOLS = [
  {
    title: "Antes de derivar",
    category: "Regla general",
    page: "p. 2",
    summary: "Reglas administrativas comunes para las derivaciones ambulatorias desde Urgencia Adulto HPH.",
    tags: ["Reglas", "Pitágoras", "APS", "IC"],
    fields: [
      ["Sistema válido", "Toda derivación se realiza por Pitágoras."],
      ["No validado", "Derivaciones por otros sistemas no están validadas administrativamente."],
      ["Fuera de flujo", "Paciente que no entra en los flujos descritos debe ser derivado a APS."]
    ],
    warning: "Las IC directas no Pitágoras serán devueltas directamente a quien las realiza."
  },
  {
    title: "Medicina Interna",
    category: "CRS",
    page: "p. 3",
    summary: "Derivación restringida a especialistas de Medicina Interna y Medicina de Urgencia.",
    tags: ["Poli Alta Urgencia", "Módulo Docente", "Especialista"],
    fields: [
      ["Quién deriva", "Exclusivamente especialistas en Medicina Interna y Medicina de Urgencia."],
      ["Destino", "IC a Poli Alta Urgencia."],
      ["Documentos", "Debe ir con IC/DAU a Módulo Docente."]
    ]
  },
  {
    title: "Poli TACO",
    category: "CRS",
    page: "p. 4",
    summary: "Derivación directa para control en poli TACO.",
    tags: ["TACO", "Pitágoras", "DAU"],
    fields: [
      ["Indicación", "IC por Pitágoras e indicación en DAU."],
      ["Destino", "Paciente va directamente a poli TACO a pedir hora."]
    ]
  },
  {
    title: "Sala Pulso",
    category: "Flujo",
    page: "p. 5",
    summary: "Coordinación de tratamientos ambulatorios, especialmente transfusión, con requisitos previos claros.",
    tags: ["Transfusión", "Grupo/Rh", "Banco de Sangre", "Horario hábil", "Horario inhábil"],
    fields: [
      ["IC", "Realizar IC en Pitágoras a “IC Sala Pulso”."],
      ["Urgencia", "Escribir la urgencia del tratamiento: por ejemplo TX GR lo antes posible, en una semana, etc."],
      ["Horario hábil", "Coordinar con EU Bárbara Borie: +56993124816, llamada o mensaje."],
      ["Horario inhábil", "Enviar correo con información del paciente a admpulsos@gmail.com y citar al próximo día hábil."],
      ["Antes de derivar", "Orden de transfusión y grupo/Rh tomado en Urgencia; enviar al Banco de Sangre."],
      ["Texto clínico", "Dejar indicación clara: por ejemplo Hb 5.8, se dializa, cardiopatía, etc."]
    ],
    flow: [
      "Crear IC Pitágoras a “IC Sala Pulso”.",
      "Definir urgencia del tratamiento en DAU/IC.",
      "Coordinar hora según horario hábil o inhábil.",
      "Emitir orden de transfusión y tomar grupo/Rh en Urgencia.",
      "Dejar texto clínico explícito para justificar indicación."
    ],
    warning: "No decir al paciente que vaya a transfundirse inmediatamente, sobre todo si no tiene hora agendada."
  },
  {
    title: "EDA",
    category: "Flujo",
    page: "p. 6",
    summary: "Distingue EDA ambulatoria coordinada de EDA por llamado.",
    tags: ["Endoscopía", "Jefatura", "EDA"],
    fields: [
      ["EDA de estudio", "No se realiza desde este flujo; debe hacerse a través de consultorio."],
      ["Casos coordinados", "Con Endoscopía y Jefatura se autoriza IC a Poli EDA."],
      ["Autorizados", "Dr. Gutiérrez, Dra. Marín, Dr. Yaksic, Dr. González."],
      ["EDA llamado", "Ceñirse al protocolo actual; jefe de turno coordina llamado."]
    ]
  },
  {
    title: "Poli Choque ORL",
    category: "Poli choque",
    page: "p. 7",
    summary: "Derivación ORL desde alta u hospitalización en Urgencia.",
    tags: ["ORL", "08:00-10:00", "Anexo"],
    fields: [
      ["Alta desde Urgencia", "DAU + interconsulta Pitágoras."],
      ["Horario", "08:00 a 10:00 hrs."],
      ["Hospitalizado en Urgencia", "Llamar al anexo 260532/260533 para coordinar."],
      ["Epistaxis anterior de alta", "Control en APS/consultorio."]
    ],
    pathologies: [
      ["Choque ORL", ["Otomastoiditis", "Laberintitis", "Parálisis facial periférica", "Fístula laberíntica", "Abscesos subperiósticos", "Petrositis", "Otitis externa complicada", "Otitis externa micótica", "Trauma ótico", "Cuerpo extraño nasal", "Cuerpo extraño del oído", "Hipoacusia súbita", "Fractura nasal y/o hematoma septal"]],
      ["Urgencia", ["Meningitis", "Abscesos y colecciones intracraneales", "Empiema subdural", "Tromboflebitis seno lateral", "Epistaxis posterior", "Absceso periamigdalino", "Absceso submandibular", "Absceso parafaríngeo", "Absceso retrofaríngeo", "Cuerpo extraño vía aéreo-digestiva superior"]],
      ["Consultorio", ["Otitis externa", "Tapón de cerumen", "Epistaxis anterior"]]
    ]
  },
  {
    title: "Poli Choque Oftalmología",
    category: "Poli choque",
    page: "p. 8",
    summary: "HPH no tiene poli choque oftalmológico; el destino depende de emergencia, horario y condición.",
    tags: ["Oftalmo", "UTO", "HSDR", "Trauma ocular", "Glaucoma"],
    fields: [
      ["HPH", "No existe poli choque oftalmológico en HPH."],
      ["Emergencia inhábil", "Glaucoma agudo con alta sospecha o trauma ocular: derivar a UTO Hospital Salvador."],
      ["Horario UTO", "Lunes a domingo 08:00 - 20:00 hrs."],
      ["Resto urgencias oftalmo", "Poli Choque Oftalmo HSDR, Sótero CDT pasillo 10, DAU + IC por Pitágoras."],
      ["Horario HSDR", "Lunes, martes, jueves y viernes 08:00; miércoles 14:00. Deben llegar antes."],
      ["Hospitalizado por patología oftalmo", "Ir al CRS y hablar con oftalmólogo."]
    ],
    warning: "No derivar como poli choque HPH: el documento explicita que no existe en HPH."
  },
  {
    title: "Dermatología",
    category: "Poli choque",
    page: "p. 9",
    summary: "Poli choque dermatología para pacientes ambulatorios y contacto directo para hospitalizados.",
    tags: ["Dermato", "Módulo Docente", "Especialista"],
    fields: [
      ["Ambulatorio", "Ir a las 08:00 hrs al pasillo Módulo Docente con IC “Poli Dermato” + DAU."],
      ["Quién puede hacer IC", "Sólo especialistas del turno."],
      ["Atención", "Se asignará hora; puede que no lo vean el mismo día."],
      ["Hospitalizado", "Ir directamente a pasillo dermatología."]
    ]
  },
  {
    title: "Medicina Paliativa",
    category: "Poli choque",
    page: "p. 10",
    summary: "Derivación a paliativos desde urgencia, incluyendo debut de cáncer.",
    tags: ["Paliativos", "Cáncer", "Especialista"],
    fields: [
      ["Poli choque", "Lunes a viernes a las 14:00 hrs, DAU + IC por especialista."],
      ["Hospitalizado", "Avisar que existe paciente para seguimiento."],
      ["Debut de cáncer", "Derivar con DAU + IC; no es necesario tener IPD de Paliativos."]
    ]
  },
  {
    title: "Maxilofacial",
    category: "Hospitalizados",
    page: "p. 11",
    summary: "HPH no tiene prestación formal de urgencia maxilofacial.",
    tags: ["Maxilo", "HSDR", "Anexo"],
    hidePriority: true,
    fields: [
      ["HPH", "La prestación maxilofacial HPH no existe formalmente; no hay urgencia maxilofacial."],
      ["Destino", "Derivar a Urgencia HSDR, anexo 262356."],
      ["Hospitalizados", "Presentar a equipo Maxilo HPH, Dr. Passalacqua, para seguimiento en piso."],
      ["Controles", "Controles maxilofaciales se derivan a CRS HPH, no HSR."]
    ]
  },
  {
    title: "Urología",
    category: "CRS",
    page: "p. 12",
    summary: "Flujo urológico parcial descrito para sonda Foley y diagnósticos CRS.",
    tags: ["Uro", "Sonda Foley", "APS"],
    fields: [
      ["Poli choque", "Sonda Foley con IC por Pitágoras."],
      ["CRS Urología", "Por diagnósticos definidos en el flujo local."],
      ["Resto", "Resto de diagnósticos: derivación desde APS."]
    ],
    pathologies: [
      ["CRS Urología por diagnósticos", ["Tumor maligno del riñón, excepto pelvis renal", "Tumor maligno del testículo no descendido", "Tumor maligno del testículo descendido", "Tumor maligno del testículo no especificado", "Tumores malignos de vejiga: trígono, cúpula, paredes lateral/anterior/posterior, cuello, orificio ureteral, uraco, sitios contiguos o parte no especificada"]]
    ]
  },
  {
    title: "Urgencia Maternidad",
    category: "Flujo",
    page: "p. 13",
    summary: "Coordinación con maternidad para pacientes estables y caso a caso para no estables.",
    tags: ["Maternidad", "Anexos", "Estable"],
    fields: [
      ["Paciente estable", "IC por Pitágoras y aviso telefónico o presencial a maternidad para coordinación."],
      ["Sistema", "Deben ser egresadas del sistema Adulto."],
      ["Paciente no estable", "Pedir evaluación caso a caso al equipo de urgencia maternidad."],
      ["Anexos", "260659, 260653; residencia médico 260649."]
    ]
  },
  {
    title: "Cirugía",
    category: "CRS",
    page: "p. 14-17",
    summary: "Derivación a CRS con DAU + IC Pitágoras; otros diagnósticos desde APS.",
    tags: ["Cirugía", "DAU", "IC", "APS"],
    fields: [
      ["Destino", "Derivación a CRS."],
      ["Documentos", "DAU + IC por Pitágoras."],
      ["Resto diagnósticos", "Deben ser derivados desde APS al CRS."]
    ],
    pathologies: [
      ["Cirugía abdominal", ["Patología biliar: colecistitis, colelitiasis, coledocolitiasis y colangitis", "Tumores digestivos: esófago, estómago, duodeno, intestino delgado, colon, rectosigmoides, recto, ano/conducto anal", "Tumores hepatobiliares y pancreáticos: vesícula, vías biliares, ampolla de Vater, hígado y páncreas", "Hernia diafragmática con o sin obstrucción/gangrena", "Quiste de páncreas"]],
      ["Cirugía adulto", ["Hernia ventral con obstrucción", "Hernia ventral con gangrena", "Hernia ventral sin obstrucción ni gangrena"]],
      ["Cirugía plástica", ["Heridas por arma de fuego o arma blanca", "Herida complicada, simple, cortante, infectada o contusa", "Herida con lesión de tendón, nervio periférico o compromiso articular", "Absceso, seroma, hemorragia, infección o dehiscencia de herida operatoria"]],
      ["Cabeza, cuello y maxilofacial", ["Absceso cutáneo, furúnculo y carbunco del cuello", "Tumor maligno de cabeza, cara y cuello"]],
      ["Coloproctología", ["Apendicitis aguda con peritonitis, absceso o no especificada", "Tumores de ciego, apéndice, colon, recto y ano", "Fístula anal", "Absceso rectal", "Hemorroides de tercer y cuarto grado"]],
      ["Tórax", ["Tumores de bronquio y pulmón", "Tumor maligno de costilla, esternón y clavícula", "Tumor maligno secundario del pulmón", "Hernia diafragmática"]],
      ["Vascular", ["Aneurismas de aorta, miembro superior, renal, ilíaca, miembro inferior u otras arterias", "Embolia y trombosis de arterias de miembros inferiores", "Estrechez arterial", "Complicaciones circulatorias periféricas asociadas a diabetes"]]
    ]
  },
  {
    title: "TVP - sospecha, ECO y horario inhábil",
    category: "Flujo",
    page: "p. 18-19 / Doc. 2025",
    summary: "Ruta única para sospecha de TVP, coordinación de ECO y solicitud en horario inhábil.",
    tags: ["TVP", "Dímero D", "Eco", "ECO Doppler", "Sótero del Río", "CASR", "Horario inhábil", "Enoxaparina", "Poli TACO", "Domiciliaria"],
    hidePriority: true,
    fields: [
      ["Sospecha inicial", "Alta sospecha clínica: solicitar dímero D y exámenes basales según flujo."],
      ["ECO disponible HPH", "Si ECO confirma TVP, rayos deriva directo a Poli TACO, no a Urgencia."],
      ["Horario inhábil entre semana", "Derivar a Poli TVP al día hábil siguiente en rayos, 08:00-10:00 o 14:00-16:00."],
      ["Fin de semana o feriado", "Activar ruta Sótero del Río con cupo definido si la indicación clínica corresponde."]
    ],
    moments: [
      {
        title: "1. Sospecha TVP",
        text: "Paciente con sospecha clínica: dímero D, creatinina, perfil hematológico y coagulación.",
        steps: ["Si dímero positivo y no hay ECO: anticoagulación según evaluación clínica.", "Derivar a Poli TVP al día hábil siguiente en rayos."]
      },
      {
        title: "2. ECO disponible / TVP confirmada",
        text: "Si el ECO confirma TVP, definir destino según horario y disponibilidad de domiciliaria.",
        steps: ["Rayos deriva directo a Poli TACO cuando corresponde.", "No enviar de vuelta a Urgencia sólo para gestionar hora si el flujo ya está resuelto."]
      },
      {
        title: "3A. Inhábil entre semana",
        text: "Si ocurre en horario inhábil de lunes a viernes y no corresponde ruta Sótero, continuar al día hábil siguiente.",
        steps: ["Derivar a “Poli TVP” al día hábil siguiente en rayos.", "Horarios: 08:00-10:00 o 14:00-16:00.", "Dejar indicación y anticoagulación según evaluación clínica."]
      },
      {
        title: "3B. Fin de semana / feriado",
        text: "Si requiere ECO y es fin de semana o feriado, activar ruta Sótero del Río con cupo definido.",
        steps: ["Llamar a articuladora de red: +569 9253 7195.", "Completar cuestionario tras asignación de hora.", "Destino: Sala 9 Imagenología, block central CASR.", "Informe disponible aproximadamente en 1 hora; paciente vuelve a HPH para resultado."],
        alert: "Derivar a Imagenología CASR, no a la Urgencia. Confirmar siempre indicación clínica, horario y retorno para resultado."
      }
    ],
    flow: [
      "Paciente con alta sospecha clínica de TVP.",
      "Tomar dímero D.",
      "Si dímero positivo y no hay eco: enoxaparina.",
      "Si es inhábil entre semana: derivar a “Poli TVP” al día hábil siguiente en rayos, 08:00-10:00 o 14:00-16:00.",
      "Si es fin de semana o feriado y requiere ECO: activar ruta Sótero del Río con cupo definido.",
      "Si TVP confirmada: seguir destino según horario, domiciliaria o Poli TACO."
    ],
    sourceDocs: [
      ["Flujo ECO TVP Sótero del Río", "./protocol-docs/flujo-eco-tvp-sotero-del-rio.pdf"],
      ["Resumen TVP HPH", "./protocol-docs/resumen-tvp-hph.jpg"],
      ["ECO Doppler horario inhábil 2025", "./protocol-docs/eco-doppler-horario-inhabil-2025.pdf"]
    ],
    formKey: "ecoTvpSoteroUrl",
    formTitle: "Formulario ECO TVP / ECO Doppler",
    formLabel: "Abrir formulario ECO TVP"
  },
  {
    title: "Enlaces",
    category: "Regla general",
    page: "p. 20",
    summary: "Regla para interconsultas a especialista.",
    tags: ["Especialista", "Visita", "Hospitalización"],
    fields: [
      ["Antes de llamar", "Toda interconsulta a especialista debe conversarse en la visita o al momento de hospitalización con el especialista de turno."]
    ],
    warning: "No llamar sin haber hecho esto antes."
  },
  {
    title: "Nefro y Diálisis",
    category: "Flujo",
    page: "p. 21",
    summary: "Coordinación de diálisis según horario.",
    tags: ["Nefro", "Diálisis", "Anexo", "Horario hábil", "Horario inhábil"],
    fields: [
      ["Horario hábil", "08:00 - 17:00, lunes a jueves: llamar a diálisis 260709 para presentar paciente y ver qué nefrólogo está de llamado."],
      ["Horario inhábil", "Viernes, fines de semana e inhábil: llamar a Nefro de turno."],
      ["Alcance", "Sólo para programar diálisis; calendario se enviará periódicamente."]
    ]
  },
  {
    title: "Viruela símica",
    category: "Protocolo",
    page: "Doc. feb 2023",
    summary: "Flujo actualizado para sospecha de viruela símica en SEA HPH, coordinación con UHD, SEREMI y Epidemiología HPH.",
    tags: ["Viruela símica", "UHD", "SEREMI", "Epidemiología", "Aislamiento"],
    fields: [
      ["Inicio del flujo", "APS pesquisa paciente sospechoso, toma muestra y deriva a UHD; si requiere hospitalización, contacta a jefe de turno SEA HPH."],
      ["Recepción HPH", "Coordinar caso aceptado para evaluación en box 0. El box 0 es de uso transitorio y debe limpiarse luego de la atención."],
      ["Criterios de hospitalización", "Hospitalizar si hay requerimiento de oxígeno o neumonía, encefalitis, necesidad de antibiótico endovenoso por infección secundaria o dolor intratable."],
      ["SEREMI", "Si se confirma sospecha, llamar a SEREMI +56 9 8900 1761 para notificar sospecha y severidad."],
      ["Epidemiología HPH", "Avisar siempre a Epidemiología HPH. Horario hábil: Jessica Serrano +56 9 9873 9340. Inhábil: emergentes@hurtadohosp.cl."],
      ["Hospitalización", "Llamar a residente de Medicina para aislamiento urgente en sala y coordinar con Gestión de Camas."]
    ],
    flow: [
      "Confirmar sospecha clínica y epidemiológica.",
      "Usar box 0 sólo como tránsito para evaluación inicial.",
      "Buscar diagnóstico alternativo y confirmar si cumple criterios de sospecha.",
      "Si sospecha se mantiene, avisar a SEREMI y Epidemiología HPH.",
      "Definir aislamiento domiciliario u hospitalización según severidad.",
      "Enviar formularios y documentación solicitada después de validación SEREMI."
    ],
    sourceDocs: [
      ["Flujo Viruela símica", "./protocol-docs/flujo-viruela-simica.pdf"]
    ],
    warning: "Flujo sensible a cambios sanitarios: confirmar indicaciones vigentes con SEREMI/Epidemiología si hay dudas."
  },
  {
    title: "Neurología",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Flujos neurológicos 2025: neurorradiología intervencional, evaluación a distancia para reperfusión y posible donante.",
    tags: ["Neurología", "Neuro", "ACV", "Stroke", "Trombectomía", "Trombólisis", "HSA", "Donante", "CASR"],
    hidePriority: true,
    fields: [
      ["Centro de referencia", "CASR."],
      ["Teléfonos CASR", "Estación de enfermería 2 2576 2662 / 2 2576 2363; reanimador UEH adultos 2 2576 2353; médico coordinador UEH adultos 9 9998 0214."],
      ["Especialistas", "Neurólogo de turno 9 4448 1955; neurocirujano de turno 2 2576 2284."],
      ["Gestión de camas", "Para procedimientos o traslados, coordinar con Gestión de Camas CASR y asegurar retorno al hospital de origen cuando corresponda."]
    ],
    moments: [
      {
        title: "1. Neurorradiología intervencional",
        text: "Para mayores de 15 años de la red sur-oriente que requieren procedimiento neurointervencional.",
        steps: ["Prestaciones: angiografía cerebral diagnóstica y tratamiento endovascular, incluyendo trombectomía mecánica/embolización.", "Criterios: oclusión aguda de arterias cerebrales, HSA por aneurisma roto, vasoespasmo en HSA o malformaciones arteriovenosas rotas.", "Activación: neurólogo de turno CASR o neurocirujano de turno CASR."]
      },
      {
        title: "2. Evaluación neurológica a distancia",
        text: "Respuesta telemática para pacientes con ACV isquémico en ventana y criterios de reperfusión.",
        steps: ["Alcance: mayores de 18 años de la red sur-oriente.", "Prestaciones: consulta neurología y reevaluación post trombólisis.", "Criterios: ACV en ventana o status epiléptico.", "Activación: articulador de la red del Servicio de Salud.", "Considera 3 llamados: evaluación inicial, control post trombólisis y recontrol si es necesario."]
      },
      {
        title: "3. Posible donante",
        text: "Apoyo neurológico para proceso de donación de órganos cuando no se disponga de especialista local por rotativa regular.",
        steps: ["Alcance: pacientes pediátricos y adultos de la red sur-oriente.", "Prestación: evaluación neurológica más informe EEG.", "Criterio: posible o potencial donante.", "Activación: CLP CASR - SSMSO."]
      }
    ],
    flow: [
      "Identificar cuál de los 3 flujos aplica: neurointervencional, evaluación a distancia o posible donante.",
      "Contactar al referente indicado según el flujo.",
      "Coordinar Gestión de Camas CASR si requiere procedimiento, traslado, cama o retorno.",
      "Registrar indicaciones y comunicación en la ficha clínica."
    ],
    sourceDocs: [
      ["Flujos Neuro 2025", "./protocol-docs/flujos-neuro-2025.pdf"]
    ],
    warning: "El PDF contiene flujogramas escaneados: revisar documento completo antes de activar traslado o procedimiento."
  },
  {
    title: "Hemorragia digestiva alta",
    category: "Flujo",
    page: "Doc. sep 2024",
    summary: "Resumen operativo para sospecha de hemorragia digestiva alta y priorización de EDA según riesgo.",
    tags: ["HDA", "EDA", "Blatchford", "Shock", "Várices"],
    fields: [
      ["Sospecha", "Melena con o sin hematemesis."],
      ["EDA urgente", "Indicar EDA urgente si hay sospecha clínica de várices o shock hemorrágico."],
      ["Blatchford 0-1", "Riesgo muy bajo: alta y control por Poli EDA según juicio clínico."],
      ["Blatchford 2", "Riesgo bajo: controlar hemoglobina/BUN en 4 a 6 horas; si estable, alta y Poli EDA."],
      ["Blatchford ≥3", "EDA antes de 24 horas."],
      ["Tratamiento base", "Si DHC: ceftriaxona 2 g. Si várices: terlipresina 1-2 mg EV. Transfusión restrictiva con meta Hb >7. Omeprazol 80 mg EV bolo."]
    ],
    flow: [
      "Confirmar sospecha de HDA.",
      "Evaluar shock hemorrágico o sospecha de várices.",
      "Calcular Blatchford y definir conducta.",
      "Presentar cada caso a jefe de turno o especialista de turno.",
      "Aplicar tratamiento inicial según contexto clínico."
    ],
    sourceDocs: [
      ["HDA Septiembre 2024", "./protocol-docs/hda-sept2024.pdf"]
    ],
    warning: "Todo caso debe presentarse a jefe de turno o especialista de turno; el juicio clínico prevalece."
  },
  {
    title: "Hemodinamia 2025",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Documento actualizado para activación o derivación a Hemodinamia 2025.",
    tags: ["Hemodinamia", "Cardiología", "2025", "Documento escaneado"],
    fields: [
      ["Consulta rápida", "El PDF no entregó texto extraíble confiable; abrir el documento completo para revisar criterios, contactos y secuencia."],
      ["Uso sugerido", "Mantener como acceso directo al flujo vigente mientras se transcribe el algoritmo definitivo."]
    ],
    sourceDocs: [
      ["Hemodinamia 2025", "./protocol-docs/hemodinamia-2025.pdf"]
    ],
    warning: "Documento escaneado: antes de actuar, revisar el PDF completo."
  },
  {
    title: "Hemorragia intracerebral",
    category: "Flujo",
    page: "Doc. 2024",
    summary: "Flujograma HIC SEA HPH 2024 con metas de presión, manejo inicial y reversión de coagulopatía.",
    tags: ["HIC", "ACV hemorrágico", "PAS", "Labetalol", "Urapidil", "TACO"],
    fields: [
      ["Meta inicial", "PAS <140 mmHg en 1 hora, con línea arterial cuando corresponda."],
      ["Si PAS >140", "Labetalol 10-20 mg EV bolo; controlar PA en 5 minutos. Luego BIC 0,5-3 mg/min EV, máximo 300 mg/día."],
      ["Si contraindicación a labetalol", "Si FC <50, BAV o asma descompensada: urapidil 12,5 mg EV bolo; si persiste PAS >140, urapidil 25 mg y luego BIC 5 mg/h, máximo 30 mg/h."],
      ["Glicemia", "Meta HGT 100-140 sin diabetes y 140-180 en diabetes."],
      ["Reversión TACO", "Si INR >1,5 usar vitamina K y PFC. PCC 1500-2000 U EV sólo en paciente funcional, con riesgo de congestión y autorización de jefatura."]
    ],
    flow: [
      "Confirmar ACV hemorrágico/HIC.",
      "Iniciar meta de PAS <140 en la primera hora.",
      "Elegir labetalol o urapidil según frecuencia cardiaca, BAV y asma.",
      "Controlar glicemia dentro de metas.",
      "Evaluar reversión de anticoagulación si corresponde."
    ],
    sourceDocs: [
      ["HIC 2024", "./protocol-docs/hic2024.pdf"]
    ]
  },
  {
    title: "Patología aguda de columna",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Flujo de derivación a UEH adultos HDSR para patología aguda de columna con criterios de urgencia.",
    tags: ["Columna", "HDSR", "Neurocirugía", "RNM", "Gestión de camas"],
    fields: [
      ["Destino inicial", "Médico HPH deriva a UEH adultos HDSR e informa traslado."],
      ["Primer contacto", "Contactar primero a estación de enfermería UEH adultos HDSR."],
      ["Pertinencia", "Cirujano o urgenciólogo HDSR define pertinencia según criterios de urgencia; si corresponde, contacta a especialista de columna."],
      ["RNM", "Si se requiere RNM, el paciente espera en HDSR."],
      ["Retorno", "Si no es pertinente o se descarta urgencia, paciente vuelve a hospital de base; HPH debe asegurar recepción/cama."],
      ["Coordinación", "Debe existir comunicación por correo y teléfono entre Gestión de Camas para derivación, cama y retorno."]
    ],
    flow: [
      "Definir sospecha de patología aguda de columna.",
      "Llamar a UEH adultos HDSR y avisar traslado.",
      "HDSR evalúa pertinencia por criterios de urgencia.",
      "Especialista decide necesidad quirúrgica o estudio urgente.",
      "Si no requiere manejo urgente, coordinar retorno a HPH."
    ],
    sourceDocs: [
      ["Patología aguda de columna 2025", "./protocol-docs/patologia-aguda-columna-2025.pdf"]
    ],
    warning: "Patología de columna no urgente debe seguir derivación por Gestión de Camas, no traslado urgente."
  },
  {
    title: "Patología urología de urgencia 2025",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Estrategia de resolución de patología urológica de urgencia en horario no hábil.",
    tags: ["Urología", "Horario inhábil", "Urgencia", "2025"],
    fields: [
      ["Horario cubierto", "Lunes a jueves 17:00-08:00, viernes 16:00 a lunes 08:00, incluyendo festivos."],
      ["Horario hábil", "En horario hábil contactar a urólogo de llamado HPH."],
      ["Alcance", "Documento de respaldo para resolver patología urológica urgente según disponibilidad del flujo."]
    ],
    sourceDocs: [
      ["Patología Urología de Urgencia 2025", "./protocol-docs/patologia-urologia-urgencia-2025.pdf"]
    ],
    warning: "Confirmar disponibilidad real del urólogo de llamado antes de derivar o activar el flujo."
  },
  {
    title: "Radiología Intervencional 2025",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Documento actualizado de Radiología Intervencional 2025 para consulta directa del PDF completo.",
    tags: ["Radiología Intervencional", "Procedimiento", "2025", "Documento escaneado"],
    fields: [
      ["Consulta rápida", "El documento viene escaneado; abrir el PDF completo para revisar indicaciones, contactos y requisitos."],
      ["Uso sugerido", "Utilizar como acceso directo al flujo vigente de Radiología Intervencional."]
    ],
    sourceDocs: [
      ["Radiología Intervencional 2025", "./protocol-docs/radiologia-intervencional-2025.pdf"]
    ],
    warning: "Documento escaneado: revisar el PDF completo antes de activar el flujo."
  },
  {
    title: "Violencia sexual",
    category: "Protocolo",
    page: "Doc. SSMSO",
    summary: "Resumen de protocolo de violencia sexual y coordinación con unidad clínica forense hospitalaria.",
    tags: ["Violencia sexual", "SSMSO", "Forense", "CASR"],
    hidePriority: true,
    fields: [
      ["Unidad de referencia", "Unidad clínica forense hospitalaria del Complejo Asistencial Sótero del Río."],
      ["Derivación", "Si no se puede realizar la denuncia o procedimiento en HPH, contactar a la unidad correspondiente y trasladar en ambulancia."],
      ["Documento fuente", "Revisar el PDF completo para pasos, tiempos y responsabilidades específicas."]
    ],
    sourceDocs: [
      ["Resumen Protocolo Violencia Sexual", "./protocol-docs/resumen-protocolo-violencia-sexual.pdf"]
    ],
    warning: "Protocolo sensible: no copiar datos identificables en la app; revisar documento completo y normativa vigente."
  },
  {
    title: "Agresión a funcionarios",
    category: "Protocolo",
    page: "Anexo 4",
    summary: "Flujograma institucional ante agresión a funcionario, con seguridad, constatación de lesiones, denuncia y derivación ACHS.",
    tags: ["Agresión", "Funcionario", "Seguridad", "ACHS", "Carabineros"],
    hidePriority: true,
    fields: [
      ["Primer paso", "Funcionario agredido debe retirarse del sitio y avisar a jefe directo; jefatura llama a personal de seguridad."],
      ["Continuidad de atención", "Jefe directo evalúa continuar o suspender la atención en el área, resguardando usuarios y funcionarios."],
      ["Seguridad", "Personal de seguridad acude de inmediato; si no logra controlar la situación, llama a Carabineros."],
      ["Lesiones", "Funcionario debe constatar lesiones en Servicio de Emergencia Adulto."],
      ["Correo institucional", "Funcionario y/o jefatura envía antecedentes a infoagresionafuncionario@hurtadohosp.cl y realiza denuncia a Carabineros."],
      ["ACHS", "Jefatura deriva a ACHS mediante UIC llamando al 1404; si rechaza atención, debe firmar excepción correspondiente."]
    ],
    flow: [
      "Retirar al funcionario del lugar y avisar a jefatura directa.",
      "Activar seguridad y evaluar suspensión del proceso de atención.",
      "Constatar lesiones en Urgencia Adulto.",
      "Enviar antecedentes y realizar denuncia a Carabineros.",
      "Derivar a ACHS/UIC si corresponde.",
      "Si el agresor es paciente y se evalúa alta disciplinaria, jefatura solicita evaluación a Dirección."
    ],
    sourceDocs: [
      ["Flujograma agresión a funcionarios", "./protocol-docs/agresion-funcionarios.jpg"]
    ],
    warning: "Ante riesgo activo, priorizar seguridad del equipo y usuarios."
  },
  {
    title: "NIT",
    category: "Protocolo",
    page: "Referencia",
    summary: "Referencia rápida de niveles de intensidad terapéutica para acordar alcance de medidas diagnósticas y terapéuticas.",
    tags: ["NIT", "UCI", "VM", "RCP", "IOT", "Confort"],
    hidePriority: true,
    fields: [
      ["Nivel 1", "Paciente tributario de todas las medidas diagnósticas y terapéuticas, incluyendo RCP e IOT para ventilación mecánica. Tributario de UCI."],
      ["Nivel 2", "Tributario de todas las medidas terapéuticas, incluida VMNI, DVA, hemodiálisis, transfusiones o nutrición parenteral, exceptuando RCP e IOT para VM. No tributario de UCI."],
      ["Nivel 3-A", "Ante proceso intercurrente, iniciar una medida de nivel 2 en forma temporal, pactando retiro si hay mala evolución en tiempo acordado."],
      ["Nivel 3-B", "No incorporación de nuevas medidas."],
      ["Nivel 3-C", "Retirada gradual de todas las medidas."],
      ["Nivel 4", "Tratamiento sintomático y de confort, habitualmente paciente en situación de últimos días. Incluye retiro de alimentación, hidratación y oxigenoterapia según el caso."]
    ],
    sourceDocs: [
      ["Tabla NIT", "./protocol-docs/nit.jpg"]
    ],
    warning: "Registrar claramente el nivel acordado y reevaluar si cambia la condición clínica."
  }
];
})();
