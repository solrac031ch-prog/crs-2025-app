(() => {
  const SESSION_KEYS = ["crsGoogleSessionV1", "crsAuthSessionV3"];
  const RETURN_HASH_KEY = "crsGoogleReturnHashV1";

  function accountChooserUrl() {
    localStorage.setItem(RETURN_HASH_KEY, location.hash || "#/jefatura");
    const baseReturnUrl = `${location.origin}${location.pathname}`;
    const host = ["accounts", "google", "com"].join(".");
    return `https://${host}/AccountChooser?continue=${encodeURIComponent(baseReturnUrl)}`;
  }

  function restoreReturnHash() {
    const savedHash = localStorage.getItem(RETURN_HASH_KEY);
    if (savedHash && (!location.hash || location.hash === "#/inicio")) {
      localStorage.removeItem(RETURN_HASH_KEY);
      location.hash = savedHash;
    }
  }

  window.addEventListener("click", (event) => {
    const button = event.target.closest("[data-google-add-account]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
    location.href = accountChooserUrl();
  }, true);

  restoreReturnHash();
  window.addEventListener("pageshow", restoreReturnHash);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", restoreReturnHash);
})();
