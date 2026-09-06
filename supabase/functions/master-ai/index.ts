import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://solrac031ch-prog.github.io",
  "http://127.0.0.1:4173",
  "http://localhost:4173"
]);

// La publishable key de Supabase es pública por diseño y ya forma parte de la
// configuración del cliente web. Se valida aquí para impedir que clientes de
// otros proyectos invoquen esta función por accidente. Nunca usar aquí una
// service-role/secret key.
const APP_PUBLISHABLE_KEY = "sb_publishable_sjDVmSUC3o1qtc50_xemoQ_ZZObT1y9";
const MAX_QUESTION = 900;
const MAX_SOURCES = 5;
const MAX_SOURCE_TEXT = 4200;
const DEFAULT_MODEL = "gpt-5.4-mini";
const DAILY_LIMIT = 250;

function corsHeaders(origin: string | null) {
  const safeOrigin = origin && allowedOrigins.has(origin) ? origin : "https://solrac031ch-prog.github.io";
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max);
}

function envKeys(name: string) {
  const raw = Deno.env.get(name) || "";
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string" && Boolean(value));
    }
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).filter((value): value is string => typeof value === "string" && Boolean(value));
    }
    if (typeof parsed === "string" && parsed) return [parsed];
  } catch {
    // Algunas versiones del runtime exponen una sola clave como texto plano.
  }
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function bearer(req: Request) {
  const value = req.headers.get("authorization") || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function isProjectClient(req: Request) {
  const apikey = req.headers.get("apikey") || "";
  const token = bearer(req);

  // El SDK moderno de Supabase envía la publishable key en `apikey`. Puede
  // enviar además un JWT de usuario en Authorization, por eso `apikey` es el
  // identificador estable del proyecto para esta comprobación.
  if (apikey === APP_PUBLISHABLE_KEY) return true;

  const allowed = new Set(envKeys("SUPABASE_PUBLISHABLE_KEYS"));
  const legacy = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (legacy) allowed.add(legacy);
  return allowed.has(apikey) || allowed.has(token);
}

function serverSecret() {
  const modern = envKeys("SUPABASE_SECRET_KEYS")[0];
  return modern || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

function containsIdentifier(value: string) {
  return [
    /\b\d{1,2}\.?\d{3}\.?\d{3}-[0-9kK]\b/,
    /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
    /\b(?:rut|run|ficha|n[°º]?\s*ficha)\s*[:#-]?\s*[a-z0-9.-]+/i
  ].some((pattern) => pattern.test(value));
}

function looksLikeOpenAIKey(value: string) {
  return /^sk-(?:proj-)?[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const chunks: string[] = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request) {
  const forwarded = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

async function takeQuota(req: Request) {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const secret = serverSecret();
  if (!url || !secret) return { ok: false, remaining: 0 };

  const clientHash = await sha256(`${clientIp(req)}|${secret.slice(-24)}`);
  const headers: Record<string, string> = {
    "apikey": secret,
    "Content-Type": "application/json"
  };
  if (!secret.startsWith("sb_secret_")) headers.Authorization = `Bearer ${secret}`;

  try {
    const response = await fetch(`${url}/rest/v1/rpc/crs_take_ai_quota`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_client_hash: clientHash, p_limit: DAILY_LIMIT })
    });
    if (!response.ok) {
      console.error("MASTER IA quota RPC", response.status);
      return { ok: false, remaining: 0 };
    }
    const data = await response.json();
    const row = Array.isArray(data) ? data[0] : data;
    return { ok: Boolean(row?.allowed), remaining: Number(row?.remaining || 0) };
  } catch (error) {
    console.error("MASTER IA quota error", error instanceof Error ? error.name : "error");
    return { ok: false, remaining: 0 };
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origen no autorizado." }, 403, origin);
  if (!isProjectClient(req)) return json({ error: "Cliente no autorizado." }, 401, origin);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400, origin);
  }

  const question = clean(body?.question, MAX_QUESTION + 1);
  if (question.length < 3 || question.length > MAX_QUESTION) {
    return json({ error: `La consulta debe tener entre 3 y ${MAX_QUESTION} caracteres.` }, 400, origin);
  }
  if (containsIdentifier(question)) {
    return json({ error: "Retira datos identificatorios del paciente antes de consultar." }, 400, origin);
  }

  const incoming = Array.isArray(body?.sources) ? body.sources.slice(0, MAX_SOURCES) : [];
  const sources = incoming.map((source: any) => ({
    title: clean(source?.title, 160),
    category: clean(source?.category, 80),
    page: clean(source?.page, 40),
    summary: clean(source?.summary, 700),
    text: clean(source?.text, MAX_SOURCE_TEXT)
  })).filter((source: any) => source.title && (source.text || source.summary));

  if (!sources.length) {
    return json({
      configured: Boolean(Deno.env.get("OPENAI_API_KEY")),
      answer: "No encuentro respaldo suficiente dentro de las fuentes recuperadas de MASTER para responder esa consulta.",
      sources: []
    }, 200, origin);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!apiKey) {
    return json({
      configured: false,
      answer: "Encontré fuentes pertinentes dentro de MASTER. La recuperación documental ya está funcionando; falta activar la credencial de IA en el servidor para redactar la respuesta.",
      sources
    }, 200, origin);
  }
  if (!looksLikeOpenAIKey(apiKey)) {
    return json({
      configured: false,
      error: "La credencial configurada en OPENAI_API_KEY no tiene formato de API key de OpenAI."
    }, 503, origin);
  }

  const quota = await takeQuota(req);
  if (!quota.ok) {
    return json({ error: "MASTER IA alcanzó su límite temporal de consultas o no pudo validar la cuota. Intenta más tarde." }, 429, origin);
  }

  const sourceBlock = sources.map((source: any, index: number) => [
    `FUENTE ${index + 1}: ${source.title}`,
    source.category ? `Categoría: ${source.category}` : "",
    source.page ? `Referencia: ${source.page}` : "",
    source.summary ? `Resumen: ${source.summary}` : "",
    source.text
  ].filter(Boolean).join("\n")).join("\n\n---\n\n");

  const developerPrompt = `Eres MASTER IA, un asistente institucional para Urgencia Adulto HPH.\n\nREGLAS OBLIGATORIAS:\n1. Responde ÚNICAMENTE usando el material de FUENTES incluido en la consulta.\n2. No completes información por conocimiento general, memoria, internet ni suposiciones.\n3. Si las fuentes no bastan, responde exactamente: \"No encuentro respaldo suficiente en MASTER para responder con seguridad.\" y explica brevemente qué falta verificar.\n4. No inventes nombres de médicos, teléfonos, anexos, dosis, horarios, criterios, formularios ni destinos de derivación.\n5. Conserva la terminología institucional de las fuentes.\n6. Si hay conflicto entre fuentes, indícalo y pide verificar el documento vigente.\n7. No solicites ni repitas datos identificatorios de pacientes.\n8. Responde en español, de manera breve, práctica y orientada al turno. Usa pasos numerados solo si ayudan.\n9. Termina con una línea: \"Fuente MASTER: ...\" usando uno o más títulos de las fuentes realmente utilizadas.\n10. No presentes la respuesta como sustituto del juicio clínico.`;

  const userPrompt = `PREGUNTA:\n${question}\n\nFUENTES RECUPERADAS DE MASTER:\n${sourceBlock}`;
  const model = Deno.env.get("OPENAI_MODEL") || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 700,
        input: [
          { role: "developer", content: [{ type: "input_text", text: developerPrompt }] },
          { role: "user", content: [{ type: "input_text", text: userPrompt }] }
        ]
      })
    });
  } catch (error) {
    console.error("OpenAI network error", error instanceof Error ? error.name : "error");
    return json({ error: "No fue posible contactar el servicio de IA." }, 502, origin);
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const upstreamType = clean(payload?.error?.type, 80) || "unknown";
    const upstreamCode = clean(payload?.error?.code, 80) || "unknown";
    console.error("OpenAI API error", response.status, upstreamType, upstreamCode);
    return json({
      error: "El servicio de IA no pudo completar la consulta.",
      diagnostic: {
        status: response.status,
        type: upstreamType,
        code: upstreamCode
      }
    }, 502, origin);
  }

  const answer = extractOutputText(payload);
  if (!answer) return json({ error: "La IA no devolvió una respuesta utilizable." }, 502, origin);

  return json({
    configured: true,
    answer,
    sources,
    model,
    remaining: quota.remaining
  }, 200, origin);
});
