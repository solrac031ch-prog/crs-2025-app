const specialties = [
  {
    name: "Medicina Interna",
    page: "p. 3",
    description: "Derivación restringida a especialistas de Medicina Interna y Medicina de Urgencia.",
    actions: ["IC a Poli Alta Urgencia", "Adjuntar IC/DAU", "Módulo Docente"]
  },
  {
    name: "Sala Pulso",
    page: "p. 5",
    description: "Coordinación de tratamientos ambulatorios y transfusión con requisitos previos.",
    actions: ["IC Sala Pulso", "Coordinar por horario", "Orden de transfusión + Grupo/Rh"]
  },
  {
    name: "Oftalmología",
    page: "p. 8",
    description: "No existe poli choque oftalmo en HPH; destino depende de emergencia y horario.",
    actions: ["Trauma o glaucoma -> UTO", "Resto -> HSDR", "Hospitalizados -> CRS oftalmólogo"]
  },
  {
    name: "Dermatología",
    page: "p. 9",
    description: "Poli choque dermatología para ambulatorios y contacto directo para hospitalizados.",
    actions: ["08:00 pasillo Módulo Docente", "IC por especialista", "Hospitalizado: pasillo dermatología"]
  },
  {
    name: "Urología",
    page: "p. 12",
    description: "Flujo urológico parcial con sonda Foley y diagnósticos definidos.",
    actions: ["Sonda Foley por Pitágoras", "CRS por diagnósticos", "Resto por APS"]
  }
];

const documents = {
  onCall: {
    title: "Especialistas de llamado (mensual)",
    updatedAt: "Mayo 2026",
    url: "https://drive.google.com/",
    note: "Reemplazar este enlace mensualmente por la jefatura."
  },
  rounds: {
    title: "Planilla de visita diaria (jefe servicio AM / jefe turno PM)",
    updatedAt: "Mayo 2026",
    url: "https://docs.google.com/spreadsheets/",
    note: "Puede ser enlace a Excel en OneDrive o Google Sheets."
  }
};

const state = {
  view: "presentacion",
  selectedSpecialty: specialties[0].name
};

const views = {
  presentacion: document.querySelector("#view-presentacion"),
  especialidades: document.querySelector("#view-especialidades"),
  documentos: document.querySelector("#view-documentos")
};

const specialtyButtons = document.querySelector("#specialtyButtons");
const specialtyTitle = document.querySelector("#specialtyTitle");
const specialtyDetail = document.querySelector("#specialtyDetail");
const onCallDoc = document.querySelector("#onCallDoc");
const roundsDoc = document.querySelector("#roundsDoc");

function renderNav() {
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.view);
  });

  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("active", key === state.view);
  });
}

function renderSpecialtyButtons() {
  specialtyButtons.innerHTML = "";
  specialties.forEach((specialty) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `specialty-btn${specialty.name === state.selectedSpecialty ? " active" : ""}`;
    btn.dataset.specialty = specialty.name;
    btn.innerHTML = `<strong>${specialty.name}</strong><span>${specialty.page}</span>`;
    specialtyButtons.append(btn);
  });
}

function renderSpecialtyDetail() {
  const specialty = specialties.find((item) => item.name === state.selectedSpecialty);
  if (!specialty) return;

  specialtyTitle.textContent = `Detalle: ${specialty.name} (${specialty.page})`;
  specialtyDetail.innerHTML = `
    <p>${specialty.description}</p>
    <ul>
      ${specialty.actions.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function renderDocCard(target, doc) {
  target.innerHTML = `
    <h4>${doc.title}</h4>
    <p><strong>Última actualización sugerida:</strong> ${doc.updatedAt}</p>
    <p>${doc.note}</p>
    <a href="${doc.url}" target="_blank" rel="noopener noreferrer">Abrir documento</a>
  `;
}

document.addEventListener("click", (event) => {
  const navBtn = event.target.closest("[data-view]");
  if (navBtn) {
    state.view = navBtn.dataset.view;
    renderNav();
  }

  const specialtyBtn = event.target.closest("[data-specialty]");
  if (specialtyBtn) {
    state.selectedSpecialty = specialtyBtn.dataset.specialty;
    state.view = "documentos";
    renderSpecialtyButtons();
    renderSpecialtyDetail();
    renderNav();
  }
});

renderNav();
renderSpecialtyButtons();
renderSpecialtyDetail();
renderDocCard(onCallDoc, documents.onCall);
renderDocCard(roundsDoc, documents.rounds);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
