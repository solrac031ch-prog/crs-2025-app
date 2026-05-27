(() => {
  function defineValue(target, name, value) {
    try {
      Object.defineProperty(target, name, {
        value,
        configurable: true,
        writable: true
      });
    } catch (_) {
      target[name] = value;
    }
  }

  if (!String.prototype.replaceAll) {
    defineValue(String.prototype, "replaceAll", function replaceAllPolyfill(search, replacement) {
      const source = String(this);
      if (search instanceof RegExp) {
        if (!search.global) throw new TypeError("replaceAll requires a global RegExp");
        return source.replace(search, replacement);
      }
      return source.split(String(search)).join(String(replacement));
    });
  }

  if (!Array.prototype.flat) {
    defineValue(Array.prototype, "flat", function flatPolyfill(depth) {
      const maxDepth = depth === undefined ? 1 : Number(depth) || 0;
      const result = [];
      (function flatten(items, level) {
        Array.prototype.forEach.call(items, (item) => {
          if (Array.isArray(item) && level > 0) flatten(item, level - 1);
          else result.push(item);
        });
      })(this, maxDepth);
      return result;
    });
  }

  if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (window.Element && !Element.prototype.closest) {
    defineValue(Element.prototype, "closest", function closestPolyfill(selector) {
      let node = this;
      while (node && node.nodeType === 1) {
        if (node.matches && node.matches(selector)) return node;
        node = node.parentElement || node.parentNode;
      }
      return null;
    });
  }

  if (window.NodeList && !NodeList.prototype.forEach) {
    defineValue(NodeList.prototype, "forEach", Array.prototype.forEach);
  }

  function installResponsiveGuard() {
    if (document.getElementById("crs-global-responsive-guard")) return;
    const style = document.createElement("style");
    style.id = "crs-global-responsive-guard";
    style.textContent = `
      html,body{max-width:100%;overflow-x:hidden}
      #chiefContent,#chiefContent *,#managementContent,#managementContent *{min-width:0}
      #chiefContent [data-sb-chief-shell],#managementContent .public-shell{max-width:100%;overflow:hidden}
      #chiefContent .sb-chief-hero,#chiefContent .sb-chief-card,#chiefContent .sb-ok,#chiefContent .sb-warn,#chiefContent .sb-error{max-width:100%;overflow-wrap:anywhere;word-break:normal}
      #chiefContent .sb-chief-hero h2{max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
      #chiefContent .sb-chief-grid{grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))!important}
      #chiefContent input,#chiefContent select,#chiefContent textarea,#chiefContent button{max-width:100%}
      @media(max-width:680px){
        .layout{width:100%;padding-left:12px!important;padding-right:12px!important}
        .route-actions{grid-template-columns:1fr!important}
        #chiefContent .sb-chief-grid{grid-template-columns:minmax(0,1fr)!important}
        #chiefContent .sb-chief-hero{padding:18px!important;border-radius:14px!important;overflow:visible!important}
        #chiefContent .sb-chief-hero h2{font-size:clamp(1.45rem,6.8vw,1.85rem)!important;line-height:1.08!important}
        #chiefContent .sb-chief-hero p{font-size:.96rem!important;line-height:1.45!important}
        #chiefContent .sb-chief-card{padding:14px!important;border-radius:12px!important}
      }
    `;
    document.head.append(style);
  }

  function loadJefaturaUsuarios() {
    if (document.querySelector("script[data-jefatura-usuarios]")) return;
    const script = document.createElement("script");
    script.src = "./jefatura-usuarios.js?v=1";
    script.dataset.jefaturaUsuarios = "true";
    (document.body || document.documentElement).append(script);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!/^https:$/.test(location.protocol)) return;
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      if (typeof registration.update === "function") registration.update();
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => undefined);
  }

  window.CRS_REGISTER_SERVICE_WORKER = registerServiceWorker;

  installResponsiveGuard();
  loadJefaturaUsuarios();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installResponsiveGuard();
      loadJefaturaUsuarios();
    }, { once: true });
  } else {
    installResponsiveGuard();
    loadJefaturaUsuarios();
  }

  if (document.readyState === "complete") registerServiceWorker();
  else window.addEventListener("load", registerServiceWorker, { once: true });
})();
