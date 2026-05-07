const CACHE_NAME = "crs-hph-2025-v43";

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css?v=38",
  "./ley-urgencias-data.js?v=38",
  "./app.js?v=38",
  "./logo-urgencia-hph.svg",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./protocol-docs/decreto-34-25-oct-2022.pdf",
  "./form-docs/examenes-hph.pdf",
  "./form-docs/examenes-hph-rellenable.pdf",
  "./form-docs/ley-urgencia-activacion.pdf",
  "./form-docs/ley-urgencia-activacion-rellenable.pdf",
  "./form-docs/ley-urgencia-consentimiento.pdf",
  "./form-docs/ley-urgencia-consentimiento-rellenable.pdf",
  "./form-docs/mayo.pdf",
  "./form-docs/medicamentos-uso-ocasional.pdf",
  "./form-docs/medicamentos-uso-ocasional-rellenable.pdf",
  "./form-docs/telefonos-hph.pdf",
  "./form-docs/transfusion.pdf",
  "./form-docs/transfusion-rellenable.pdf"
];

const PHONE_PATCH = `
(() => {
  if (window.__phoneDirectoryPatchV43) return;
  window.__phoneDirectoryPatchV43 = true;

  const DIRECTORY_TITLE = "Directorio telefonico";
  const DATA = [
    ["Gestion de Camas", "hospitalizacion", "Unidad de Gestion de Camas", [["Gestion de Camas", "260778"], ["Ambulancias HPH", "260559"]]],
    ["Informatica", "apoyo", "Departamento de Informatica", [["Mesa de Ayuda", "260597"], ["Informatica Urgencia", "222270"]]],
    ["Operaciones", "apoyo", "Ingenieria y Operaciones", [["Talleres Supervisor", "260558"], ["Talleres", "222257"], ["Calderas", "260560"], ["Biomedica Equipos Medicos", "260756"], ["Guardias", "260551"], ["Roperia", "260580"], ["Empresa de Aseo", "260561"], ["Registro Civil", "226114029"]]],
    ["Alimentacion", "apoyo", "Alimentacion", [["Nutricion", "260571 / 260721"]]],
    ["Abastecimiento", "apoyo", "Abastecimiento", [["Insumos", "265292"]]],
    ["Farmacia", "apoyo", "Farmacia", [["Quimicos Farmaceuticos", "222222"], ["Farmacia", "260585"]]],
    ["Domiciliaria", "hospitalizacion", "Hospitalizacion Domiciliaria", [["Hospitalizacion Domiciliaria", "260769"]]],
    ["Segundo Piso", "hospitalizacion", "Hospitalizacion Segundo Piso", [["Enfermeria CX Basico 2do Piso", "222043"]]],
    ["Cuarto Piso", "hospitalizacion", "Hospitalizacion Cuarto Piso", [["ACE (413 a 418) / Agudo 1 (414 a 417)", "260703"], ["ACE (425 a 426) / Agudo 2 (421 a 424)", "260704"], ["UTAC (427-428-429) / Cuidados Basicos Sur Poniente (430 a 435)", "260705"], ["Cuidados Basicos Nor Poniente (401 a 412)", "222248"]]],
    ["Quinto Piso", "hospitalizacion", "Hospitalizacion Quinto Piso", [["UTI Nor Oriente (513-514)", "222230"], ["UTI Sur Oriente (515-516)", "260720"], ["Cirugia Basico", "260719 / 260764"]]],
    ["Sexto Piso", "hospitalizacion", "Hospitalizacion Sexto Piso", [["Sexto Piso (Geriatria - Agudo) (601-620)", "260873 / 260872"]]],
    ["UPC", "critico", "Cuidados Criticos (UPC)", [["Cuidados Intensivos 1 (104-1 a 104-6)", "260641"], ["Cuidados Intensivos 2 (105-1 a 105-6)", "260642"]]],
    ["Urgencia Maternidad", "urgencia", "Urgencia Maternidad", [["3 Piso Maternidad", "260693"], ["Est. Enfermeria Urgencia", "260654"]]],
    ["Interculturalidad", "ambulatorio", "Interculturalidad", [["Facilitadora Creole", "56932421714"], ["Unidad de Salud Intercultural", "260524"]]],
    ["Ambulatorio", "ambulatorio", "Ambulatorio", [["Dialisis / Endoscopia", "260709 / 260543"], ["Oftalmologia", "260542"], ["Cardiologia", "260752"], ["Otorrinolaringologia", "260532"], ["Cuidados Paliativos", "260545"], ["Salud Mental", "260527"], ["Urologia", "260855"], ["Anatomia Patologica", "260584"]]],
    ["Urgencia Adulto", "urgencia", "Unidad de Emergencia Adulto", [["Enfermera Supervisora", "260782"], ["Enfermera Tecnica", "260765"], ["Secretaria", "260780"], ["Admision", "260767"], ["Informaciones", "260708 / 260865"], ["Observacion 1", "260761 / 260763"], ["Observacion 2", "260267 / 222269"], ["ERA 2", "260864"], ["Box", "260766"], ["REA 1", "260760"], ["REA 2", "260784"], ["Carabinero", "222603 / 9-94269977"]]],
    ["Imagenologia", "diagnostico", "Unidad de Imagenologia", [["Rayos", "260511"], ["Sala Escaner", "260512"], ["Escaner Urgencia", "222089"], ["Ecografia", "222213"]]],
    ["Laboratorio", "diagnostico", "Laboratorio", [["Laboratorio de Microbiologia", "260515"], ["Laboratorio de Hematologia", "260516"], ["Laboratorio Urgencia", "222214"], ["Recepcion de Muestras Hospital", "260518"]]],
    ["Transfusional", "diagnostico", "Medicina Transfusional", [["UMT", "260519"], ["Banco Sangre", "260520"]]],
    ["Pabellones", "critico", "Pabellones y Esterilizacion", [["Pabellon Central", "260631 / 260632"]]],
    ["Dialisis Externa", "externo", "Centro de Dialisis", [["Vespucio - Max Jara 10111, La Granja", "232424170 / 225469373"], ["La Granja - Canto General 050, La Granja", "2-5439958"], ["San Gabriel - Av Gabriela 02540, La Pintana", "22 5429264"], ["San Ramon - Av. Ossa 1891, San Ramon", "22-5436264"], ["Nephrocare - Av Macken 6969, La Florida", "2217141"], ["Dialisis 300 - Duble Almeyda 2911, Nunoa", "3264660"], ["Renacer - Santa Ester 747, San Miguel", "5523967"]]],
    ["Extrasistema", "externo", "Extrasistema", [["Clinica Ensenada", "227900100"], ["Hemodinamia HSR", "262250"], ["Imagenologia HLF", "221361"], ["Imagenologia HSR", "262466"], ["Neurocirugia HSR", "262503 / 262284"], ["Neurologia HSR", "225762779"], ["Maxilo", "262356"], ["Reanimador HSR", "262353"]]]
  ];
  const FILTERS = [["todos", "Todos"], ["urgencia", "Urgencia"], ["critico", "Criticos"], ["hospitalizacion", "Hospitalizacion"], ["diagnostico", "Diagnostico"], ["apoyo", "Apoyo"], ["ambulatorio", "Ambulatorio"], ["externo", "Externo"]];
  const FAST = [["REA 1 / REA 2", "REA"], ["Laboratorio Urgencia", "Laboratorio Urgencia"], ["Ambulancias HPH", "Ambulancias HPH"], ["Telefonos HSR", "HSR"], ["Telefonos HLF", "HLF"]];
  const state = window.__phoneDirectoryState || (window.__phoneDirectoryState = { q: "", f: "todos" });

  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function tel(value) {
    return value.replace(/[^0-9+]/g, "");
  }

  function splitPhones(value) {
    return value.split("/").map((item) => item.trim()).filter(Boolean);
  }

  function esc(value) {
    return encodeURIComponent(value);
  }

  function phoneLinks(value) {
    return splitPhones(value).map((phone) => "<a class=up-tel href=tel:" + tel(phone) + "><span>&#9742;</span>" + phone + "</a>").join("");
  }

  function syncLabels() {
    const nav = document.querySelector('[data-route-link="telefonos"]');
    if (nav) nav.textContent = DIRECTORY_TITLE;

    const title = document.querySelector("#phonesTitle");
    if (title) title.textContent = DIRECTORY_TITLE;

    const eyebrow = document.querySelector("#phonesPage .eyebrow");
    if (eyebrow) eyebrow.textContent = "Telefonos y anexos";

    document.querySelectorAll('a[href="#/telefonos"]').forEach((link) => {
      const kicker = link.querySelector(".action-kicker");
      const strong = link.querySelector("strong");
      const description = Array.from(link.children).find((child) => child.tagName === "SPAN" && !child.classList.contains("action-top"));
      if (kicker) kicker.textContent = "Directorio";
      if (strong) strong.textContent = DIRECTORY_TITLE;
      if (description) description.textContent = "Anexos y contactos frecuentes.";
    });
  }

  function addStyle() {
    if (document.querySelector("#up-css")) return;
    const style = document.createElement("style");
    style.id = "up-css";
    style.textContent = ".up-wrap{display:grid;gap:14px}.up-sos{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:14px;align-items:center;padding:clamp(16px,4vw,24px);color:#fff;background:linear-gradient(135deg,#9f1f17,#c93428 58%,#b86f05);border-radius:8px;box-shadow:var(--shadow)}.up-sos span,.up-k,.up-search span,.up-count span{font-size:.78rem;font-weight:900;text-transform:uppercase}.up-sos h2{margin:4px 0 0;font-size:clamp(1.45rem,4vw,2.65rem);line-height:1.03}.up-sos a{min-width:170px;display:grid;gap:4px;justify-items:center;padding:14px;color:#fff;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.38);border-radius:8px}.up-sos strong{font-size:clamp(2rem,5vw,3.2rem);line-height:1}.up-fast{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.up-card{display:grid;gap:9px;min-height:112px;padding:14px;color:var(--ink);text-align:left;background:var(--panel);border:1px solid var(--line);border-left:6px solid var(--danger);border-radius:8px;box-shadow:var(--shadow);cursor:pointer}.up-card small{color:var(--muted);font-weight:800}.up-card:nth-child(2){border-left-color:#b7791f}.up-card:nth-child(3){border-left-color:var(--blue)}.up-card:nth-child(4){border-left-color:var(--accent)}.up-card:nth-child(5){border-left-color:#22577a}.up-k,.up-search span,.up-count span{color:var(--muted)}.up-tools{display:grid;grid-template-columns:minmax(220px,1fr)auto;gap:10px}.up-search{display:grid;gap:7px;padding:12px;background:var(--panel);border:1px solid var(--line);border-radius:8px}.up-search input{min-height:46px;padding:0 13px;color:var(--ink);background:#fbfcfc;border:1px solid var(--line-strong);border-radius:6px;outline:none}.up-search input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.up-count{min-width:106px;display:grid;place-items:center;padding:10px;text-align:center;background:var(--panel);border:1px solid var(--line);border-radius:8px}.up-count strong{font-size:1.65rem;line-height:1}.up-filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}.up-chip{min-height:38px;flex:0 0 auto;padding:0 12px;color:var(--ink);background:#fff;border:1px solid var(--line-strong);border-radius:6px;cursor:pointer;font-weight:800}.up-chip[data-a]{color:#fff;background:var(--accent-dark);border-color:var(--accent-dark)}.up-list{display:grid;gap:10px}.up-sec{background:var(--panel);border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow);overflow:hidden}.up-sec summary{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:10px;align-items:center;padding:14px;cursor:pointer;list-style:none}.up-sec summary::-webkit-details-marker{display:none}.up-sec small{display:block;margin-top:3px;color:var(--muted);font-weight:700}.up-sec b{min-width:32px;padding:5px 8px;color:var(--accent-dark);background:var(--accent-soft);border-radius:999px;font-size:.78rem;text-align:center}.up-body{border-top:1px solid var(--line)}.up-row{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:10px;align-items:center;padding:12px 14px;background:#fff}.up-row+.up-row{border-top:1px solid #edf0ed}.up-main{display:grid;gap:7px}.up-main strong{line-height:1.18;overflow-wrap:anywhere}.up-phones{display:flex;flex-wrap:wrap;gap:7px}.up-tel{min-height:32px;display:inline-flex;align-items:center;gap:6px;padding:5px 9px;color:#8a1f17;background:#fff1ef;border:1px solid #ffd1cb;border-radius:999px;font-weight:900;white-space:nowrap}.up-copy{width:38px;height:38px;display:grid;place-items:center;color:var(--muted);background:#fff;border:1px solid var(--line-strong);border-radius:6px;cursor:pointer}.up-empty{padding:22px;color:var(--muted);background:var(--panel);border:1px dashed var(--line-strong);border-radius:8px}.up-toast{position:fixed;right:16px;bottom:16px;z-index:50;max-width:min(360px,calc(100% - 32px));padding:12px 14px;color:#fff;background:#101214;border-radius:8px;box-shadow:var(--shadow);opacity:0;transform:translateY(12px);transition:opacity 160ms ease,transform 160ms ease;pointer-events:none;font-weight:800}.up-toast.show{opacity:1;transform:translateY(0)}@media(max-width:1080px){.up-fast{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.up-fast{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.up-sos,.up-tools{grid-template-columns:1fr}.up-fast{grid-template-columns:1fr}.up-sos a,.up-count{width:100%}}";
    document.head.append(style);
  }

  function copy(value) {
    const decoded = decodeURIComponent(value);
    const done = () => toast("Copiado: " + decoded);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(decoded).then(done).catch(() => toast(decoded));
    } else {
      toast(decoded);
    }
  }

  function toast(value) {
    const node = document.querySelector("[data-up-toast]");
    if (!node) return;
    node.textContent = value;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 1700);
  }

  function matches(item, section, query) {
    return !query || normalize(section + " " + item[0] + " " + item[1]).includes(query);
  }

  function filteredData() {
    const query = normalize(state.q.trim());
    return DATA
      .map((section) => [
        section[0],
        section[1],
        section[2],
        section[3].filter((item) => (state.f === "todos" || section[1] === state.f) && matches(item, section[2], query))
      ])
      .filter((section) => section[3].length);
  }

  function render() {
    syncLabels();
    if (!location.hash.startsWith("#/telefonos")) return;

    const root = document.querySelector("#phonesContent");
    if (!root) return;
    addStyle();

    const searchWasActive = document.activeElement && document.activeElement.matches("[data-phone-search]");
    const cursor = searchWasActive ? document.activeElement.selectionStart : null;
    const list = filteredData();
    const count = list.reduce((total, section) => total + section[3].length, 0);
    const total = DATA.reduce((sum, section) => sum + section[3].length, 0);

    root.innerHTML = "<section class=up-wrap><section class=up-sos><div><span>S.O.S.</span><h2>Emergencias, claves rojas y amarilla</h2></div><a href=tel:260745><small>Anexo directo</small><strong>260745</strong></a></section><section class=up-fast>" +
      FAST.map((item) => "<button class=up-card data-qset=" + esc(item[1]) + " type=button><span class=up-k>Acceso rapido</span><strong>" + item[0] + "</strong><small>Ver contactos</small></button>").join("") +
      "</section><section class=up-tools><label class=up-search><span>Buscar</span><input data-phone-search type=search placeholder=\"Buscar por nombre, area o numero\" autocomplete=off></label><div class=up-count><strong>" + count + "</strong><span>de " + total + "</span></div></section><nav class=up-filters>" +
      FILTERS.map((item) => "<button class=up-chip " + (state.f === item[0] ? "data-a" : "") + " data-f=" + item[0] + " type=button>" + item[1] + "</button>").join("") +
      "</nav><section class=up-list>" +
      (list.length
        ? list.map((section) => "<details class=up-sec " + (state.q.trim() || section[1] === "urgencia" || section[1] === "critico" || section[1] === "diagnostico" ? "open" : "") + "><summary><span><strong>" + section[2] + "</strong><small>" + section[3].length + " contactos</small></span><b>" + section[3].length + "</b></summary><div class=up-body>" + section[3].map((item) => "<div class=up-row><div class=up-main><strong>" + item[0] + "</strong><div class=up-phones>" + phoneLinks(item[1]) + "</div></div><button class=up-copy data-copy=" + esc(item[0] + ": " + item[1]) + " type=button>&#10697;</button></div>").join("") + "</div></details>").join("")
        : "<div class=up-empty>No hay resultados para esta busqueda.</div>") +
      "</section></section><div class=up-toast data-up-toast role=status aria-live=polite></div>";

    const input = root.querySelector("[data-phone-search]");
    if (input) {
      input.value = state.q;
      if (searchWasActive) {
        input.focus({ preventScroll: true });
        if (cursor !== null) input.setSelectionRange(cursor, cursor);
      }
    }

    root.oninput = (event) => {
      const inputNode = event.target.closest("[data-phone-search]");
      if (!inputNode) return;
      state.q = inputNode.value;
      render();
    };

    root.onclick = (event) => {
      const filter = event.target.closest("[data-f]");
      const quick = event.target.closest("[data-qset]");
      const copyButton = event.target.closest("[data-copy]");
      if (quick) {
        state.q = decodeURIComponent(quick.dataset.qset);
        state.f = "todos";
        render();
        return;
      }
      if (filter) {
        state.f = filter.dataset.f;
        render();
        return;
      }
      if (copyButton) copy(copyButton.dataset.copy);
    };
  }

  function go() {
    syncLabels();
    if (location.hash.startsWith("#/telefonos")) setTimeout(render, 0);
  }

  window.addEventListener("hashchange", go);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
  go();
})();
`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  const isGet = request.method === "GET";
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isAppJs = isGet && isSameOrigin && requestUrl.pathname.endsWith("/app.js");

  if (isAppJs) {
    event.respondWith(
      (async () => {
        const response = await fetch(request).catch(() => caches.match(request));
        const text = response ? await response.text() : "";
        return new Response(text + "\n;" + PHONE_PATCH, {
          headers: { "Content-Type": "application/javascript; charset=utf-8" }
        });
      })()
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const response = await fetch(request).catch(() => caches.match("./index.html"));
        if (!response) return caches.match("./index.html");
        const html = await response.text();
        const patched = html.includes("</body>")
          ? html.replace("</body>", "<script>" + PHONE_PATCH + "</script></body>")
          : html + "<script>" + PHONE_PATCH + "</script>";
        return new Response(patched, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      })()
    );
    return;
  }

  if (isGet && isSameOrigin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
}
