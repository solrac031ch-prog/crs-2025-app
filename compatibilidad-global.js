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

  if (document.readyState === "complete") registerServiceWorker();
  else window.addEventListener("load", registerServiceWorker, { once: true });
})();
