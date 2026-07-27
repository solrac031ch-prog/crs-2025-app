(() => {
  const externalForms = window.CRS_APP_OPERATIONAL?.externalForms || {};
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

  window.CRS_FORMS_DATA = Object.freeze({
    mandatoryNotificationDiseases,
    emergencyLawDecreeUrl,
    emergencyLawGroups,
    emergencyLawSearchExpansions,
    turnForms
  });
})();
