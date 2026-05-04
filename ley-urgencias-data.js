window.emergencyLawConditions = [
  {
    title: "Hipoxemia severa o insuficiencia respiratoria",
    category: "Respiratoria",
    criteria: "Saturación arterial O2 menor o igual a 90% pese a FiO2 suplementaria mayor o igual a 50%, o insuficiencia respiratoria que requiere manejo inmediato.",
    aliases: ["desaturación", "saturación baja", "SatO2 baja", "falla respiratoria", "hipoxia", "oxígeno alto"]
  },
  {
    title: "Ventilación mecánica, VNI, cánula de alto flujo o intubación inminente",
    category: "Respiratoria",
    criteria: "Requerimiento de ventilación mecánica invasiva/no invasiva, cánula de alto flujo asociada a pronación en vigilia o intubación traqueal inminente.",
    aliases: ["VM", "VMI", "VMNI", "VNI", "CAF", "alto flujo", "intubación", "IOT", "vía aérea"]
  },
  {
    title: "Cuerpo extraño en vía aérea",
    category: "Respiratoria",
    criteria: "Cuerpo extraño en laringe, tráquea o bronquios.",
    aliases: ["atragantamiento", "obstrucción vía aérea", "aspiración", "bronquio", "laringe", "tráquea"]
  },
  {
    title: "Síndrome postinmersión",
    category: "Respiratoria",
    criteria: "Postinmersión con compromiso cardiopulmonar y/o neurológico.",
    aliases: ["ahogamiento", "sumersión", "inmersión", "casi ahogado"]
  },
  {
    title: "Tromboembolismo pulmonar de riesgo alto o intermedio-alto",
    category: "Respiratoria",
    criteria: "TEP de riesgo alto o intermedio-alto, o con parámetros sugerentes de disfunción ventricular derecha.",
    aliases: ["TEP", "embolia pulmonar", "tromboembolismo", "disfunción ventricular derecha"]
  },
  {
    title: "Hemoptisis con insuficiencia respiratoria",
    category: "Respiratoria",
    criteria: "Hemoptisis asociada a insuficiencia respiratoria.",
    aliases: ["sangre por boca", "tos con sangre", "sangrado pulmonar", "hemoptisis masiva"]
  },
  {
    title: "Hemotórax o neumotórax grave",
    category: "Respiratoria/Trauma",
    criteria: "Hemotórax, neumotórax traumático, neumotórax a tensión, moderado/severo o con requerimiento de drenaje pleural.",
    aliases: ["hemotórax", "neumotórax", "drenaje pleural", "tensión", "tórax"]
  },
  {
    title: "EPOC grave",
    category: "Respiratoria",
    criteria: "Agudización grave asociada a hipoxemia que requiere soporte ventilatorio, hipercapnia con compromiso de conciencia/fatiga, inestabilidad hemodinámica o neumotórax.",
    aliases: ["EPOC", "retención CO2", "hipercapnia", "bronquitis crónica", "enfisema"]
  },
  {
    title: "Crisis asmática grave",
    category: "Respiratoria",
    criteria: "Asma con inestabilidad hemodinámica, alteración de conciencia/convulsiones, FiO2 mayor o igual a 50%, ventilación asistida, refractaria a tratamiento o PEF menor a 40%.",
    aliases: ["asma", "status asmático", "broncoespasmo", "sibilancias", "crisis obstructiva"]
  },
  {
    title: "Shock",
    category: "Circulatoria",
    criteria: "Shock cardiogénico, hipovolémico, distributivo o mixto.",
    aliases: ["hipotensión", "mala perfusión", "shock séptico", "shock cardiogénico", "shock hipovolémico", "shock distributivo", "vasopresores", "drogas vasoactivas"]
  },
  {
    title: "Arritmia cardíaca grave",
    category: "Circulatoria",
    criteria: "Arritmia con ECG alterado asociada a inestabilidad, síncope reciente, compromiso de conciencia, insuficiencia cardiaca, EPA, SCA, intoxicación, trastorno hidroelectrolítico, taquicardia ventricular o necesidad de marcapasos transitorio.",
    aliases: ["taquicardia ventricular", "TV", "bradiarritmia", "bloqueo", "marcapasos", "QT largo", "Brugada", "preexcitación", "síncope"]
  },
  {
    title: "Insuficiencia cardíaca aguda o edema pulmonar agudo",
    category: "Circulatoria",
    criteria: "Insuficiencia cardíaca aguda que requiere reanimación o manejo inmediato: inestabilidad, mala perfusión, EPA, insuficiencia respiratoria, ventilación, drogas vasoactivas, SCA, intoxicación cardiotóxica, arritmia grave o disfunción de órganos.",
    aliases: ["ICA", "EPA", "edema pulmonar", "falla cardíaca", "insuficiencia cardíaca", "congestión pulmonar"]
  },
  {
    title: "Síndrome coronario agudo o infarto",
    category: "Circulatoria",
    criteria: "SCA asociado a infarto agudo al miocardio, paro recuperado o dolor torácico con signos de alarma y ECG/enzimas sugerentes.",
    aliases: ["SCA", "IAM", "infarto", "dolor torácico", "dolor de pecho", "troponina", "ECG isquemia", "angina", "supradesnivel"]
  },
  {
    title: "Emergencia hipertensiva",
    category: "Circulatoria",
    criteria: "Hipertensión asociada a IRA, ACV isquémico/hemorrágico, HIC/HSA, EPA, SCA, disección aórtica, encefalopatía hipertensiva o eclampsia.",
    aliases: ["HTA", "presión alta", "crisis hipertensiva", "encefalopatía hipertensiva", "hipertensión severa"]
  },
  {
    title: "Miocarditis, pericarditis complicada o taponamiento cardíaco",
    category: "Circulatoria",
    criteria: "Miocarditis aguda, pericarditis con signos de taponamiento, derrame pericárdico mayor a 20 mm o trauma local reciente; neumopericardio o taponamiento cardíaco.",
    aliases: ["miocarditis", "pericarditis", "derrame pericárdico", "taponamiento", "neumopericardio"]
  },
  {
    title: "Síncope de alto riesgo",
    category: "Circulatoria/Neurológica",
    criteria: "Síncope con antecedentes cardiacos relevantes, síntomas de alarma, ECG alterado o criterios de regla de San Francisco.",
    aliases: ["síncope", "desmayo", "pérdida conciencia", "regla San Francisco", "ECG anormal"]
  },
  {
    title: "Accidente cerebrovascular isquémico agudo",
    category: "Neurológica",
    criteria: "ACV isquémico agudo menor de 72 horas de evolución.",
    aliases: ["ACV", "AVE", "ictus", "stroke", "déficit focal", "hemiparesia", "trombectomía", "trombolisis"]
  },
  {
    title: "ACV hemorrágico, HIC o hemorragia subaracnoidea",
    category: "Neurológica",
    criteria: "ACV hemorrágico agudo, hemorragia intracraneal aguda o hemorragia subaracnoidea aguda.",
    aliases: ["HIC", "HSA", "hemorragia cerebral", "sangrado cerebral", "aneurisma", "cefalea trueno", "ictus hemorrágico"]
  },
  {
    title: "Isquemia transitoria aguda",
    category: "Neurológica",
    criteria: "TIA en las últimas 24 horas.",
    aliases: ["TIA", "AIT", "ataque isquémico transitorio", "déficit transitorio"]
  },
  {
    title: "TEC moderado o severo",
    category: "Neurológica/Trauma",
    criteria: "Traumatismo encéfalo craneal moderado o severo según criterios de guía clínica GES vigente.",
    aliases: ["TEC", "trauma craneal", "golpe cabeza", "Glasgow", "traumatismo encéfalo craneal"]
  },
  {
    title: "Infección aguda del sistema nervioso central",
    category: "Neurológica/Infectológica",
    criteria: "Infección aguda del sistema nervioso central.",
    aliases: ["meningitis", "encefalitis", "meningoencefalitis", "rigidez nuca", "sistema nervioso central"]
  },
  {
    title: "Coma o compromiso de conciencia severo",
    category: "Neurológica",
    criteria: "Coma, compromiso agudo de conciencia o deterioro neurológico que requiere manejo inmediato.",
    aliases: ["coma", "Glasgow bajo", "compromiso conciencia", "sopor", "obnubilación"]
  },
  {
    title: "Convulsión prolongada o síndrome convulsivo de riesgo",
    category: "Neurológica",
    criteria: "Convulsión mayor a 5 minutos, sin recuperación de conciencia, asociada a TEC/lesión cerebral reciente o con alteración/focalidad persistente.",
    aliases: ["convulsión", "crisis convulsiva", "estatus", "status epiléptico", "epilepsia", "postictal"]
  },
  {
    title: "Trombosis de seno venoso",
    category: "Neurológica",
    criteria: "Trombosis de seno venoso aguda.",
    aliases: ["seno venoso", "trombosis venosa cerebral", "TVC", "cefalea", "papiledema"]
  },
  {
    title: "Proceso expansivo, hidrocefalia o hipertensión intracraneal aguda",
    category: "Neurológica",
    criteria: "Proceso expansivo agudo intracraneano/intrarraquídeo sintomático, hidrocefalia aguda o síndrome de hipertensión intracraneal agudo.",
    aliases: ["tumor cerebral", "masa cerebral", "hidrocefalia", "HTIC", "hipertensión endocraneana", "compresión medular"]
  },
  {
    title: "Síndrome compartimental",
    category: "Vascular/Trauma",
    criteria: "Síndrome compartimental con signos de mala perfusión cutánea o alteración neurovascular.",
    aliases: ["compartimental", "dolor desproporcionado", "isquemia extremidad", "pulso ausente"]
  },
  {
    title: "Síndrome aórtico agudo o disección aórtica",
    category: "Vascular",
    criteria: "Disección aórtica, hematoma intramural, úlcera penetrante o insuficiencia aórtica aguda.",
    aliases: ["disección aórtica", "aorta", "dolor desgarrante", "hematoma intramural", "úlcera penetrante"]
  },
  {
    title: "Isquemia arterial aguda",
    category: "Vascular",
    criteria: "Enfermedad arterial oclusiva aguda. Se excluye claudicación.",
    aliases: ["isquemia aguda", "arteria ocluida", "embolia arterial", "trombosis arterial", "extremidad fría"]
  },
  {
    title: "Trombosis venosa profunda de grandes vasos",
    category: "Vascular",
    criteria: "TVP aguda de grandes vasos.",
    aliases: ["TVP", "trombosis venosa profunda", "iliofemoral", "grandes vasos", "trombosis proximal"]
  },
  {
    title: "Politrauma, trauma de alta energía o trauma raquimedular",
    category: "Trauma",
    criteria: "Politraumatizado, traumatizado de alta energía o traumatismo raquimedular agudo.",
    aliases: ["politrauma", "trauma alta energía", "atropello", "caída altura", "raquimedular", "lesión medular"]
  },
  {
    title: "Fracturas complejas, expuestas o con compromiso neurovascular",
    category: "Trauma",
    criteria: "Fracturas/luxofracturas complejas de columna, pelvis, con compromiso neurológico/vascular, aplastamiento, amputación, exposición grave, rotura visceral o asociadas a politraumatismo.",
    aliases: ["fractura expuesta", "luxofractura", "pelvis", "columna", "compromiso vascular", "compromiso neurológico", "amputación"]
  },
  {
    title: "Trauma torácico, abdominal, pélvico o genitourinario grave",
    category: "Trauma",
    criteria: "Trauma con compromiso de víscera hueca/sólida, herida penetrante de cuello/tórax/abdomen/pelvis/genitourinaria, neumoperitoneo, rotura diafragmática, hemoperitoneo o evisceración.",
    aliases: ["trauma torácico", "trauma abdominal", "herida penetrante", "arma blanca", "evisceración", "hemoperitoneo", "neumoperitoneo", "diafragma"]
  },
  {
    title: "Síndrome de aplastamiento o rabdomiolisis",
    category: "Trauma/Sistémica",
    criteria: "Síndrome de aplastamiento con rabdomiolisis o CK elevada según decreto/criterios clínicos.",
    aliases: ["aplastamiento", "rabdomiolisis", "CK alta", "crush", "hiperhidratación"]
  },
  {
    title: "Herida de bala",
    category: "Trauma/Piel",
    criteria: "Herida de bala por arma de fuego.",
    aliases: ["arma de fuego", "balazo", "proyectil", "herida bala"]
  },
  {
    title: "Emergencia quirúrgica abdominal",
    category: "Quirúrgica",
    criteria: "Apendicitis complicada, trombosis mesentérica, perforación de víscera hueca, obstrucción con sufrimiento de asas, hernia estrangulada, peritonitis no espontánea u otra cirugía inmediata en menos de 6 horas.",
    aliases: ["apendicitis", "peritonitis", "perforación", "obstrucción intestinal", "hernia estrangulada", "abdomen agudo", "isquemia mesentérica", "trombosis mesentérica"]
  },
  {
    title: "Gran quemado",
    category: "Quemados",
    criteria: "Condición clínica de gran quemado según criterios de Guía Clínica GES.",
    aliases: ["quemadura", "gran quemado", "quemado", "GES quemado"]
  },
  {
    title: "Intoxicación o sobredosis grave",
    category: "Toxicología",
    criteria: "Intoxicación grave con compromiso de conciencia, convulsiones, ECG alterado, alteración hemodinámica, compromiso de vía aérea, alto riesgo de muerte, disfunción de órganos o síndrome neuroléptico maligno.",
    aliases: ["intoxicación", "sobredosis", "fármacos", "drogas", "cáusticos", "organofosforado", "monóxido", "síndrome neuroléptico maligno"]
  },
  {
    title: "Loxoscelismo cutáneo visceral o latrodectismo",
    category: "Accidentes",
    criteria: "Loxoscelismo cutáneo visceral o mordedura por Latrodectus mactans.",
    aliases: ["araña rincón", "loxosceles", "loxoscelismo", "viuda negra", "latrodectus", "araña trigo"]
  },
  {
    title: "Infección grave de partes blandas con riesgo necrotizante",
    category: "Piel/Infectológica",
    criteria: "Infecciones graves de partes blandas con riesgo de infección necrotizante; considerar dolor desproporcionado, inflamación sistémica, crepitación y mala perfusión.",
    aliases: ["fascitis necrotizante", "celulitis grave", "partes blandas", "crepitación", "dolor desproporcionado", "necrotizante"]
  },
  {
    title: "Priapismo, torsión testicular, parafimosis quirúrgica o trauma peneano grave",
    category: "Urológica",
    criteria: "Emergencias genitourinarias masculinas que requieren manejo inmediato o quirúrgico impostergable.",
    aliases: ["priapismo", "torsión testicular", "testículo agudo", "parafimosis", "trauma peneano", "urología"]
  },
  {
    title: "Emergencia oftalmológica",
    category: "Oftalmológica",
    criteria: "Causticación ocular, trombosis vena central retina, herida palpebral con borde libre, desprendimiento traumático retina, trauma ocular grave, glaucoma agudo o pérdida súbita de visión.",
    aliases: ["glaucoma", "causticación", "cáustico ocular", "pérdida visión", "ojo rojo", "hifema", "retina", "trauma ocular", "herida palpebral"]
  },
  {
    title: "Emergencia otorrinolaringológica",
    category: "ORL",
    criteria: "Epistaxis con inestabilidad hemodinámica, epistaxis posterior, hematoma del tabique o sordera súbita neurovascular.",
    aliases: ["epistaxis", "sangrado nasal", "hematoma tabique", "sordera súbita", "ORL"]
  },
  {
    title: "Hemorragia digestiva alta de riesgo",
    category: "Gastroenterológica",
    criteria: "HDA con sangrado activo evidente, sin sangrado activo pero con inestabilidad hemodinámica, o según criterios clínicos de severidad.",
    aliases: ["HDA", "hematemesis", "melena", "sangrado digestivo", "várices esofágicas", "hemorragia digestiva"]
  },
  {
    title: "Pancreatitis aguda moderadamente severa o severa",
    category: "Gastroenterológica",
    criteria: "Pancreatitis aguda moderadamente severa o severa según criterios clínicos vigentes.",
    aliases: ["pancreatitis", "dolor epigástrico", "lipasa", "amilasa"]
  },
  {
    title: "Falla hepática aguda o cirrosis reagudizada con disfunción de órgano",
    category: "Gastroenterológica",
    criteria: "Insuficiencia hepática aguda con compromiso de conciencia, INR >2 y/o hipoglicemia; o insuficiencia hepática crónica reagudizada con disfunción de órgano.",
    aliases: ["falla hepática", "insuficiencia hepática", "cirrosis", "encefalopatía hepática", "INR", "hipoglicemia"]
  },
  {
    title: "Perforación esofágica",
    category: "Gastroenterológica",
    criteria: "Perforación esofágica.",
    aliases: ["Boerhaave", "esófago", "perforación esofágica", "mediastinitis"]
  },
  {
    title: "Emergencia gineco-obstétrica",
    category: "Gineco-obstétrica",
    criteria: "Metrorragia con compromiso hemodinámico; abdomen agudo ginecológico con cirugía <6 horas; hígado graso agudo, eclampsia, preeclampsia severa, HELLP, deterioro fetoplacentario, metrorragia 2°/3° trimestre, trauma embarazo, parto expulsivo, VIH in situ, rotura uterina o interrupción por riesgo materno.",
    aliases: ["metrorragia", "embarazo ectópico", "torsión ovárica", "absceso tubo ovárico", "eclampsia", "preeclampsia", "HELLP", "rotura uterina", "parto expulsivo", "VIH embarazo"]
  },
  {
    title: "Hanta, meningococcemia o mucormicosis",
    category: "Infectológica",
    criteria: "Sospecha fundada de infección por Hanta virus, meningococcemia o mucormicosis.",
    aliases: ["hanta", "hantavirus", "meningococcemia", "púrpura fulminans", "mucormicosis"]
  },
  {
    title: "Sepsis grave o shock séptico",
    category: "Infectológica",
    criteria: "Sepsis grave, shock séptico o síndrome inflamatorio sistémico con criterios de severidad.",
    aliases: ["sepsis", "shock séptico", "SIRS", "falla orgánica", "lactato", "infección grave"]
  },
  {
    title: "Falla renal en urgencia dialítica",
    category: "Nefrológica",
    criteria: "Falla renal aguda o crónica en urgencia dialítica.",
    aliases: ["IRA", "ERC", "diálisis urgente", "uremia", "hiperkalemia", "sobrecarga volumen", "nefrología"]
  },
  {
    title: "Hipoglicemia sintomática con alteración de conciencia",
    category: "Metabólica",
    criteria: "Hipoglicemia sintomática con alteración de la conciencia.",
    aliases: ["hipoglicemia", "glicemia baja", "hipoglucemia", "compromiso conciencia"]
  },
  {
    title: "Cetoacidosis diabética o estado hiperosmolar",
    category: "Metabólica",
    criteria: "Hiperglicemia hiperosmolar no cetócica con compromiso, inestabilidad, insuficiencia respiratoria, trastornos electrolíticos o shock; cetoacidosis diabética o debut DM con CAD de riesgo.",
    aliases: ["cetoacidosis", "CAD", "diabetes", "hiperosmolar", "HHS", "debut diabetes", "acidosis"]
  },
  {
    title: "Trastornos hidroelectrolíticos graves y agudos",
    category: "Metabólica",
    criteria: "Hiperkalemia, hipokalemia, hiponatremia, hipernatremia, hipocalcemia, hipercalcemia, acidosis o alcalosis severa según criterios clínicos.",
    aliases: ["hiperkalemia", "hipokalemia", "hiponatremia", "hipernatremia", "hipercalcemia", "hipocalcemia", "acidosis", "alcalosis", "potasio", "sodio", "calcio"]
  },
  {
    title: "Emergencia endocrinológica",
    category: "Endocrinológica",
    criteria: "Insuficiencia suprarrenal aguda, tormenta tiroidea o coma mixedematoso.",
    aliases: ["crisis adrenal", "insuficiencia suprarrenal", "tormenta tiroidea", "coma mixedematoso", "tiroides"]
  },
  {
    title: "Anafilaxia o angioedema",
    category: "Inmunoalérgica",
    criteria: "Shock anafiláctico con compromiso hemodinámico, edema angioneurótico o angioedema hereditario.",
    aliases: ["anafilaxia", "shock anafiláctico", "alergia", "angioedema", "edema glotis", "edema laríngeo"]
  },
  {
    title: "Emergencia hemato-oncológica",
    category: "Hemato-oncológica",
    criteria: "Neutropenia febril <500, coagulopatía/plaquetopenia con sangrado e inestabilidad, lisis tumoral, leucemia aguda con coagulopatía/trombocitopenia, hiperviscosidad, crisis hemolítica, hemofilia con hemorragia o anemia severa Hb <7 y/o inestabilidad.",
    aliases: ["neutropenia febril", "plaquetopenia", "coagulopatía", "lisis tumoral", "leucemia aguda", "hiperviscosidad", "hemofilia", "anemia severa"]
  },
  {
    title: "Emergencia psiquiátrica con riesgo vital o secuela grave",
    category: "Psiquiátrica",
    criteria: "Intento suicida con complicación orgánica; paciente agitado/violento con contención física/farmacológica, ingesta de fármacos/drogas, abstinencia o complicación orgánica; psicosis aguda con riesgo suicida/homicida o complicación orgánica.",
    aliases: ["intento suicida", "suicidio", "agitado", "violento", "psicosis", "contención", "abstinencia", "sobredosis"]
  },
  {
    title: "Paro cardiorrespiratorio recuperado o no recuperado tras RCP",
    category: "Sistémica",
    criteria: "PCR recuperado o PCR que no se recupera luego de maniobras de RCP. Se excluye quien ingresa fallecido.",
    aliases: ["PCR", "paro", "RCP", "reanimación", "cardiorrespiratorio"]
  },
  {
    title: "Golpe de calor, hipotermia o hipertermia maligna",
    category: "Sistémica",
    criteria: "Hipotermia, golpe de calor o hipertermia maligna.",
    aliases: ["golpe calor", "hipotermia", "hipertermia maligna", "temperatura", "calor"]
  },
  {
    title: "Síndrome de Stevens-Johnson o necrólisis epidérmica tóxica",
    category: "Sistémica/Piel",
    criteria: "Síndrome de Stevens Johnson o necrólisis epidérmica tóxica.",
    aliases: ["Stevens Johnson", "NET", "necrólisis epidérmica", "tóxica", "piel", "ampollas"]
  }
];
