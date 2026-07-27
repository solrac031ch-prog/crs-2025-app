(() => {
  function patchClient() {
    const api = window.CRS_SUPABASE?.client?.();
    if (!api || api.__crsEmailLoginCompat || typeof api.rpc !== "function") return;

    const originalRpc = api.rpc.bind(api);
    api.rpc = (functionName, args, options) => {
      if (functionName === "crs_login_email") {
        const login = String(args?.login_text || "").trim().toLowerCase();
        if (login.includes("@")) {
          return Promise.resolve({ data: login, error: null });
        }
      }
      return originalRpc(functionName, args, options);
    };

    Object.defineProperty(api, "__crsEmailLoginCompat", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }

  patchClient();
  window.addEventListener("crs:supabase-ready", patchClient);
})();
