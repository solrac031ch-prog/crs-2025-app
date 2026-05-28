import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdminRow = {
  email: string;
  display_name: string | null;
  role: string;
  active: boolean;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 18);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Metodo no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ ok: false, error: "Faltan variables de entorno de Supabase." }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ ok: false, error: "Sesion no recibida." }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  const requester = authData?.user;
  if (authError || !requester?.email) return json({ ok: false, error: "Sesion invalida." }, 401);

  const { data: requesterAdmin, error: requesterError } = await adminClient
    .from("crs_admins")
    .select("email,role,active")
    .eq("email", requester.email.toLowerCase())
    .maybeSingle();
  if (requesterError) return json({ ok: false, error: requesterError.message }, 500);
  if (!requesterAdmin?.active) return json({ ok: false, error: "Tu cuenta no tiene permiso de jefatura." }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  async function listAuthUsers() {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return data.users || [];
  }

  try {
    if (action === "listUsers") {
      const [{ data: adminRows, error }, authUsers] = await Promise.all([
        adminClient.from("crs_admins").select("email,display_name,role,active").order("email"),
        listAuthUsers(),
      ]);
      if (error) throw error;
      const byEmail = new Map(authUsers.map((user) => [cleanEmail(user.email), user]));
      const users = ((adminRows || []) as AdminRow[]).map((row) => {
        const authUser = byEmail.get(cleanEmail(row.email));
        return {
          email: row.email,
          display_name: row.display_name,
          role: row.role,
          active: row.active,
          auth_id: authUser?.id || "",
          last_sign_in_at: authUser?.last_sign_in_at || "",
        };
      });
      return json({ ok: true, users });
    }

    if (action === "upsertUser") {
      const email = cleanEmail(body.email);
      const displayName = String(body.displayName || "").trim();
      const role = String(body.role || "jefatura").trim();
      const providedPassword = String(body.password || "").trim();
      if (!email) return json({ ok: false, error: "Falta correo." }, 400);
      if (providedPassword && providedPassword.length < 6) {
        return json({ ok: false, error: "La clave debe tener al menos 6 caracteres." }, 400);
      }

      const authUsers = await listAuthUsers();
      const existing = authUsers.find((user) => cleanEmail(user.email) === email);
      const generatedPassword = existing || providedPassword ? "" : temporaryPassword();
      const password = providedPassword || generatedPassword;
      const userData = { full_name: displayName, role };

      if (existing) {
        const update: Record<string, unknown> = {
          email,
          user_metadata: userData,
          email_confirm: true,
        };
        if (password) update.password = password;
        const { error } = await adminClient.auth.admin.updateUserById(existing.id, update);
        if (error) throw error;
      } else {
        const { error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: userData,
        });
        if (error) throw error;
      }

      const { error: upsertError } = await adminClient.from("crs_admins").upsert({
        email,
        display_name: displayName,
        role,
        active: true,
      }, { onConflict: "email" });
      if (upsertError) throw upsertError;

      return json({ ok: true, temporaryPassword: generatedPassword });
    }

    if (action === "deleteUser") {
      const email = cleanEmail(body.email);
      if (!email) return json({ ok: false, error: "Falta correo." }, 400);
      if (email === cleanEmail(requester.email)) {
        return json({ ok: false, error: "No puedes eliminar tu propia cuenta mientras estas dentro." }, 400);
      }
      const authUsers = await listAuthUsers();
      const existing = authUsers.find((user) => cleanEmail(user.email) === email);
      if (existing) {
        const { error } = await adminClient.auth.admin.deleteUser(existing.id);
        if (error) throw error;
      }
      const { error: deleteError } = await adminClient.from("crs_admins").delete().eq("email", email);
      if (deleteError) throw deleteError;
      return json({ ok: true });
    }

    return json({ ok: false, error: "Accion no reconocida." }, 400);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
