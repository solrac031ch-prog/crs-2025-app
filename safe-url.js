(() => {
  const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const EXPLICIT_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
  const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

  function safe(value) {
    const raw = String(value || "").trim();
    if (!raw || CONTROL_CHARS.test(raw)) return "";

    try {
      let url;
      if (raw.startsWith("//")) url = new URL(`https:${raw}`);
      else if (EXPLICIT_SCHEME.test(raw)) url = new URL(raw);
      else url = new URL(raw, location.href);

      if (url.protocol === "https:") return url.href;
      if (url.protocol === "http:" && LOCAL_HTTP_HOSTS.has(url.hostname)) return url.href;
      return "";
    } catch (_) {
      return "";
    }
  }

  function required(value, field = "URL") {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const normalized = safe(raw);
    if (!normalized) throw new Error(`${field}: usa una URL HTTPS válida.`);
    return normalized;
  }

  window.CRS_URL_POLICY = Object.freeze({ safe, required });
})();