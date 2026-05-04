const protocols = [
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

const externalDocs = {
  llamadosUrl: "",
  uhdDisponibilidadUrl: "",
  visitaDiariaUrl: "https://docs.google.com/spreadsheets/d/14-90hMv4JciofpxQz8TTEXwLHxvKb4iNmOGrpQACmpQ/edit?usp=drive_link"
};

const externalForms = {
  ecoTvpSoteroUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdkgwTx1dr00gxIMOdjIZVqibjhqYgwZqlmgmdSi_CfzbwQbg/viewform",
  antimicrobianosHphUrl: "https://docs.google.com/forms/d/e/1FAIpQLScwwKbXlot8vopzZAt2KIUxaIb_JbNE0pf4eecQEJ6OmOoOJw/viewform",
  leyUrgenciasUrl: "",
  leyUrgenciasConsentimientoUrl: "",
  medicamentosUsoOcasionalUrl: "",
  solicitudVihUrl: "",
  notificacionObligatoriaUrl: ""
};

const emergencyLawDecreeUrl = "./protocol-docs/decreto-34-25-oct-2022.pdf";
const emergencyLawConditions = window.emergencyLawConditions || [];
const emergencyLawGroups = [
  {
    id: "respiratorio",
    title: "Respiratorio",
    description: "Vía aérea, oxigenación y ventilación.",
    categories: ["Respiratoria", "Respiratoria/Trauma"]
  },
  {
    id: "cardiovascular",
    title: "Cardiovascular",
    description: "Shock, ritmo, presión y perfusión.",
    categories: ["Circulatoria", "Circulatoria/Neurológica", "Vascular", "Vascular/Trauma"]
  },
  {
    id: "neurologia",
    title: "Neurología",
    description: "Conciencia, déficit focal y cráneo.",
    categories: ["Neurológica", "Neurológica/Trauma", "Neurológica/Infectológica"]
  },
  {
    id: "trauma",
    title: "Trauma",
    description: "Alta energía, heridas y fracturas.",
    categories: ["Trauma", "Trauma/Sistémica", "Trauma/Piel", "Quemados"]
  },
  {
    id: "digestivo-quirurgico",
    title: "Digestivo / quirúrgico",
    description: "Abdomen, sangrado y urgencia quirúrgica.",
    categories: ["Gastroenterológica", "Quirúrgica"]
  },
  {
    id: "infeccioso-metabolico",
    title: "Infeccioso / metabólico",
    description: "Sepsis, toxicología y descompensación.",
    categories: ["Infectológica", "Toxicología", "Metabólica", "Endocrinológica", "Nefrológica"]
  },
  {
    id: "otros",
    title: "Otros sistemas",
    description: "Urología, ORL, oftalmo, piel y salud mental.",
    categories: ["Urológica", "Oftalmológica", "ORL", "Piel/Infectológica", "Inmunoalérgica", "Hemato-oncológica", "Psiquiátrica", "Sistémica", "Sistémica/Piel", "Accidentes", "Gineco-obstétrica"]
  }
];

const emergencyLawSearchExpansions = {
  acv: ["ave", "ictus", "stroke", "cerebrovascular"],
  ave: ["acv", "ictus", "stroke", "cerebrovascular"],
  iam: ["infarto", "sca", "coronario", "miocardio"],
  sca: ["infarto", "iam", "coronario", "dolor", "toracico"],
  tep: ["embolia", "pulmonar", "tromboembolismo"],
  tvp: ["trombosis", "venosa", "profunda"],
  hda: ["hemorragia", "digestiva", "alta"],
  hdb: ["hemorragia", "digestiva", "baja"],
  hta: ["hipertension", "presion"],
  epoc: ["obstructiva", "hipercapnia", "ventilatorio"],
  vni: ["ventilacion", "vmni"],
  vmni: ["ventilacion", "vni"],
  iot: ["intubacion", "via", "aerea"],
  tec: ["trauma", "craneal", "glasgow"],
  hsa: ["subaracnoidea", "hemorragia"],
  hic: ["hemorragia", "intracraneal"],
  ira: ["renal", "rinon", "aguda"],
  sepsis: ["shock", "infeccion", "septico"],
  torax: ["toracico", "pecho"],
  toraxico: ["toracico", "pecho"],
  pecho: ["toracico", "coronario"],
  corazon: ["cardiaco", "cardiaca", "coronario"],
  presion: ["hipertension", "hta"],
  azucar: ["glicemia", "hiperglicemia", "hipoglicemia"],
  alergia: ["anafilaxia", "inmunoalergica"],
  intoxicacion: ["sobredosis", "toxicologia"],
  bala: ["arma", "fuego", "proyectil"],
  rinon: ["renal", "nefrologica"],
  embarazo: ["obstetrica", "gineco"]
};

const turnForms = [
  {
    title: "Antimicrobianos H. Padre Hurtado",
    description: "Formulario activo para solicitudes relacionadas con antimicrobianos del Hospital Padre Hurtado.",
    url: externalForms.antimicrobianosHphUrl,
    actionLabel: "Abrir formulario antimicrobianos"
  },
  {
    title: "Ley de urgencias",
    description: "Decreto 34, buscador de condiciones clínicas adultas, formularios pendientes y alerta operativa.",
    type: "emergencyLaw",
    decreeUrl: emergencyLawDecreeUrl,
    activationUrl: externalForms.leyUrgenciasUrl,
    consentUrl: externalForms.leyUrgenciasConsentimientoUrl
  },
  {
    title: "Medicamentos de uso ocasional",
    description: "Espacio preparado para anexar el formulario cuando se defina el enlace institucional.",
    url: externalForms.medicamentosUsoOcasionalUrl,
    actionLabel: "Abrir formulario medicamentos"
  },
  {
    title: "Solicitud de VIH",
    description: "Espacio preparado para anexar el formulario de solicitud de VIH cuando esté disponible.",
    url: externalForms.solicitudVihUrl,
    actionLabel: "Abrir solicitud de VIH"
  },
  {
    title: "Formularios de notificación obligatoria",
    description: "Espacio preparado para centralizar formularios de notificación obligatoria cuando se agreguen los enlaces.",
    url: externalForms.notificacionObligatoriaUrl,
    actionLabel: "Abrir notificación obligatoria"
  }
];

const priorityEmail = "gestionaltaseahph@gmail.com";
const publishedBaseUrl = "https://solrac031ch-prog.github.io/crs-2025-app/";
const categoryOrder = ["Regla general", "Flujo", "CRS", "Poli choque", "Hospitalizados", "Protocolo"];

const state = {
  query: "",
  category: "Todos",
  shift: "all"
};

const pages = {
  inicio: document.querySelector("#homePage"),
  especialidades: document.querySelector("#specialtiesPage"),
  especialidad: document.querySelector("#protocolPage"),
  llamados: document.querySelector("#callsPage"),
  visita: document.querySelector("#visitPage"),
  formularios: document.querySelector("#formsPage")
};

const todayLabel = document.querySelector("#todayLabel");
const searchInput = document.querySelector("#searchInput");
const resultsMeta = document.querySelector("#resultsMeta");
const rulesPreview = document.querySelector("#rulesPreview");
const specialtyGroups = document.querySelector("#specialtyGroups");
const specialtyTemplate = document.querySelector("#specialtyButtonTemplate");
const protocolTitle = document.querySelector("#protocolTitle");
const protocolCategory = document.querySelector("#protocolCategory");
const protocolDetail = document.querySelector("#protocolDetail");
const callsDocumentAction = document.querySelector("#callsDocumentAction");
const uhdDocumentAction = document.querySelector("#uhdDocumentAction");
const visitDocumentAction = document.querySelector("#visitDocumentAction");
const turnFormsList = document.querySelector("#turnFormsList");
const formsTitle = document.querySelector("#formsTitle");

const textRepairPatterns = [
  [/\u00c3\u00a1/g, "á"], [/\u00c3\u00a9/g, "é"], [/\u00c3\u00ad/g, "í"],
  [/\u00c3\u00b3/g, "ó"], [/\u00c3\u00ba/g, "ú"], [/\u00c3\u00b1/g, "ñ"],
  [/\u00c3\u00bc/g, "ü"], [/\u00c2\u00bf/g, "¿"], [/\u00c2\u00a1/g, "¡"],
  [/\u00c2\u00ae/g, "®"], [/\u00c2\u00b7/g, "·"], [/\u00c2\u00a0/g, " "],
  [/\u00e2\u20ac\u0153/g, "\""], [/\u00e2\u20ac\u009d/g, "\""],
  [/\u00e2\u20ac\u02dc/g, "'"], [/\u00e2\u20ac\u2122/g, "'"],
  [/\u00e2\u20ac\u00a2/g, "•"], [/\u00e2\u2020\u2019/g, "→"],
  [/\u00e2\u2030\u00a5/g, "≥"], [/\u00e2\u2030\u00a4/g, "≤"]
];

function repairText(text) {
  return textRepairPatterns.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

function repairValue(value) {
  if (typeof value === "string") return repairText(value);
  if (Array.isArray(value)) return value.map(repairValue);
  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      value[key] = repairValue(value[key]);
    });
  }
  return value;
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function displayTitle(title) {
  return title.replace(/^Poli Choque\s+/i, "").replace(/^Flujo\s+/i, "");
}

function specialtySticker(protocol) {
  const title = normalize(protocol.title);
  if (title.includes("eco doppler")) return "ECO";
  if (title.includes("viruela")) return "VM";
  if (title.includes("neuro")) return "NEU";
  if (title.includes("hemorragia digestiva")) return "HDA";
  if (title.includes("hemodinamia")) return "HEM";
  if (title.includes("hemorragia intracerebral")) return "HIC";
  if (title.includes("columna")) return "COL";
  if (title.includes("radiologia intervencional")) return "RIN";
  if (title.includes("violencia sexual")) return "VS";
  if (title.includes("agresion")) return "AGR";
  if (title === "nit") return "NIT";
  if (title.includes("medicina interna")) return "MI";
  if (title.includes("taco")) return "TACO";
  if (title.includes("sala pulso")) return "SP";
  if (title === "eda") return "EDA";
  if (title.includes("orl")) return "ORL";
  if (title.includes("oftalmologia")) return "OFT";
  if (title.includes("dermatologia")) return "DER";
  if (title.includes("paliativa")) return "PAL";
  if (title.includes("maxilofacial")) return "MAX";
  if (title.includes("urologia")) return "URO";
  if (title.includes("maternidad")) return "MAT";
  if (title.includes("cirugia")) return "CIR";
  if (title.includes("tvp")) return "TVP";
  if (title.includes("nefro")) return "NEF";
  return protocol.category.slice(0, 3).toUpperCase();
}

function slugify(text) {
  return normalize(displayTitle(text))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

protocols.forEach((protocol) => {
  repairValue(protocol);
  protocol.slug = slugify(protocol.title);
});

emergencyLawConditions.forEach(repairValue);

const protocolSlugAliases = new Map([
  ["flujo-sospecha-tvp", "tvp-sospecha-eco-y-horario-inhabil"],
  ["flujo-eco-tvp-hospital-sotero-del-rio", "tvp-sospecha-eco-y-horario-inhabil"],
  ["eco-doppler-horario-inhabil-2025", "tvp-sospecha-eco-y-horario-inhabil"],
  ["flujos-neuro-2025", "neurologia"]
]);

function protocolHaystack(protocol) {
  return normalize([
    protocol.title,
    protocol.category,
    protocol.summary,
    ...(protocol.tags || []),
    ...(protocol.fields || []).flat(),
    ...(protocol.flow || []),
    ...((protocol.moments || []).flatMap((moment) => [moment.title, moment.text, moment.alert || "", ...(moment.steps || [])])),
    ...((protocol.pathologies || []).flat(2)),
    ...((protocol.sourceDocs || []).flat()),
    protocol.warning || ""
  ].join(" "));
}

function findProtocolBySlug(slug) {
  const canonicalSlug = protocolSlugAliases.get(slug) || slug;
  return protocols.find((item) => item.slug === canonicalSlug);
}

function isShiftMatch(protocol) {
  if (state.shift === "all") return true;
  const text = protocolHaystack(protocol);
  if (state.shift === "habil") {
    return text.includes("horario habil") || text.includes("lunes a jueves") || text.includes("lunes a domingo") || text.includes("08:00");
  }
  return text.includes("horario inhabil") || text.includes("inhabil") || text.includes("viernes") || text.includes("feriado") || text.includes("fin de semana");
}

function filteredProtocols() {
  const q = normalize(state.query.trim());
  return protocols.filter((protocol) => {
    const categoryMatch = state.category === "Todos" || protocol.category === state.category;
    const queryMatch = !q || protocolHaystack(protocol).includes(q);
    return categoryMatch && queryMatch && isShiftMatch(protocol);
  });
}

function groupProtocols(results) {
  return results.reduce((groups, protocol) => {
    if (!groups.has(protocol.category)) groups.set(protocol.category, []);
    groups.get(protocol.category).push(protocol);
    return groups;
  }, new Map());
}

function orderedCategories(groups) {
  const present = [...groups.keys()];
  const ordered = categoryOrder.filter((category) => present.includes(category));
  const remaining = present.filter((category) => !ordered.includes(category)).sort();
  return [...ordered, ...remaining];
}

function visibleSpecialtyProtocols(results) {
  return results.filter((protocol) => protocol.category !== "Regla general");
}

function routeParts() {
  const hash = (window.location.hash || "#/inicio").split("?")[0];
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}

function hashParams() {
  const hash = window.location.hash || "";
  const queryIndex = hash.indexOf("?");
  return new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : "");
}

function activeRouteName() {
  return routeParts()[0] || "inicio";
}

function showPage(name) {
  Object.entries(pages).forEach(([key, page]) => {
    page.classList.toggle("active", key === name);
  });

  document.querySelectorAll("[data-route-link]").forEach((link) => {
    const route = link.dataset.routeLink;
    const isActive = route === name || (name === "especialidad" && route === "especialidades");
    link.classList.toggle("active", isActive);
  });
}

function renderHome() {
  todayLabel.textContent = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function appendRuleCard(protocol) {
  if (!protocol) return;

  const card = document.createElement("article");
  card.className = "rule-card";

  const title = document.createElement("h2");
  title.textContent = protocol.title;

  const summary = document.createElement("p");
  summary.textContent = protocol.summary;

  const list = document.createElement("div");
  list.className = "rule-fields";

  (protocol.fields || []).forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "rule-field";

    const strong = document.createElement("strong");
    strong.textContent = label;

    const span = document.createElement("span");
    span.textContent = value;

    item.append(strong, span);
    list.append(item);
  });

  card.append(title, summary, list);

  if (protocol.warning) {
    const warning = document.createElement("div");
    warning.className = "rule-warning";
    warning.textContent = protocol.warning;
    card.append(warning);
  }

  rulesPreview.append(card);
}

function renderRulesPreview() {
  rulesPreview.innerHTML = "";
  appendRuleCard(protocols.find((protocol) => protocol.title === "Antes de derivar"));
  appendRuleCard(protocols.find((protocol) => protocol.title === "Enlaces"));
}

function renderSpecialties() {
  renderRulesPreview();

  const results = visibleSpecialtyProtocols(filteredProtocols());
  const groups = groupProtocols(results);

  specialtyGroups.innerHTML = "";
  resultsMeta.textContent = results.length
    ? `${results.length} protocolos disponibles`
    : "No hay protocolos para mostrar";

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No encontré coincidencias en el documento CRS 2025.";
    specialtyGroups.append(empty);
    return;
  }

  orderedCategories(groups).forEach((category) => {
    const section = document.createElement("section");
    section.className = "category-section";

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category;

    const grid = document.createElement("div");
    grid.className = "specialty-grid";

    groups.get(category).forEach((protocol) => {
      const node = specialtyTemplate.content.cloneNode(true);
      const link = node.querySelector(".specialty-button");
      link.href = `#/especialidad/${protocol.slug}`;
      link.querySelector(".specialty-sticker").textContent = specialtySticker(protocol);
      link.querySelector("strong").textContent = displayTitle(protocol.title);
      grid.append(link);
    });

    section.append(title, grid);
    specialtyGroups.append(section);
  });
}

function appendTags(parent, tags = []) {
  if (!tags.length) return;
  const tagsEl = document.createElement("div");
  tagsEl.className = "tags";
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagsEl.append(span);
  });
  parent.append(tagsEl);
}

function appendFields(parent, fields = []) {
  if (!fields.length) return;
  const section = document.createElement("section");
  section.className = "detail-section";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Detalle operativo";

  const grid = document.createElement("div");
  grid.className = "grid";

  fields.forEach(([fieldLabel, value]) => {
    const field = document.createElement("div");
    field.className = "field";

    const strong = document.createElement("strong");
    strong.textContent = fieldLabel;

    const span = document.createElement("span");
    span.textContent = value;

    field.append(strong, span);
    grid.append(field);
  });

  section.append(label, grid);
  parent.append(section);
}

function appendFlow(parent, flow = []) {
  if (!flow.length) return;
  const section = document.createElement("section");
  section.className = "detail-section";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Secuencia";

  const flowEl = document.createElement("div");
  flowEl.className = "flow";

  flow.forEach((step, index) => {
    const row = document.createElement("div");
    row.className = "flow-step";

    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = index + 1;

    const text = document.createElement("p");
    text.textContent = step;

    row.append(number, text);
    flowEl.append(row);
  });

  section.append(label, flowEl);
  parent.append(section);
}

function appendMoments(parent, moments = []) {
  if (!moments.length) return;

  const section = document.createElement("section");
  section.className = "detail-section moments-panel";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Momentos del flujo";

  const grid = document.createElement("div");
  grid.className = "moment-grid";

  moments.forEach((moment) => {
    const card = document.createElement("article");
    card.className = "moment-card";

    const title = document.createElement("h3");
    title.textContent = moment.title;

    const text = document.createElement("p");
    text.textContent = moment.text;

    card.append(title, text);

    if (moment.steps?.length) {
      const list = document.createElement("ul");
      moment.steps.forEach((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        list.append(item);
      });
      card.append(list);
    }

    if (moment.alert) {
      const alert = document.createElement("div");
      alert.className = "moment-alert";
      alert.textContent = moment.alert;
      card.append(alert);
    }

    grid.append(card);
  });

  section.append(label, grid);
  parent.append(section);
}

function appendPathologies(parent, pathologies = []) {
  if (!pathologies.length) return;
  const section = document.createElement("section");
  section.className = "detail-section pathologies";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Patologías según imagen del PDF";
  section.append(label);

  pathologies.forEach(([group, items]) => {
    const block = document.createElement("section");
    block.className = "pathology-group";

    const title = document.createElement("h3");
    title.textContent = group;

    const list = document.createElement("ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });

    block.append(title, list);
    section.append(block);
  });

  parent.append(section);
}

function appendExternalForm(parent, protocol) {
  const url = protocol.formKey ? externalForms[protocol.formKey] : null;
  if (!url) return;

  const panel = document.createElement("section");
  panel.className = "external-form-panel";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Formulario asociado";

  const title = document.createElement("h2");
  title.textContent = protocol.formTitle || "Formulario asociado";

  const text = document.createElement("p");
  text.textContent = protocol.formText || "Abrir el formulario indicado para completar la solicitud asociada a este flujo.";

  const link = document.createElement("a");
  link.className = "document-button";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = protocol.formLabel || "Abrir formulario";

  panel.append(label, title, text, link);
  parent.append(panel);
}

function appendSourceDocuments(parent, protocol) {
  if (!protocol.sourceDocs?.length) return;

  const panel = document.createElement("section");
  panel.className = "source-docs-panel";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Documento fuente";

  const title = document.createElement("h2");
  title.textContent = protocol.sourceDocs.length > 1 ? "Documentos completos" : "Documento completo";

  const text = document.createElement("p");
  text.textContent = "Abrir el archivo original para revisar el flujograma o respaldo institucional completo.";

  const actions = document.createElement("div");
  actions.className = "source-doc-actions";

  protocol.sourceDocs.forEach(([docLabel, url]) => {
    const link = document.createElement("a");
    link.className = "document-button";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = docLabel;
    actions.append(link);
  });

  panel.append(label, title, text, actions);
  parent.append(panel);
}

function priorityMailto(protocol) {
  const subject = `Gestión prioritaria CRS - ${displayTitle(protocol.title)}`;
  const route = `${publishedBaseUrl}#/especialidad/${protocol.slug}`;
  const body = [
    "Estimados/as:",
    "",
    "Solicito evaluación para gestión prioritaria de derivación CRS.",
    "",
    `Especialidad/flujo: ${protocol.title}`,
    `Enlace del flujo: ${route}`,
    "",
    "Paciente:",
    "RUN:",
    "Teléfono:",
    "Motivo clínico de priorización:",
    "Gestión ya realizada:",
    "",
    "Saludos."
  ].join("\n");

  return `mailto:${priorityEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function appendPriorityManagement(parent, protocol) {
  const panel = document.createElement("section");
  panel.className = "priority-panel";

  const label = document.createElement("p");
  label.className = "detail-label";
  label.textContent = "Cierre de derivación";

  const title = document.createElement("h2");
  title.textContent = "¿Requiere gestión prioritaria?";

  const text = document.createElement("p");
  text.textContent = "Si requiere priorización, se abrirá un correo prellenado para revisar, completar y enviar desde la cuenta correspondiente.";

  const actions = document.createElement("div");
  actions.className = "priority-actions";

  const noButton = document.createElement("button");
  noButton.type = "button";
  noButton.className = "priority-button secondary";
  noButton.dataset.priorityNo = "true";
  noButton.textContent = "No requiere";

  const yesLink = document.createElement("a");
  yesLink.className = "priority-button primary";
  yesLink.href = priorityMailto(protocol);
  yesLink.textContent = "Sí, abrir correo";

  const status = document.createElement("p");
  status.className = "priority-status";
  status.setAttribute("aria-live", "polite");

  actions.append(noButton, yesLink);
  panel.append(label, title, text, actions, status);
  parent.append(panel);
}

function renderProtocol(slug) {
  const protocol = findProtocolBySlug(slug);

  protocolDetail.innerHTML = "";

  if (!protocol) {
    protocolCategory.textContent = "No encontrado";
    protocolTitle.textContent = "Protocolo no disponible";
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Este enlace no coincide con un flujo CRS 2025.";
    protocolDetail.append(empty);
    return;
  }

  protocolCategory.textContent = `${protocol.category} · ${protocol.page}`;
  protocolTitle.textContent = protocol.title;

  const header = document.createElement("section");
  header.className = "protocol-card";

  const badge = document.createElement("span");
  badge.className = "page-badge";
  badge.textContent = protocol.page;

  const summary = document.createElement("p");
  summary.className = "protocol-summary";
  summary.textContent = protocol.summary;

  header.append(badge, summary);
  appendTags(header, protocol.tags);
  protocolDetail.append(header);

  appendFields(protocolDetail, protocol.fields);
  appendMoments(protocolDetail, protocol.moments);
  appendFlow(protocolDetail, protocol.flow);
  appendPathologies(protocolDetail, protocol.pathologies);
  appendSourceDocuments(protocolDetail, protocol);
  appendExternalForm(protocolDetail, protocol);

  if (protocol.warning) {
    const warning = document.createElement("div");
    warning.className = "warning";
    warning.textContent = protocol.warning;
    protocolDetail.append(warning);
  }

  if (!protocol.hidePriority) appendPriorityManagement(protocolDetail, protocol);
}

function renderDocumentAction(container, url, label) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "document-action";

  if (url) {
    const link = document.createElement("a");
    link.className = "document-button";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    wrapper.append(link);
  } else {
    const pending = document.createElement("span");
    pending.className = "document-button-disabled";
    pending.textContent = "Pendiente de configurar";

    const note = document.createElement("p");
    note.textContent = "Agregar aquí el enlace fijo de Google Drive cuando esté disponible.";

    wrapper.append(pending, note);
  }

  container.append(wrapper);
}

function createPendingAction(text, noteText) {
  const wrapper = document.createElement("div");
  wrapper.className = "document-action";

  const pending = document.createElement("span");
  pending.className = "document-button-disabled";
  pending.textContent = text;

  const note = document.createElement("p");
  note.textContent = noteText;

  wrapper.append(pending, note);
  return wrapper;
}

function renderDocuments() {
  renderDocumentAction(callsDocumentAction, externalDocs.llamadosUrl, "Abrir especialistas de llamado");
  renderDocumentAction(uhdDocumentAction, externalDocs.uhdDisponibilidadUrl, "Abrir disponibilidad UHD");
  renderDocumentAction(visitDocumentAction, externalDocs.visitaDiariaUrl, "Abrir planilla de visita diaria");
}

function emergencyLawHaystack(item) {
  return normalize([
    item.title,
    item.category,
    item.criteria,
    ...(item.aliases || [])
  ].join(" "));
}

function emergencyLawTokens(query = "") {
  const cleanQuery = normalize(query.trim());
  const baseWords = cleanQuery
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  return [...new Set(baseWords.flatMap((word) => [word, ...(emergencyLawSearchExpansions[word] || [])]))];
}

function emergencyLawGroupById(groupId = "") {
  return emergencyLawGroups.find((group) => group.id === groupId) || null;
}

function isEmergencyLawGroupMatch(item, group) {
  if (!group) return true;
  return group.categories.some((category) => item.category === category);
}

function emergencyLawMatchScore(item, words) {
  if (!words.length) return 1;

  const fields = [
    { text: normalize(item.title), weight: 8 },
    { text: normalize((item.aliases || []).join(" ")), weight: 6 },
    { text: normalize(item.category), weight: 4 },
    { text: normalize(item.criteria), weight: 2 }
  ];

  return words.reduce((score, word) => {
    const hitScore = fields.reduce((total, field) => total + (field.text.includes(word) ? field.weight : 0), 0);
    return score + hitScore;
  }, 0);
}

function emergencyLawMatchLabel(item) {
  if (item.matchMode === "group") return "Categoría";
  if (item.matchScore >= 14) return "Alta";
  if (item.matchScore >= 8) return "Probable";
  return "Posible";
}

function getEmergencyLawMatches(query = "", groupId = "") {
  const words = emergencyLawTokens(query);
  const group = emergencyLawGroupById(groupId);
  if (!words.length && !group) return [];

  return emergencyLawConditions
    .map((item) => {
      if (!isEmergencyLawGroupMatch(item, group)) return null;
      const score = emergencyLawMatchScore(item, words);
      if (words.length && score <= 0) return null;
      return {
        ...item,
        matchMode: words.length ? "search" : "group",
        matchScore: score
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.title.localeCompare(b.title, "es");
    });
}

function createEmergencyLawResultCard(item) {
  const card = document.createElement("article");
  card.className = "law-result";

  const head = document.createElement("div");
  head.className = "law-result-head";

  const category = document.createElement("span");
  category.className = "law-result-category";
  category.textContent = item.category;

  const match = document.createElement("span");
  match.className = "law-match-badge";
  match.textContent = emergencyLawMatchLabel(item);

  head.append(category, match);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const criteria = document.createElement("p");
  criteria.textContent = item.criteria;

  card.append(head, title, criteria);

  if (item.aliases?.length) {
    const aliases = document.createElement("div");
    aliases.className = "law-aliases";
    item.aliases.slice(0, 5).forEach((alias) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = alias;
      aliases.append(tag);
    });
    card.append(aliases);
  }

  return card;
}

function emergencyLawSearchUrl(query) {
  return `#/formularios/ley-urgencias/resultados?q=${encodeURIComponent(query.trim())}`;
}

function emergencyLawSearchEditUrl(query) {
  const cleanQuery = query.trim();
  return cleanQuery
    ? `#/formularios/ley-urgencias/buscar?q=${encodeURIComponent(cleanQuery)}`
    : "#/formularios/ley-urgencias/buscar";
}

function renderEmergencyLawLiveResults(container, query = "") {
  container.innerHTML = "";

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    const idle = document.createElement("div");
    idle.className = "law-live-empty";
    idle.textContent = "Escribe y aparecerán coincidencias por palabra, sigla o sinónimo.";
    container.append(idle);
    return;
  }

  const matches = getEmergencyLawMatches(cleanQuery);
  const head = document.createElement("div");
  head.className = "law-live-head";

  const count = document.createElement("strong");
  count.textContent = `${matches.length} coincidencia${matches.length === 1 ? "" : "s"}`;

  const open = document.createElement("a");
  open.href = emergencyLawSearchUrl(cleanQuery);
  open.textContent = "Ver pantalla completa";

  head.append(count, open);
  container.append(head);

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "law-live-empty";
    empty.textContent = "Sin coincidencias por ahora. Prueba otra palabra o una sigla relacionada.";
    container.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "law-live-list";

  matches.slice(0, 5).forEach((item) => {
    const link = document.createElement("a");
    link.className = "law-live-item";
    link.href = emergencyLawSearchUrl(cleanQuery);

    const meta = document.createElement("span");
    meta.textContent = `${item.category} · ${emergencyLawMatchLabel(item)}`;

    const title = document.createElement("strong");
    title.textContent = item.title;

    link.append(meta, title);
    list.append(link);
  });

  container.append(list);
}

function renderEmergencyLawForm(form) {
  const panel = document.createElement("section");
  panel.className = "document-panel law-card";

  const title = document.createElement("h2");
  title.textContent = form.title;

  const description = document.createElement("p");
  description.textContent = form.description;

  const actions = document.createElement("div");
  actions.className = "law-card-actions";

  const openLink = document.createElement("a");
  openLink.className = "document-button";
  openLink.href = "#/formularios/ley-urgencias";
  openLink.textContent = "Abrir Ley de Urgencias";

  actions.append(openLink);
  panel.append(title, description, actions);
  return panel;
}

function renderEmergencyLawHome() {
  formsTitle.textContent = "Ley de Urgencias";
  turnFormsList.innerHTML = "";

  const form = turnForms.find((item) => item.type === "emergencyLaw");
  const panel = document.createElement("section");
  panel.className = "law-hero-panel";

  const alert = document.createElement("div");
  alert.className = "law-alert";
  alert.textContent = "Al activar Ley de Urgencias, avisar a jefe de turno y Gestión de Camas.";

  const title = document.createElement("h2");
  title.textContent = "Tres pasos, sin vueltas";

  const text = document.createElement("p");
  text.textContent = "Busca la condición, confirma en el Decreto 34 y deja los formularios listos cuando tengamos los enlaces institucionales.";

  const actions = document.createElement("div");
  actions.className = "law-menu";

  const search = document.createElement("a");
  search.className = "law-menu-card primary";
  search.href = "#/formularios/ley-urgencias/buscar";
  search.innerHTML = "<span class=\"law-step\">1</span><strong>Buscar patología</strong><span>Siglas, sinónimos y diagnósticos relacionados</span>";

  const decree = document.createElement("a");
  decree.className = "law-menu-card";
  decree.href = form.decreeUrl;
  decree.target = "_blank";
  decree.rel = "noopener noreferrer";
  decree.innerHTML = "<span class=\"law-step\">2</span><strong>Decreto 34</strong><span>PDF completo incluido en la app</span>";

  const forms = document.createElement("a");
  forms.className = "law-menu-card";
  forms.href = "#/formularios/ley-urgencias/formularios";
  forms.innerHTML = "<span class=\"law-step\">3</span><strong>Formularios</strong><span>Activación y consentimiento pendientes</span>";

  actions.append(search, decree, forms);
  panel.append(alert, title, text, actions);
  turnFormsList.append(panel);
}

function renderEmergencyLawSearch() {
  formsTitle.textContent = "Buscar Ley de Urgencias";
  turnFormsList.innerHTML = "";
  const query = hashParams().get("q") || "";

  const panel = document.createElement("section");
  panel.className = "law-search-page";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = "#/formularios/ley-urgencias";
  back.textContent = "Ley de Urgencias";

  const searchStage = document.createElement("div");
  searchStage.className = "law-search-stage";

  const title = document.createElement("h2");
  title.textContent = "Buscar y ajustar sin partir de cero";

  const note = document.createElement("p");
  note.textContent = "Escribe una palabra o sigla: la app busca coincidencias y sinónimos mientras escribes.";

  const form = document.createElement("form");
  form.className = "law-search-form";
  form.dataset.lawSearchForm = "true";

  const input = document.createElement("input");
  input.type = "search";
  input.name = "q";
  input.placeholder = "Diagnóstico, sigla o problema clínico";
  input.autocomplete = "off";
  input.value = query;

  const button = document.createElement("button");
  button.type = "submit";
  button.className = "document-button";
  button.textContent = "Buscar";

  form.append(input, button);

  const helper = document.createElement("p");
  helper.className = "law-note";
  helper.textContent = "Puedes volver desde resultados y modificar la misma búsqueda. Confirmar siempre con Decreto 34 y criterio clínico.";

  const liveResults = document.createElement("div");
  liveResults.className = "law-live-results";
  liveResults.dataset.lawLiveResults = "true";

  searchStage.append(title, note, form, helper, liveResults);
  renderEmergencyLawLiveResults(liveResults, query);

  const shortcuts = document.createElement("div");
  shortcuts.className = "law-shortcuts";

  const shortcutsHead = document.createElement("div");
  shortcutsHead.className = "law-shortcuts-head";

  const shortcutsTitle = document.createElement("h3");
  shortcutsTitle.textContent = "También puedes entrar por sistema";

  const shortcutsText = document.createElement("p");
  shortcutsText.textContent = "Sirve cuando no recuerdas el nombre exacto o quieres revisar un grupo clínico.";

  shortcutsHead.append(shortcutsTitle, shortcutsText);

  const shortcutsGrid = document.createElement("div");
  shortcutsGrid.className = "law-shortcut-grid";

  emergencyLawGroups.forEach((group) => {
    const link = document.createElement("a");
    link.className = "law-shortcut-card";
    link.href = `#/formularios/ley-urgencias/resultados?grupo=${encodeURIComponent(group.id)}`;

    const linkTitle = document.createElement("strong");
    linkTitle.textContent = group.title;

    const description = document.createElement("span");
    description.textContent = group.description;

    link.append(linkTitle, description);
    shortcutsGrid.append(link);
  });

  shortcuts.append(shortcutsHead, shortcutsGrid);
  panel.append(back, searchStage, shortcuts);
  turnFormsList.append(panel);
  input.focus();
}

function renderEmergencyLawResultsScreen() {
  formsTitle.textContent = "Resultados";
  turnFormsList.innerHTML = "";

  const params = hashParams();
  const query = params.get("q") || "";
  const groupId = params.get("grupo") || "";
  const group = emergencyLawGroupById(groupId);
  const matches = getEmergencyLawMatches(query, groupId);

  const panel = document.createElement("section");
  panel.className = "law-hero-panel compact";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = emergencyLawSearchEditUrl(query);
  back.textContent = query ? "Modificar búsqueda" : "Nueva búsqueda";

  const title = document.createElement("h2");
  if (query) title.textContent = `Resultados para "${query}"`;
  else if (group) title.textContent = group.title;
  else title.textContent = "Sin búsqueda";

  const meta = document.createElement("p");
  const matchWord = matches.length === 1 ? "coincidencia" : "coincidencias";
  const foundWord = matches.length === 1 ? "encontrada" : "encontradas";
  const orderedWord = matches.length === 1 ? "ordenada" : "ordenadas";
  const criteriaWord = matches.length === 1 ? "criterio" : "criterios";
  if (query && group) {
    meta.textContent = `${matches.length} ${matchWord} ${foundWord} dentro de ${group.title}.`;
  } else if (query) {
    meta.textContent = `${matches.length} ${matchWord} ${orderedWord} por probabilidad.`;
  } else if (group) {
    meta.textContent = `${matches.length} ${criteriaWord} asociados a este sistema.`;
  } else {
    meta.textContent = "Vuelve al buscador e ingresa una patología, sigla o diagnóstico.";
  }

  const revise = document.createElement("form");
  revise.className = "law-inline-search";
  revise.dataset.lawSearchForm = "true";

  const reviseInput = document.createElement("input");
  reviseInput.type = "search";
  reviseInput.name = "q";
  reviseInput.value = query;
  reviseInput.placeholder = "Ajustar búsqueda";
  reviseInput.autocomplete = "off";

  const reviseButton = document.createElement("button");
  reviseButton.type = "submit";
  reviseButton.className = "law-action-button";
  reviseButton.textContent = "Actualizar";

  revise.append(reviseInput, reviseButton);

  const actions = document.createElement("div");
  actions.className = "law-actions";

  const decree = document.createElement("a");
  decree.className = "document-button";
  decree.href = emergencyLawDecreeUrl;
  decree.target = "_blank";
  decree.rel = "noopener noreferrer";
  decree.textContent = "Abrir Decreto 34";

  actions.append(decree);
  panel.append(back, title, meta);
  if (query) panel.append(revise);
  turnFormsList.append(panel);

  if ((!query && !group) || !matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No encontré coincidencias. Prueba otra palabra, sigla o abre el Decreto 34 completo.";
    turnFormsList.append(empty, actions);
    return;
  }

  const results = document.createElement("div");
  results.className = "law-results";
  matches.slice(0, 18).forEach((item) => results.append(createEmergencyLawResultCard(item)));
  turnFormsList.append(results, actions);
}

function renderEmergencyLawForms() {
  formsTitle.textContent = "Formularios Ley de Urgencias";
  turnFormsList.innerHTML = "";

  const form = turnForms.find((item) => item.type === "emergencyLaw");
  const panel = document.createElement("section");
  panel.className = "law-hero-panel compact";

  const back = document.createElement("a");
  back.className = "back-link";
  back.href = "#/formularios/ley-urgencias";
  back.textContent = "Ley de Urgencias";

  const title = document.createElement("h2");
  title.textContent = "Pendientes de enlace";

  const text = document.createElement("p");
  text.textContent = "Cuando tengas los formularios institucionales, quedarán conectados aquí sin cambiar la estructura.";

  const grid = document.createElement("div");
  grid.className = "law-form-grid";

  if (form.activationUrl) {
    const activation = document.createElement("a");
    activation.className = "document-button";
    activation.href = form.activationUrl;
    activation.target = "_blank";
    activation.rel = "noopener noreferrer";
    activation.textContent = "Abrir activación";
    grid.append(activation);
  } else {
    grid.append(createPendingAction("Activación pendiente", "Aquí se agregará el formulario de activación de Ley de Urgencias."));
  }

  if (form.consentUrl) {
    const consent = document.createElement("a");
    consent.className = "document-button";
    consent.href = form.consentUrl;
    consent.target = "_blank";
    consent.rel = "noopener noreferrer";
    consent.textContent = "Abrir consentimiento";
    grid.append(consent);
  } else {
    grid.append(createPendingAction("Consentimiento pendiente", "Aquí se agregará el consentimiento cuando esté disponible."));
  }

  panel.append(back, title, text, grid);
  turnFormsList.append(panel);
}

function renderFormsRoute(parts = []) {
  if (!parts.length) {
    renderTurnForms();
    return;
  }

  if (parts[0] !== "ley-urgencias") {
    renderTurnForms();
    return;
  }

  if (parts[1] === "buscar") renderEmergencyLawSearch();
  else if (parts[1] === "resultados") renderEmergencyLawResultsScreen();
  else if (parts[1] === "formularios") renderEmergencyLawForms();
  else renderEmergencyLawHome();
}

function resetFormsHeading() {
  formsTitle.textContent = "Formularios de turno";
}

function renderTurnForms() {
  resetFormsHeading();
  turnFormsList.innerHTML = "";

  turnForms.forEach((form) => {
    if (form.type === "emergencyLaw") {
      turnFormsList.append(renderEmergencyLawForm(form));
      return;
    }

    const panel = document.createElement("section");
    panel.className = "document-panel";

    const title = document.createElement("h2");
    title.textContent = form.title;

    const description = document.createElement("p");
    description.textContent = form.description;

    const action = document.createElement("div");
    action.className = "document-action";

    if (form.url) {
      const link = document.createElement("a");
      link.className = "document-button";
      link.href = form.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = form.actionLabel;
      action.append(link);
    } else {
      const pending = document.createElement("span");
      pending.className = "document-button-disabled";
      pending.textContent = "Pendiente de configurar";

      const note = document.createElement("p");
      note.textContent = "Cuando tengas el enlace, se agrega una sola vez en la configuración de formularios.";

      action.append(pending, note);
    }

    panel.append(title, description, action);
    turnFormsList.append(panel);
  });
}

function renderRoute() {
  const parts = routeParts();
  const [name, slug] = parts;
  const pageName = pages[name] ? name : "inicio";

  showPage(pageName);

  if (pageName === "inicio") renderHome();
  if (pageName === "especialidades") renderSpecialties();
  if (pageName === "especialidad") renderProtocol(slug || "");
  if (pageName === "llamados" || pageName === "visita") renderDocuments();
  if (pageName === "formularios") renderFormsRoute(parts.slice(1));

  window.scrollTo(0, 0);
}

function setCategory(category) {
  state.category = category;
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
  if (activeRouteName() === "especialidades") renderSpecialties();
}

function setShift(shift, activeButton) {
  state.shift = shift;
  document.querySelectorAll("[data-shift]").forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });
  if (activeRouteName() === "especialidades") renderSpecialties();
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  if (activeRouteName() === "especialidades") renderSpecialties();
});

document.addEventListener("click", (event) => {
  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) setCategory(categoryButton.dataset.category);

  const shiftButton = event.target.closest("[data-shift]");
  if (shiftButton) setShift(shiftButton.dataset.shift, shiftButton);

  const priorityNo = event.target.closest("[data-priority-no]");
  if (priorityNo) {
    const panel = priorityNo.closest(".priority-panel");
    const status = panel?.querySelector(".priority-status");
    if (status) status.textContent = "Gestión prioritaria no requerida.";
  }

});

document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-law-search-form] input[name='q']");
  if (!input) return;

  const preview = input.closest(".law-search-stage")?.querySelector("[data-law-live-results]");
  if (preview) {
    renderEmergencyLawLiveResults(preview, input.value);
    const editUrl = emergencyLawSearchEditUrl(input.value);
    window.history.replaceState(null, "", editUrl);
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-law-search-form]");
  if (form) {
    event.preventDefault();
    const input = form.querySelector("input[name='q']");
    const query = input?.value.trim() || "";
    if (query) {
      window.location.hash = emergencyLawSearchUrl(query);
    }
  }
});

window.addEventListener("hashchange", renderRoute);

if (!window.location.hash) {
  window.location.hash = "#/inicio";
} else {
  renderRoute();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
