import fs from 'node:fs';

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(before)) throw new Error(`No se encontró bloque esperado en ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceOnce('gestion-pacientes-core.js', `  async function apiPost(action, payload = {}) {
    await refreshAuth();
    const url = apiUrl();
    if (!url) return { ok: false, error: "Falta configurar appsScriptUrl." };
    const user = activeUser();
    if (!user.email) return { ok: false, error: "Inicia sesión antes de usar Gestión de pacientes." };
    try {
      const response = await fetch(url, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, email: user.email, ...payload })
      });
      const data = await response.json();
      return data && typeof data === "object" ? data : { ok: false, error: "Respuesta inválida del servicio de gestión." };
    } catch (error) {
      return { ok: false, error: error?.message || "No se pudo conectar con el servicio de gestión." };
    }
  }`, `  async function apiPost(action, payload = {}) {
    await refreshAuth();
    const url = apiUrl();
    if (!url) return { ok: false, error: "Falta configurar appsScriptUrl." };
    const user = activeUser();
    if (!user.email) return { ok: false, error: "Inicia sesión antes de usar Gestión de pacientes." };

    const api = window.CRS_SUPABASE?.client?.();
    const anonKey = String(window.CRS_SUPABASE_CONFIG?.anonKey || "").trim();
    if (!api?.auth?.getSession || !anonKey) return { ok: false, error: "No se pudo validar la sesión segura de Jefatura." };

    try {
      const { data: sessionData, error: sessionError } = await api.auth.getSession();
      const accessToken = String(sessionData?.session?.access_token || "").trim();
      if (sessionError || !accessToken) return { ok: false, error: "La sesión de Jefatura venció. Vuelve a iniciar sesión." };

      const response = await fetch(url, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, email: user.email, accessToken, supabaseAnonKey: anonKey, ...payload })
      });
      const data = await response.json();
      if (data?.error === "Acción no reconocida") {
        return { ok: false, error: "El backend de Gestión pacientes está desactualizado. Actualiza el Apps Script a la versión CRS v2." };
      }
      return data && typeof data === "object" ? data : { ok: false, error: "Respuesta inválida del servicio de gestión." };
    } catch (error) {
      return { ok: false, error: error?.message || "No se pudo conectar con el servicio de gestión." };
    }
  }`);

replaceOnce('index.html', '<script src="./gestion-pacientes-core.js?v=5"></script>', '<script src="./gestion-pacientes-core.js?v=6"></script>');

replaceOnce('.github/workflows/validate.yml', `      - name: Validar privacidad de Gestión pacientes
        run: node scripts/check-patient-privacy.mjs
`, `      - name: Validar privacidad de Gestión pacientes
        run: node scripts/check-patient-privacy.mjs

      - name: Validar contrato seguro de Gestión pacientes
        run: node scripts/check-patient-backend-contract.mjs
`);

console.log('Contrato seguro de Gestión pacientes aplicado.');
