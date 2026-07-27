const protocols = window.CRS_PROTOCOLS || [];

const operationalData = window.CRS_APP_OPERATIONAL || {};
const externalDocs = operationalData.externalDocs || {};
const externalForms = operationalData.externalForms || {};
const onCallSchedule = operationalData.onCallSchedule || { year: 0, month: 0, label: "", rows: [] };
const phoneDirectory = operationalData.phoneDirectory || [];
const educationLinks = operationalData.educationLinks || [];

const mandatoryNotificationDiseases = [
  {
    type: "Inmediata",
    trigger: "Notificar frente a la sospecha de un caso.",
    items: [
      ["Arbovirus", "Dengue, zika, chikungunya, fiebre amarilla"],
      ["Botulismo", ""],
      ["Botulismo infantil", ""],
      ["Carbunco", ""],
      ["Colera", ""],
      ["Coronavirus", "COVID-19"],
      ["Difteria", ""],
      ["Enfermedad de Chagas agudo", ""],
      ["Fiebre del Nilo Occidental", ""],
      ["Fiebres hemorragicas", ""],
      ["Intoxicaciones agudas por plaguicidas", ""],
      ["Leptospirosis", ""],
      ["Malaria", ""],
      ["Meningitis bacteriana, enfermedad meningococica y enfermedad invasora por Haemophilus influenzae", ""],
      ["Peste", ""],
      ["Poliomielitis", "Paralisis flacidas agudas"],
      ["Rabia humana", ""],
      ["Rubeola", ""],
      ["Sarampion", ""],
      ["Sindrome pulmonar por Hantavirus", ""],
      ["Triquinosis", ""]
    ]
  },
  {
    type: "Diaria",
    trigger: "Notificar frente a la confirmacion de un caso.",
    items: [
      ["Brucelosis", ""],
      ["Cisticercosis", ""],
      ["Coqueluche", "Tos ferina"],
      ["Enfermedad de Chagas cronico", ""],
      ["Enfermedad de Creutzfeldt-Jakob", "ECJ"],
      ["Fiebre Q", ""],
      ["Fiebre tifoidea y paratifoidea", ""],
      ["Gonorrea", ""],
      ["Hepatitis A", ""],
      ["Hepatitis B", ""],
      ["Hepatitis C", ""],
      ["Hepatitis E", ""],
      ["Hidatidosis", "Equinococosis"],
      ["Leishmaniasis", ""],
      ["Lepra", ""],
      ["Listeriosis", ""],
      ["Neumococo", ""],
      ["Parotiditis", ""],
      ["Psitacosis", ""],
      ["Sifilis", ""],
      ["Sindrome de Inmunodeficiencia Adquirida", "VIH/SIDA"],
      ["Tetanos", ""],
      ["Tetanos neonatal", ""],
      ["Tuberculosis", "Todas sus formas y localizaciones"]
    ]
  }
].flatMap((group) => group.items.map(([name, aliases]) => ({
  name,
  aliases,
  type: group.type,
  trigger: group.trigger
})));

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
    description: "Decreto 34, buscador de condiciones clinicas adultas, formulario de activacion, consentimiento y alerta operativa.",
    type: "emergencyLaw",
    decreeUrl: emergencyLawDecreeUrl,
    activationUrl: externalForms.leyUrgenciasUrl,
    consentUrl: externalForms.leyUrgenciasConsentimientoUrl
  },
  {
    title: "Orden de examenes manuales HPH",
    description: "Formato manual vigente para completar, imprimir o guardar como PDF desde el navegador.",
    url: externalForms.examenesManualesUrl,
    actionLabel: "Abrir orden de examenes"
  },
  {
    title: "Transfusion",
    description: "Documento manual vigente para transfusion y respaldo operativo asociado.",
    url: externalForms.transfusionUrl,
    actionLabel: "Abrir documento de transfusion"
  },
  {
    title: "Medicamentos de uso ocasional",
    description: "Pagina 7 del procedimiento APF 1.2 para solicitud de farmaco no considerado en arsenal, en PDF rellenable.",
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
    description: "Acceso a EPIVIGILA y buscador de patologías de notificación obligatoria en Chile.",
    type: "mandatoryNotification",
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
  formularios: document.querySelector("#formsPage"),
  telefonos: document.querySelector("#phonesPage"),
  educacion: document.querySelector("#educationPage"),
  gestion: document.querySelector("#managementPage")
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
const callsSearchPanel = document.querySelector("#callsSearchPanel");
const callsDocumentAction = document.querySelector("#callsDocumentAction");
const uhdDocumentAction = document.querySelector("#uhdDocumentAction");
const visitDocumentAction = document.querySelector("#visitDocumentAction");
const turnFormsList = document.querySelector("#turnFormsList");
const phonesContent = document.querySelector("#phonesContent");
const educationContent = document.querySelector("#educationContent");
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
  text.textContent = "Si requiere priorización, registra los datos mínimos del paciente. El caso se enviará a la planilla segura de Gestión y no quedará almacenado en este dispositivo.";

  const actions = document.createElement("div");
  actions.className = "priority-actions";

  const noButton = document.createElement("button");
  noButton.type = "button";
  noButton.className = "priority-button secondary";
  noButton.dataset.priorityNo = "true";
  noButton.textContent = "No requiere";

  const yesButton = document.createElement("button");
  yesButton.type = "button";
  yesButton.className = "priority-button primary";
  yesButton.dataset.priorityOpen = "true";
  yesButton.textContent = "Si, registrar caso";

  const status = document.createElement("p");
  status.className = "priority-status";
  status.setAttribute("aria-live", "polite");

  const form = document.createElement("form");
  form.className = "priority-form";
  form.hidden = true;
  form.dataset.priorityForm = protocol.slug;
  form.innerHTML = `
    <label>Nombre paciente<input name="patientName" required autocomplete="off"></label>
    <label>RUN<input name="rut" required autocomplete="off"></label>
    <label>Telefono<input name="phone" required autocomplete="off"></label>
    <label>Resumen corto<textarea name="summary" required rows="4"></textarea></label>
    <label>Que necesita<textarea name="need" required rows="3"></textarea></label>
    <div class="priority-actions">
      <button class="priority-button primary" type="submit">Guardar en gestion</button>
      <a class="priority-button secondary" href="${priorityMailto(protocol)}">Abrir correo</a>
    </div>
  `;

  actions.append(noButton, yesButton);
  panel.append(label, title, text, actions, form, status);
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

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDateValue(value) {
  const date = parseDateValue(value);
  if (!date) return "Fecha no valida";
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function getOnCallDay(value) {
  const date = parseDateValue(value);
  if (!date) return null;
  if (date.getFullYear() !== onCallSchedule.year) return null;
  if (date.getMonth() + 1 !== onCallSchedule.month) return null;
  return date.getDate();
}

function normalizeSearchText(text = "") {
  return normalize(text).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function onCallRowHaystack(row) {
  return normalizeSearchText([row.specialty, ...(row.aliases || [])].join(" "));
}

function getOnCallMatches(query = "") {
  const clean = normalizeSearchText(query);
  if (!clean) return [];
  const tokens = clean.split(" ").filter((token) => token.length >= 3);
  const candidates = tokens.length ? tokens : [clean];

  return onCallSchedule.rows.filter((row) => {
    const haystack = onCallRowHaystack(row);
    if (tokens.length > 1) return tokens.every((token) => haystack.includes(token) || token.includes(haystack));
    return candidates.some((token) => haystack.includes(token) || token.includes(haystack));
  });
}

function getOnCallStatus(row, day) {
  if (!day) {
    return {
      tone: "unknown",
      badge: "Fuera de mes",
      detail: `La rotativa cargada corresponde a ${onCallSchedule.label}.`,
      doctor: "Selecciona una fecha de mayo 2026"
    };
  }

  const value = row.days[day];
  if (!value) {
    return {
      tone: "unknown",
      badge: "Sin dato",
      detail: "No aparece disponibilidad para esta especialidad en la fecha consultada.",
      doctor: "Sin registro en el PDF"
    };
  }

  if (String(value).trim().toLowerCase() === "x") {
    return {
      tone: "unavailable",
      badge: "No disponible",
      detail: "El documento marca X para esta fecha.",
      doctor: "Sin disponibilidad registrada"
    };
  }

  return {
    tone: "available",
    badge: "Disponible",
    detail: "Nombre visible en la rotativa mensual. Telefonos ocultos hasta autorizacion.",
    doctor: value
  };
}

function createOnCallResult(row, dateValue) {
  const day = getOnCallDay(dateValue);
  const status = getOnCallStatus(row, day);
  const card = document.createElement("article");
  card.className = `on-call-result ${status.tone}`;

  const head = document.createElement("div");
  head.className = "on-call-result-head";

  const specialty = document.createElement("span");
  specialty.className = "on-call-specialty";
  specialty.textContent = row.specialty;

  const badge = document.createElement("span");
  badge.className = `on-call-badge ${status.tone}`;
  badge.textContent = status.badge;

  const doctor = document.createElement("strong");
  doctor.textContent = status.doctor;

  const detail = document.createElement("p");
  detail.textContent = status.detail;

  head.append(specialty, badge);
  card.append(head, doctor, detail);
  return card;
}

function renderOnCallSearch() {
  if (!callsSearchPanel) return;

  callsSearchPanel.innerHTML = "";

  const stage = document.createElement("section");
  stage.className = "on-call-search";

  const meta = document.createElement("div");
  meta.className = "on-call-meta";
  meta.innerHTML = `<span>Rotativa cargada</span><strong>${onCallSchedule.label}</strong>`;

  const controls = document.createElement("div");
  controls.className = "on-call-controls";

  const dateLabel = document.createElement("label");
  dateLabel.className = "on-call-field";
  dateLabel.innerHTML = "<span>Fecha consultada</span>";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = getLocalDateValue();
  dateInput.min = `${onCallSchedule.year}-${String(onCallSchedule.month).padStart(2, "0")}-01`;
  dateInput.max = `${onCallSchedule.year}-${String(onCallSchedule.month).padStart(2, "0")}-31`;

  const searchLabel = document.createElement("label");
  searchLabel.className = "on-call-field";
  searchLabel.innerHTML = "<span>Buscar especialidad</span>";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Ej: cardiologia, infectologia, uro...";
  searchInput.autocomplete = "off";
  searchInput.inputMode = "search";

  dateLabel.append(dateInput);
  searchLabel.append(searchInput);
  controls.append(dateLabel, searchLabel);

  const today = document.createElement("p");
  today.className = "on-call-date";

  const preview = document.createElement("div");
  preview.className = "search-preview on-call-preview";

  const results = document.createElement("div");
  results.className = "on-call-results";

  const actions = document.createElement("div");
  actions.className = "route-actions";

  const home = document.createElement("a");
  home.className = "back-link";
  home.href = "#/inicio";
  home.textContent = "Inicio";

  const clear = document.createElement("button");
  clear.className = "back-link on-call-clear";
  clear.type = "button";
  clear.textContent = "Limpiar";

  actions.append(home, clear);
  stage.append(meta, controls, today, preview, results, actions);
  callsSearchPanel.append(stage);

  const render = () => {
    const matches = getOnCallMatches(searchInput.value);
    const day = getOnCallDay(dateInput.value);
    today.textContent = `Consulta para ${formatDateValue(dateInput.value)}.`;
    preview.innerHTML = "";
    results.innerHTML = "";

    if (!searchInput.value.trim()) {
      const idle = document.createElement("div");
      idle.className = "law-live-empty";
      idle.textContent = "Escribe una especialidad; no se despliega la lista completa.";
      preview.append(idle);
      return;
    }

    if (!day) {
      const warning = document.createElement("div");
      warning.className = "law-live-empty";
      warning.textContent = `La fecha elegida no esta dentro de ${onCallSchedule.label}.`;
      results.append(warning);
    }

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "law-live-empty";
      empty.textContent = "No encontre esa especialidad en la rotativa cargada.";
      preview.append(empty);
      return;
    }

    const label = document.createElement("span");
    label.className = "search-preview-label";
    label.textContent = "Coincidencias";
    preview.append(label);

    matches.slice(0, 5).forEach((row) => {
      const button = document.createElement("button");
      button.className = "chip search-preview-link";
      button.type = "button";
      button.textContent = row.specialty;
      button.addEventListener("click", () => {
        searchInput.value = row.specialty;
        render();
      });
      preview.append(button);
    });

    matches.slice(0, 4).forEach((row) => results.append(createOnCallResult(row, dateInput.value)));
  };

  searchInput.addEventListener("input", render);
  dateInput.addEventListener("change", render);
  clear.addEventListener("click", () => {
    searchInput.value = "";
    dateInput.value = getLocalDateValue();
    render();
    searchInput.focus();
  });

  render();
}

function renderDocuments() {
  renderOnCallSearch();
  renderDocumentAction(callsDocumentAction, externalDocs.llamadosUrl, "Abrir especialistas de llamado");
  renderDocumentAction(uhdDocumentAction, externalDocs.uhdDisponibilidadUrl, "Abrir disponibilidad UHD");
  renderDocumentAction(visitDocumentAction, externalDocs.visitaDiariaUrl, "Abrir planilla de visita diaria");
}

function renderPhones() {
  phonesContent.innerHTML = "";

  const search = document.createElement("label");
  search.className = "search phone-search";
  search.innerHTML = "<span>Buscar nombre, unidad, anexo o palabra clave</span><input id=\"phoneSearchInput\" type=\"search\" placeholder=\"Ej: ORL, maternidad, pulso, 260...\" autocomplete=\"off\">";

  const list = document.createElement("div");
  list.className = "phone-directory";

  const renderList = (query = "") => {
    const q = normalize(query);
    list.innerHTML = "";
    phoneDirectory.forEach((section) => {
      const items = section.items.filter((item) => {
        const haystack = normalize([item.name, item.detail, item.phone, ...(item.tags || [])].join(" "));
        return !q || haystack.includes(q);
      });
      if (!items.length) return;

      const group = document.createElement("section");
      group.className = "phone-group";
      const title = document.createElement("h2");
      title.textContent = section.group;
      const grid = document.createElement("div");
      grid.className = "phone-grid";
      items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "phone-card";
        const href = item.phone.includes("@") ? `mailto:${item.phone}` : `tel:${item.phone.replace(/[^+0-9]/g, "")}`;
        card.innerHTML = `<span>${item.detail}</span><strong>${item.name}</strong><a href="${href}">${item.phone}</a>`;
        grid.append(card);
      });
      group.append(title, grid);
      list.append(group);
    });
  };

  const note = document.createElement("section");
  note.className = "home-panel";
  note.innerHTML = `<strong>Directorio editable</strong><p>Deje cargados los anexos frecuentes como tarjetas internas. El PDF completo queda incorporado como respaldo para completar o auditar la lista.</p><p><a class="inline-link" href="${externalDocs.telefonosUrgenciaUrl}" target="_blank" rel="noopener noreferrer">Abrir respaldo PDF</a></p>`;

  phonesContent.append(search, list, note);
  renderList();
  search.querySelector("input").addEventListener("input", (event) => renderList(event.target.value));
}

function renderEducation() {
  educationContent.innerHTML = "";
  educationLinks.forEach((item) => {
    const panel = document.createElement("section");
    panel.className = "document-panel";
    const title = document.createElement("h2");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description;
    const action = document.createElement("div");
    action.className = "document-action";
    if (item.url) {
      const link = document.createElement("a");
      link.className = "document-button";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir";
      action.append(link);
    } else {
      const pending = document.createElement("span");
      pending.className = "document-button-disabled";
      pending.textContent = "Pendiente de enlace";
      action.append(pending);
    }
    panel.append(title, description, action);
    educationContent.append(panel);
  });
}
