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

  function prepareSwitchButtons(root = document) {
    root.querySelectorAll("[data-google-add-account]").forEach((button) => {
      button.removeAttribute("data-google-add-account");
      button.setAttribute("data-google-account-switch", "true");
      button.textContent = "Agregar / cambiar cuenta Google";
    });
  }

  function switchAccount(event) {
    const button = event.target.closest("[data-google-account-switch]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
    location.href = accountChooserUrl();
  }

  const observer = new MutationObserver(() => prepareSwitchButtons());
  if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("click", switchAccount, true);
  restoreReturnHash();
  window.addEventListener("pageshow", restoreReturnHash);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { restoreReturnHash(); prepareSwitchButtons(); });
  else prepareSwitchButtons();
})();
