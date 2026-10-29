import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdminRow = {
  email: string;
  username: string | null;
  display_name: string | null;
  role: string;
  active: boolean;
};

const MANAGER_ROLES = new Set(["creador", "owner", "desarrollador", "disenador", "diseñador", "admin"]);
const ALLOWED_ROLES = new Set(["creador", "owner", "desarrollador", "disenador", "diseñador", "admin", "jefe", "jefatura", "jefe_turno"]);
const LEGACY_ADMINS = new Map([
  ["mdcarlosherrera@gmail.com", { display_name: "Dr Carlos Herrera", role: "admin" }],
  ["mariajose.marinc@gmail.com", { display_name: "Dr Maria-Jose Marin", role: "admin" }],
]);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeRole(value: unknown) {
  const role = cleanText(value).toLowerCase();
  return role === "administrador" ? "admin" : role;
}

function missingColumn(error: unknown, column: string) {
  const message = error instanceof Error
    ? error.message
    : String((error as { message?: unknown } | null)?.message || error || "");
  return new RegExp(`column\\s+[^\\s.]+\\.${column}\\s+does not exist|column\\s+${column}\\s+does not exist|Could not find.*${column}.*column`, "i").test(message);
}

function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const raw = Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
  return `M!${raw.slice(0, 18)}9a`;
}

function fallbackProfileFromAuth(user: Record<string, any> | null | undefined) {
  const email = cleanEmail(user?.email);
  if (!email) return null;
  const metadataRole = normalizeRole(user?.app_metadata?.crs_role);
  const legacy = LEGACY_ADMINS.get(email);
  const role = ALLOWED_ROLES.has(metadataRole) ? metadataRole : normalizeRole(legacy?.role);
  if (!ALLOWED_ROLES.has(role)) return null;
  const displayName = cleanText(
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    legacy?.display_name ||
    email
  );
  return { email, display_name: displayName || email, role, active: true };
}

async function readAdminProfile(adminClient: any, email: string): Promise<AdminRow | null> {
  let result = await adminClient
    .from("crs_admins")
    .select("email,username,display_name,role,active")
    .eq("email", email)
    .maybeSingle();

  if (result.error && missingColumn(result.error, "username")) {
    result = await adminClient
      .from("crs_admins")
      .select("email,display_name,role,active")
      .eq("email", email)
      .maybeSingle();
    if (result.data) (result.data as Record<string, unknown>).username = null;
  }

  if (result.error) throw result.error;
  return (result.data as AdminRow | null) || null;
}

async function restoreAdminProfile(adminClient: any, user: Record<string, any>, createdBy: string) {
  const fallback = fallbackProfileFromAuth(user);
  if (!fallback) return null;
  const { error } = await adminClient
    .from("crs_admins")
    .upsert({ ...fallback, created_by_email: createdBy || fallback.email }, { onConflict: "email" });
  if (error) throw error;
  return readAdminProfile(adminClient, fallback.email);
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
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  const requester = authData?.user;
  if (authError || !requester?.email) return json({ ok: false, error: "Sesion invalida." }, 401);

  const requesterEmail = cleanEmail(requester.email);
  let requesterAdmin: AdminRow | null = null;
  try {
    requesterAdmin = await readAdminProfile(adminClient, requesterEmail);
    if (!requesterAdmin) {
      requesterAdmin = await restoreAdminProfile(adminClient, requester as unknown as Record<string, any>, requesterEmail);
    }
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }

  const requesterRole = normalizeRole(requesterAdmin?.role);
  if (requesterAdmin?.active !== true || !ALLOWED_ROLES.has(requesterRole)) {
    return json({ ok: false, error: "Tu cuenta no tiene acceso activo a Jefatura." }, 403);
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = cleanText(body.action);
  const canManageUsers = MANAGER_ROLES.has(requesterRole);

  if (action === "getMe") {
    return json({
      ok: true,
      profile: {
        email: requesterAdmin.email,
        username: requesterAdmin.username || "",
        display_name: requesterAdmin.display_name || requester.email || "",
        role: requesterRole,
        active: true,
      },
      canManageUsers,
    });
  }

  if (!canManageUsers) {
    return json({ ok: false, error: "Tu cuenta no tiene permiso para administrar usuarios." }, 403);
  }

  async function listAuthUsers() {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return data.users || [];
  }

  try {
    if (action === "listUsers") {
      const authUsers = await listAuthUsers();
      const byEmail = new Map(authUsers.map((user) => [cleanEmail(user.email), user]));

      let adminResult = await adminClient
        .from("crs_admins")
        .select("email,username,display_name,role,active")
        .order("email");
      if (adminResult.error && missingColumn(adminResult.error, "username")) {
        adminResult = await adminClient
          .from("crs_admins")
          .select("email,display_name,role,active")
          .order("email");
        if (adminResult.data) adminResult.data = adminResult.data.map((row) => ({ ...row, username: null }));
      }
      if (adminResult.error) throw adminResult.error;

      let adminRows = (adminResult.data || []) as AdminRow[];
      const profileEmails = new Set(adminRows.map((row) => cleanEmail(row.email)));
      const recoveredProfiles = authUsers
        .map((user) => fallbackProfileFromAuth(user as unknown as Record<string, any>))
        .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile && !profileEmails.has(profile.email)));

      if (recoveredProfiles.length) {
        const { error } = await adminClient
          .from("crs_admins")
          .upsert(
            recoveredProfiles.map((profile) => ({ ...profile, created_by_email: requesterEmail })),
            { onConflict: "email" }
          );
        if (error) throw error;

        let refreshed = await adminClient
          .from("crs_admins")
          .select("email,username,display_name,role,active")
          .order("email");
        if (refreshed.error && missingColumn(refreshed.error, "username")) {
          refreshed = await adminClient
            .from("crs_admins")
            .select("email,display_name,role,active")
            .order("email");
          if (refreshed.data) refreshed.data = refreshed.data.map((row) => ({ ...row, username: null }));
        }
        if (refreshed.error) throw refreshed.error;
        adminRows = (refreshed.data || []) as AdminRow[];
      }

      for (const row of adminRows) {
        const authUser = byEmail.get(cleanEmail(row.email));
        const rowRole = normalizeRole(row.role);
        if (!authUser || !ALLOWED_ROLES.has(rowRole) || normalizeRole(authUser.app_metadata?.crs_role) === rowRole) continue;
        const { error } = await adminClient.auth.admin.updateUserById(authUser.id, {
          app_metadata: { ...(authUser.app_metadata || {}), crs_role: rowRole },
        });
        if (error) throw error;
      }

      const users = adminRows.map((row) => {
        const authUser = byEmail.get(cleanEmail(row.email));
        const confirmed = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
        return {
          email: row.email,
          username: row.username || "",
          display_name: row.display_name,
          role: row.role,
          active: row.active,
          auth_id: authUser?.id || "",
          auth_state: !authUser ? "missing" : confirmed ? "ok" : "unconfirmed",
          confirmed,
          last_sign_in_at: authUser?.last_sign_in_at || "",
        };
      });
      return json({ ok: true, users, recovered_profiles: recoveredProfiles.length });
    }

    if (action === "upsertUser") {
      const email = cleanEmail(body.email);
      const displayName = cleanText(body.displayName);
      const username = cleanText(body.username).toLowerCase().replace(/\s+/g, "_");
      const role = normalizeRole(body.role || "jefatura");
      const providedPassword = cleanText(body.password);

      if (!email || !email.includes("@")) return json({ ok: false, error: "Falta un correo valido." }, 400);
      if (!displayName) return json({ ok: false, error: "Falta el nombre." }, 400);
      if (!ALLOWED_ROLES.has(role)) return json({ ok: false, error: "Rol no permitido." }, 400);
      if (providedPassword && providedPassword.length < 6) {
        return json({ ok: false, error: "La clave debe tener al menos 6 caracteres." }, 400);
      }

      const authUsers = await listAuthUsers();
      const existing = authUsers.find((user) => cleanEmail(user.email) === email);
      const generatedPassword = existing || providedPassword ? "" : temporaryPassword();
      const password = providedPassword || generatedPassword;
      const userMetadata = {
        ...(existing?.user_metadata || {}),
        full_name: displayName,
        display_name: displayName,
        ...(username ? { username } : {}),
      };
      const appMetadata = {
        ...(existing?.app_metadata || {}),
        crs_role: role,
      };

      if (existing) {
        const update: Record<string, unknown> = {
          email,
          user_metadata: userMetadata,
          app_metadata: appMetadata,
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
          user_metadata: userMetadata,
          app_metadata: appMetadata,
        });
        if (error) throw error;
      }

      const profile: Record<string, unknown> = {
        email,
        display_name: displayName,
        role,
        active: true,
        created_by_email: requesterEmail,
      };
      if (username) profile.username = username;

      let { error: upsertError } = await adminClient
        .from("crs_admins")
        .upsert(profile, { onConflict: "email" });
      if (upsertError && username && missingColumn(upsertError, "username")) {
        delete profile.username;
        ({ error: upsertError } = await adminClient
          .from("crs_admins")
          .upsert(profile, { onConflict: "email" }));
      }
      if (upsertError) throw upsertError;

      return json({ ok: true, temporaryPassword: generatedPassword });
    }

    if (action === "setActive") {
      const email = cleanEmail(body.email);
      const active = body.active === true;
      if (!email) return json({ ok: false, error: "Falta correo." }, 400);
      if (!active && email === requesterEmail) {
        return json({ ok: false, error: "No puedes desactivarte a ti mismo." }, 400);
      }
      if (active) {
        const authUsers = await listAuthUsers();
        const existing = authUsers.find((user) => cleanEmail(user.email) === email);
        if (!existing) return json({ ok: false, error: "Ese perfil no tiene cuenta Auth. Créalo o actualízalo primero." }, 409);
      }
      const { error } = await adminClient.from("crs_admins").update({ active }).eq("email", email);
      if (error) throw error;
      return json({ ok: true, active });
    }

    if (action === "deleteUser") {
      const email = cleanEmail(body.email);
      if (!email) return json({ ok: false, error: "Falta correo." }, 400);
      if (email === requesterEmail) {
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
