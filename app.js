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
    title: "Flujo Sospecha TVP",
    category: "Flujo",
    page: "p. 18",
    summary: "Algoritmo para sospecha o confirmación de TVP según horario y disponibilidad de eco.",
    tags: ["TVP", "Dímero D", "Eco", "Enoxaparina", "Poli TACO", "Domiciliaria"],
    fields: [
      ["Horario hábil", "08:00 - 16:00, lunes a domingo: si diagnóstico confirmado, presentar a domiciliaria."],
      ["Horario inhábil", "TVP confirmada sin domiciliaria: derivar a poli TACO día siguiente."],
      ["Exámenes", "Dímero, creatinina, perfil hemato y coagulación."],
      ["Eco positiva", "Si paciente tiene TVP, rayos deriva directo a poli TACO, no a Urgencia."]
    ],
    flow: [
      "Paciente con alta sospecha clínica de TVP.",
      "Tomar dímero D.",
      "Si dímero positivo y no hay eco: enoxaparina.",
      "Derivar a “Poli TVP” al día hábil siguiente en rayos, 08:00-10:00 o 14:00-16:00.",
      "Si TVP confirmada: seguir destino según horario, domiciliaria o poli TACO."
    ]
  },
  {
    title: "Flujo ECO TVP Hospital Sótero del Río",
    category: "Flujo",
    page: "p. 19",
    summary: "Ruta para eco TVP cuando Poli TVP HPH no puede responder, especialmente fines de semana o feriados.",
    tags: ["TVP", "CASR", "Imagenología", "Fin de semana", "Feriado"],
    fields: [
      ["Indicación", "Sospecha real de TVP: clínica + dímero D elevado, cuando Poli TVP HPH no responde."],
      ["Contacto", "Llamar a articuladora de red: +569 9253 7195 para asignación de cupo con hora específica."],
      ["Cuestionario", "Tras hora asignada, completar cuestionario indicado en la descripción del grupo WhatsApp."],
      ["Destino", "Sala 9 Imagenología, block central CASR, con orden médica."],
      ["Resultado", "Informe sube a sistema de imágenes aproximadamente en 1 hora; paciente vuelve a HPH para resultado."]
    ],
    sourceDocs: [
      ["Flujo ECO TVP Sótero del Río", "./protocol-docs/flujo-eco-tvp-sotero-del-rio.pdf"],
      ["Resumen TVP HPH", "./protocol-docs/resumen-tvp-hph.jpg"]
    ],
    formKey: "ecoTvpSoteroUrl",
    formTitle: "Cuestionario ECO TVP Hospital Sótero del Río",
    formLabel: "Abrir cuestionario ECO TVP",
    warning: "Derivar a Imagenología CASR, no a la Urgencia."
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
    title: "ECO Doppler horario inhábil 2025",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Documento actualizado para activar ECO Doppler en horario inhábil mediante formulario operativo.",
    tags: ["Eco Doppler", "Horario inhábil", "Formulario", "TVP"],
    fields: [
      ["Uso", "Abrir el formulario asociado cuando corresponda solicitar ECO Doppler en horario inhábil."],
      ["Documento fuente", "El PDF contiene el acceso al formulario y debe revisarse si cambia el flujo local."]
    ],
    sourceDocs: [
      ["ECO Doppler horario inhábil 2025", "./protocol-docs/eco-doppler-horario-inhabil-2025.pdf"]
    ],
    formKey: "ecoTvpSoteroUrl",
    formTitle: "Formulario ECO Doppler horario inhábil",
    formLabel: "Abrir formulario ECO Doppler",
    warning: "Confirmar siempre que la indicación clínica y el horario correspondan al flujo vigente."
  },
  {
    title: "Viruela símica",
    category: "Flujo",
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
    title: "Flujos Neuro 2025",
    category: "Flujo",
    page: "Doc. 2025",
    summary: "Documento actualizado de flujos neurológicos 2025 para consulta directa del PDF completo.",
    tags: ["Neurología", "Neuro", "2025", "Documento escaneado"],
    fields: [
      ["Consulta rápida", "El documento viene como imagen escaneada; abrir el PDF completo para revisar el algoritmo vigente."],
      ["Uso sugerido", "Utilizar como respaldo rápido cuando se active un flujo neurológico de turno."]
    ],
    sourceDocs: [
      ["Flujos Neuro 2025", "./protocol-docs/flujos-neuro-2025.pdf"]
    ],
    warning: "No se pudo extraer texto confiable del PDF escaneado; revisar siempre el documento completo."
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

const turnForms = [
  {
    title: "Antimicrobianos H. Padre Hurtado",
    description: "Formulario activo para solicitudes relacionadas con antimicrobianos del Hospital Padre Hurtado.",
    url: externalForms.antimicrobianosHphUrl,
    actionLabel: "Abrir formulario antimicrobianos"
  },
  {
    title: "Ley de urgencias",
    description: "Material de consulta, buscador de condiciones clínicas y formularios pendientes para activación de Ley de Urgencias.",
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

function protocolHaystack(protocol) {
  return normalize([
    protocol.title,
    protocol.category,
    protocol.summary,
    ...(protocol.tags || []),
    ...(protocol.fields || []).flat(),
    ...(protocol.flow || []),
    ...((protocol.pathologies || []).flat(2)),
    ...((protocol.sourceDocs || []).flat()),
    protocol.warning || ""
  ].join(" "));
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
  const protocol = protocols.find((item) => item.slug === slug);

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

  appendPriorityManagement(protocolDetail, protocol);
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

function renderEmergencyLawResults(query = "") {
  const resultsEl = document.querySelector("#emergencyLawResults");
  if (!resultsEl) return;

  const cleanQuery = normalize(query.trim());
  const words = cleanQuery.split(/\s+/).filter((word) => word.length > 1);
  const matches = words.length
    ? emergencyLawConditions.filter((item) => words.every((word) => emergencyLawHaystack(item).includes(word)))
    : emergencyLawConditions.slice(0, 10);

  resultsEl.innerHTML = "";

  const meta = document.createElement("p");
  meta.className = "results-meta";
  meta.textContent = words.length
    ? `${matches.length} coincidencia${matches.length === 1 ? "" : "s"} encontradas`
    : "Ejemplos frecuentes. Escribe una patología, diagnóstico o sinónimo para buscar.";
  resultsEl.append(meta);

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No encontré coincidencias. Prueba con un diagnóstico similar, sigla o condición general, por ejemplo: ACV, infarto, sepsis, TEP, trauma, HDA, anafilaxia.";
    resultsEl.append(empty);
    return;
  }

  matches.slice(0, 18).forEach((item) => {
    const card = document.createElement("article");
    card.className = "law-result";

    const category = document.createElement("span");
    category.className = "law-result-category";
    category.textContent = item.category;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const criteria = document.createElement("p");
    criteria.textContent = item.criteria;

    card.append(category, title, criteria);

    if (item.aliases?.length) {
      const aliases = document.createElement("div");
      aliases.className = "law-aliases";
      item.aliases.slice(0, 8).forEach((alias) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = alias;
        aliases.append(tag);
      });
      card.append(aliases);
    }

    resultsEl.append(card);
  });
}

function showEmergencyLawSection(name) {
  document.querySelectorAll("[data-law-section]").forEach((section) => {
    section.classList.toggle("active", section.dataset.lawSection === name);
  });

  document.querySelectorAll("[data-law-panel]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lawPanel === name);
  });
}

function renderEmergencyLawForm(form) {
  const panel = document.createElement("section");
  panel.className = "document-panel law-panel";

  const title = document.createElement("h2");
  title.textContent = form.title;

  const description = document.createElement("p");
  description.textContent = form.description;

  const actions = document.createElement("div");
  actions.className = "law-actions";

  const decreeLink = document.createElement("a");
  decreeLink.className = "document-button";
  decreeLink.href = form.decreeUrl;
  decreeLink.target = "_blank";
  decreeLink.rel = "noopener noreferrer";
  decreeLink.textContent = "Decreto 34";

  const searchButton = document.createElement("button");
  searchButton.type = "button";
  searchButton.className = "law-action-button active";
  searchButton.dataset.lawPanel = "buscador";
  searchButton.textContent = "Buscador";

  const formsButton = document.createElement("button");
  formsButton.type = "button";
  formsButton.className = "law-action-button";
  formsButton.dataset.lawPanel = "formularios";
  formsButton.textContent = "Formularios";

  const noteButton = document.createElement("button");
  noteButton.type = "button";
  noteButton.className = "law-action-button";
  noteButton.dataset.lawPanel = "nota";
  noteButton.textContent = "Nota";

  actions.append(decreeLink, searchButton, formsButton, noteButton);

  const searchSection = document.createElement("section");
  searchSection.className = "law-section active";
  searchSection.dataset.lawSection = "buscador";

  const searchLabel = document.createElement("label");
  searchLabel.className = "search law-search";

  const searchText = document.createElement("span");
  searchText.textContent = "Buscar patología, enfermedad, sigla o sinónimo";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Ej: infarto, ACV, sepsis, TEP, HDA, trauma...";
  searchInput.autocomplete = "off";
  searchInput.dataset.emergencyLawSearch = "true";

  searchLabel.append(searchText, searchInput);

  const searchNote = document.createElement("p");
  searchNote.className = "law-note";
  searchNote.textContent = "Buscador orientativo basado en el Título V del Decreto 34 para paciente adulto. Confirmar siempre en el decreto completo y con criterio clínico.";

  const results = document.createElement("div");
  results.id = "emergencyLawResults";
  results.className = "law-results";

  searchSection.append(searchLabel, searchNote, results);

  const formsSection = document.createElement("section");
  formsSection.className = "law-section";
  formsSection.dataset.lawSection = "formularios";

  const formsTitle = document.createElement("h3");
  formsTitle.textContent = "Formularios de Ley de Urgencias";

  const formGrid = document.createElement("div");
  formGrid.className = "law-form-grid";

  if (form.activationUrl) {
    const activation = document.createElement("a");
    activation.className = "document-button";
    activation.href = form.activationUrl;
    activation.target = "_blank";
    activation.rel = "noopener noreferrer";
    activation.textContent = "Abrir activación";
    formGrid.append(activation);
  } else {
    formGrid.append(createPendingAction("Activación pendiente", "Aquí se agregará el formulario de activación de Ley de Urgencias."));
  }

  if (form.consentUrl) {
    const consent = document.createElement("a");
    consent.className = "document-button";
    consent.href = form.consentUrl;
    consent.target = "_blank";
    consent.rel = "noopener noreferrer";
    consent.textContent = "Abrir consentimiento";
    formGrid.append(consent);
  } else {
    formGrid.append(createPendingAction("Consentimiento pendiente", "Aquí se agregará el consentimiento cuando esté disponible."));
  }

  formsSection.append(formsTitle, formGrid);

  const noteSection = document.createElement("section");
  noteSection.className = "law-section";
  noteSection.dataset.lawSection = "nota";

  const noteTitle = document.createElement("h3");
  noteTitle.textContent = "Nota operativa";

  const noteText = document.createElement("div");
  noteText.className = "law-alert";
  noteText.textContent = "Cuando se pretenda activar Ley de Urgencias, avisar a jefe de turno y Gestión de Camas.";

  const noteDetail = document.createElement("p");
  noteDetail.textContent = "La certificación debe quedar respaldada por evaluación médica, DAU y antecedentes clínicos/paraclínicos concordantes.";

  noteSection.append(noteTitle, noteText, noteDetail);

  panel.append(title, description, actions, searchSection, formsSection, noteSection);
  return panel;
}

function renderTurnForms() {
  turnFormsList.innerHTML = "";

  turnForms.forEach((form) => {
    if (form.type === "emergencyLaw") {
      turnFormsList.append(renderEmergencyLawForm(form));
      renderEmergencyLawResults();
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
  const [name, slug] = routeParts();
  const pageName = pages[name] ? name : "inicio";

  showPage(pageName);

  if (pageName === "inicio") renderHome();
  if (pageName === "especialidades") renderSpecialties();
  if (pageName === "especialidad") renderProtocol(slug || "");
  if (pageName === "llamados" || pageName === "visita") renderDocuments();
  if (pageName === "formularios") renderTurnForms();

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

  const lawPanelButton = event.target.closest("[data-law-panel]");
  if (lawPanelButton) showEmergencyLawSection(lawPanelButton.dataset.lawPanel);
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-emergency-law-search]")) {
    renderEmergencyLawResults(event.target.value);
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
