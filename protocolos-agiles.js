(function () {
  const targetHash = "#/especialidad/antes-de-derivar";
  const specialtiesHash = "#/especialidades";
  const renderDelays = [0, 80, 260, 700];

  function isTargetRoute() {
    return window.location.hash.startsWith(targetHash);
  }

  function isSpecialtiesRoute() {
    return window.location.hash.startsWith(specialtiesHash);
  }

  function quickProtocolMarkup() {
    return `
      <section class="quick-protocol">
        <div class="quick-hero">
          <div>
            <p class="detail-label">Chequeo en 20 segundos</p>
            <h2>Antes de derivar</h2>
            <p>CRS por Pitágoras o APS.</p>
          </div>
          <span class="quick-page">p. 2</span>
        </div>

        <div class="quick-decision">
          <div class="decision-question">
            <span>1</span>
            <div>
              <strong>¿El paciente entra en un flujo CRS?</strong>
              <small>Sigue por IC en Pitágoras.</small>
            </div>
          </div>
          <div class="decision-options">
            <button class="decision-option is-yes" data-focus-protocol-search type="button">
              <strong>Sí</strong>
              <span>Buscar flujo</span>
            </button>
            <button class="decision-option is-no" type="button">
              <strong>No</strong>
              <span>Derivar a APS</span>
            </button>
          </div>
        </div>

        <div class="quick-card-grid">
          <article class="quick-card quick-card-good">
            <span class="quick-number">1</span>
            <small>Paso seguro</small>
            <strong>Sistema válido</strong>
            <p>Toda derivación se realiza por Pitágoras.</p>
          </article>
          <article class="quick-card quick-card-alert">
            <span class="quick-number">2</span>
            <small>Evitar</small>
            <strong>No validado</strong>
            <p>Otros sistemas no están validados administrativamente.</p>
          </article>
          <article class="quick-card quick-card-route">
            <span class="quick-number">3</span>
            <small>Salida rápida</small>
            <strong>Fuera de flujo</strong>
            <p>Si no entra en los flujos descritos, derivar a APS.</p>
          </article>
        </div>

        <div class="quick-warning">
          <span>Alerta</span>
          <strong>IC directa no Pitágoras: se devuelve.</strong>
        </div>

        <div class="tags">
          <span class="tag">Reglas</span>
          <span class="tag">Pitágoras</span>
          <span class="tag">APS</span>
          <span class="tag">IC</span>
        </div>
      </section>
    `;
  }

  function renderQuickProtocol() {
    if (!isTargetRoute()) return;

    const detail = document.querySelector("#protocolDetail");
    if (!detail) return;

    const title = document.querySelector("#protocolTitle");
    const category = document.querySelector("#protocolCategory");
    if (title) title.textContent = "Antes de derivar";
    if (category) category.textContent = "Regla general · p. 2";

    if (detail.querySelector(".quick-protocol")) return;

    detail.innerHTML = quickProtocolMarkup();
  }

  function renderSpecialtiesQuickRules() {
    if (!isSpecialtiesRoute()) return;

    const rules = document.querySelector("#rulesPreview");
    if (!rules) return;

    rules.classList.add("quick-rules");
    if (rules.querySelector(".quick-protocol")) return;

    rules.innerHTML = quickProtocolMarkup();
  }

  function scheduleRender() {
    renderDelays.forEach((delay) => {
      window.setTimeout(renderQuickProtocol, delay);
      window.setTimeout(renderSpecialtiesQuickRules, delay);
    });
  }

  function watchProtocolDetail() {
    const detail = document.querySelector("#protocolDetail");
    if (!detail || detail.dataset.quickProtocolWatch) return;
    detail.dataset.quickProtocolWatch = "true";

    const observer = new MutationObserver(() => {
      if (isTargetRoute() && !detail.querySelector(".quick-protocol")) {
        window.setTimeout(renderQuickProtocol, 0);
      }
    });
    observer.observe(detail, { childList: true, subtree: false });
  }

  function watchRulesPreview() {
    const rules = document.querySelector("#rulesPreview");
    if (!rules || rules.dataset.quickRulesWatch) return;
    rules.dataset.quickRulesWatch = "true";

    const observer = new MutationObserver(() => {
      if (isSpecialtiesRoute() && !rules.querySelector(".quick-protocol")) {
        window.setTimeout(renderSpecialtiesQuickRules, 0);
      }
    });
    observer.observe(rules, { childList: true, subtree: false });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-focus-protocol-search]");
    if (!button) return;

    if (!isSpecialtiesRoute()) {
      window.location.hash = specialtiesHash;
      window.setTimeout(() => document.querySelector("#searchInput")?.focus(), 120);
      return;
    }

    document.querySelector("#searchInput")?.focus();
  });

  window.addEventListener("hashchange", scheduleRender);
  window.addEventListener("DOMContentLoaded", () => {
    watchProtocolDetail();
    watchRulesPreview();
    scheduleRender();
  });

  watchProtocolDetail();
  watchRulesPreview();
  scheduleRender();
})();
