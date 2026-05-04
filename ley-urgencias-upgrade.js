const leyUrgenciasUpgrade = {
  decretoUrl: "./protocol-docs/Decreto-34_25-OCT-2022.pdf",
  formulariosUrl: "",
  alerta:
    "Ley de Urgencias: la certificación debe estar fundada en antecedentes clínicos y paraclínicos registrados en DAU. No se certifica en admisión ni triage."
};

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderLeyUrgenciasUpgrade() {
  const page = document.getElementById("leyUrgenciasUpgradePage");
  if (!page) return;

  page.innerHTML = `
    <div class="page-head">
      <a class="back-link" href="#/formularios">Formularios</a>
      <div>
        <p class="eyebrow">Ley de Urgencias</p>
        <h1>Decreto 34 y certificación de emergencia</h1>
      </div>
    </div>

    <section class="law-home-card">
      <div class="law-hero-icon">⚡</div>
      <h2>Elige qué necesitas hacer</h2>
      <p>
        Usa esta pantalla como acceso rápido durante el turno.
        El buscador es una ayuda operativa; el respaldo legal completo es el Decreto 34.
      </p>

      <div class="law-main-actions">
        <a class="law-big-button primary" href="${leyUrgenciasUpgrade.decretoUrl}" target="_blank" rel="noopener">
          📄 Decreto 34
          <span>Abrir PDF completo</span>
        </a>

        <button class="law-big-button" type="button" id="openLawSearch">
          🔎 Buscador
          <span>Buscar patología o sinónimo</span>
        </button>

        <button class="law-big-button muted" type="button" id="openLawForms">
          📝 Formularios Ley de Urgencias
          <span>Activación y consentimiento informado</span>
        </button>
      </div>
    </section>

    <section id="lawSearchZone" class="law-search-zone" hidden>
      <h2>Buscar condición clínica</h2>
      <p>Escribe una patología, diagnóstico, sigla o palabra relacionada.</p>

      <div class="law-search-row">
        <input id="lawUpgradeSearchInput" type="search" placeholder="Ej: HDA, ACV, sepsis, TVP, anafilaxia..." autocomplete="off" />
        <button id="lawUpgradeSearchButton" type="button">Buscar</button>
      </div>

      <div id="lawUpgradeResults" class="law-results-clean"></div>
    </section>
  `;

  const openLawSearch = document.getElementById("openLawSearch");
  const openLawForms = document.getElementById("openLawForms");
  const searchInput = document.getElementById("lawUpgradeSearchInput");
  const searchButton = document.getElementById("lawUpgradeSearchButton");

  openLawSearch?.addEventListener("click", () => {
    document.getElementById("lawSearchZone").hidden = false;
    setTimeout(() => searchInput?.focus(), 50);
  });

  openLawForms?.addEventListener("click", () => {
    if (!leyUrgenciasUpgrade.formulariosUrl) {
      alert("Pendiente: aquí se agregará el formulario de activación y consentimiento informado cuando lo subas.");
      return;
    }
    window.open(leyUrgenciasUpgrade.formulariosUrl, "_blank", "noopener");
  });

  searchButton?.addEventListener("click", executeLawUpgradeSearch);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") executeLawUpgradeSearch();
  });
}

function executeLawUpgradeSearch() {
  const input = document.getElementById("lawUpgradeSearchInput");
  const resultsBox = document.getElementById("lawUpgradeResults");
  const query = normalizeText(input?.value);

  if (!resultsBox) return;

  if (!query || query.length < 2) {
    resultsBox.innerHTML = `<div class="empty">Escribe al menos 2 caracteres.</div>`;
    return;
  }

  const data = window.emergencyLawConditions || [];

  const results = data.filter((item) => {
    const haystack = normalizeText([
      item.title,
      item.category,
      item.criteria,
      ...(item.aliases || [])
    ].join(" "));
    return haystack.includes(query);
  });

  if (!results.length) {
    resultsBox.innerHTML = `
      <div class="empty">
        No encontré coincidencias. Prueba con otra palabra o abre el Decreto 34 completo.
      </div>
    `;
    return;
  }

  resultsBox.innerHTML = results
    .map((item) => `
      <article class="law-clean-result">
        <span>${item.category || "Condición clínica"}</span>
        <h3>${item.title}</h3>
        <p>${item.criteria}</p>
        ${
          item.aliases?.length
            ? `<div class="law-mini-tags">${item.aliases.slice(0, 6).map(alias => `<b>${alias}</b>`).join("")}</div>`
            : ""
        }
      </article>
    `)
    .join("");
}

function showLeyUrgenciasUpgradeIfNeeded() {
  const hash = window.location.hash;

  if (hash !== "#/ley-urgencias") return false;

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  let page = document.getElementById("leyUrgenciasUpgradePage");

  if (!page) {
    page = document.createElement("section");
    page.id = "leyUrgenciasUpgradePage";
    page.className = "page active";
    document.querySelector("main.layout")?.appendChild(page);
  }

  page.classList.add("active");
  renderLeyUrgenciasUpgrade();

  if (!sessionStorage.getItem("leyUrgenciasAlertaVista")) {
    alert(leyUrgenciasUpgrade.alerta);
    sessionStorage.setItem("leyUrgenciasAlertaVista", "1");
  }

  return true;
}

function upgradeLeyUrgenciasButtonInsideForms() {
  const formsPage = document.getElementById("formsPage");
  if (!formsPage) return;

  const candidates = formsPage.querySelectorAll("a, button");

  candidates.forEach((el) => {
    const text = normalizeText(el.textContent);
    if (text.includes("ley de urgencias")) {
      el.setAttribute("href", "#/ley-urgencias");
      el.onclick = null;
      el.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.hash = "#/ley-urgencias";
      });
    }
  });
}

window.addEventListener("hashchange", () => {
  showLeyUrgenciasUpgradeIfNeeded();
  setTimeout(upgradeLeyUrgenciasButtonInsideForms, 100);
});

document.addEventListener("DOMContentLoaded", () => {
  showLeyUrgenciasUpgradeIfNeeded();
  setTimeout(upgradeLeyUrgenciasButtonInsideForms, 300);

  const observer = new MutationObserver(() => {
    upgradeLeyUrgenciasButtonInsideForms();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
