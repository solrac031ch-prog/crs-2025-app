(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  function addStyle() {
    if ($("#gestion-presentacion-style")) return;
    const style = document.createElement("style");
    style.id = "gestion-presentacion-style";
    style.textContent = `
      #managementPage .page-head{align-items:end;border-bottom:1px solid rgba(15,23,42,.08);padding-bottom:14px}
      #managementPage .page-head .eyebrow{color:#0f766e;font-weight:900;letter-spacing:.02em}
      #managementTitle{font-size:clamp(2rem,5vw,3.4rem);line-height:1;margin:0;color:#10201c}
      .management-v2-home{position:relative;overflow:hidden;border:0;background:linear-gradient(135deg,#0f172a 0%,#14532d 48%,#0f766e 100%);color:#fff;box-shadow:0 24px 60px rgba(15,23,42,.24);padding:clamp(20px,4vw,34px)}
      .management-v2-home:before{content:"";position:absolute;right:-85px;bottom:-115px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.12)}
      .management-v2-home:after{content:"";position:absolute;right:42px;top:28px;width:82px;height:82px;border-radius:22px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);transform:rotate(8deg)}
      .management-v2-home h2{font-size:clamp(2rem,5vw,3.7rem);line-height:.98;margin:0 0 8px;color:#fff;max-width:720px}
      .management-v2-home p{max-width:720px;color:#def7ef;font-size:1.03rem;line-height:1.5;margin:0 0 18px}
      .management-v2-home .law-actions{position:relative;z-index:1;gap:10px;margin:10px 0 18px}
      .management-v2-home .document-button{background:#fff;color:#0f513f;border-color:#fff;box-shadow:0 8px 20px rgba(15,23,42,.14)}
      .management-v2-home .document-button:first-child{background:#f59e0b;border-color:#f59e0b;color:#1f1300}
      .management-v2-home .rule-fields{position:relative;z-index:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px}
      .management-v2-home .rule-field{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:13px;color:#fff}
      .management-v2-home .rule-field strong{display:block;color:#fff;font-size:.86rem;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
      .management-v2-home .rule-field span{color:#e8fff8;font-weight:800}
      .gestion-overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}
      .gestion-overview-card{display:grid;gap:8px;padding:16px;border:1px solid #dfe8e4;border-left:6px solid #0f766e;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.08)}
      .gestion-overview-card strong{font-size:1.08rem;color:#10201c}.gestion-overview-card span{color:#52615c;line-height:1.4}.gestion-overview-card.amber{border-left-color:#f59e0b}.gestion-overview-card.blue{border-left-color:#2563eb}
      @media(max-width:680px){.management-v2-home{padding:20px}.management-v2-home .law-actions{display:grid}.management-v2-home .document-button{width:100%;justify-content:center}}
    `;
    document.head.append(style);
  }

  function enhanceManagement() {
    if (!location.hash.startsWith("#/gestion")) return;
    addStyle();
    const content = $("#managementContent");
    const hero = $(".management-v2-home", content || document);
    if (!content || !hero || $(".gestion-overview-grid", content)) return;

    const grid = document.createElement("section");
    grid.className = "gestion-overview-grid";
    grid.innerHTML = `
      <article class="gestion-overview-card">
        <strong>Casos priorizados</strong>
        <span>Los casos registrados desde los flujos quedan listos para revisión y exportación por jefatura.</span>
      </article>
      <article class="gestion-overview-card amber">
        <strong>Planillas operativas</strong>
        <span>Jefatura mantiene los enlaces de especialistas de llamado, UHD y visita diaria.</span>
      </article>
      <article class="gestion-overview-card blue">
        <strong>Accesos por rol</strong>
        <span>Administradores gestionan permisos; jefes de turno y subrogantes usan la app sin editar el panel restringido.</span>
      </article>
    `;
    hero.insertAdjacentElement("afterend", grid);
  }

  addEventListener("hashchange", () => {
    setTimeout(enhanceManagement, 120);
    setTimeout(enhanceManagement, 500);
  });
  setTimeout(enhanceManagement, 150);
  setInterval(enhanceManagement, 1600);
})();