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
const STOP_WORDS = new Set([
  "como", "cual", "cuales", "donde", "cuando", "para", "por", "que", "del", "las", "los", "una", "uno", "unos", "unas",
  "con", "sin", "sobre", "desde", "hasta", "este", "esta", "estos", "estas", "hay", "hago", "hacer", "activo", "activar"
]);

type MasterSource = {
  title: string;
  category: string;
  page: string;
  summary: string;
  text: string;
};

function corsHeaders(origin: string | null) {
  const safeOrigin = origin && allowedOrigins.has(origin) ? origin : "https://solrac031ch-prog.github.io";
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
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

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function meaningfulTerms(value: string) {
  return [...new Set(normalize(value).split(" ").filter((term) => term.length > 2 && !STOP_WORDS.has(term)))];
}

function sourceSegments(source: MasterSource) {
  const combined = [source.summary, source.text].filter(Boolean).join("\n");
  const rough = combined
    .replace(/\r/g, "\n")
    .split(/\n+|(?<=[.!?;:])\s+/)
    .map((part) => clean(part.replace(/^[-•]\s*/, ""), 520))
    .filter((part) => part.length >= 12);

  const seen = new Set<string>();
  return rough.filter((part) => {
    const key = normalize(part);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSourceOnlyAnswer(question: string, sources: MasterSource[]) {
  const terms = meaningfulTerms(question);
  const candidates: Array<{ text: string; title: string; score: number; sourceIndex: number; order: number }> = [];

  sources.forEach((source, sourceIndex) => {
    const titleNorm = normalize(source.title);
    const titleHits = terms.reduce((count, term) => count + (titleNorm.includes(term) ? 1 : 0), 0);
    sourceSegments(source).forEach((text, order) => {
      const normalized = normalize(text);
      const hits = terms.reduce((count, term) => count + (normalized.includes(term) ? 1 : 0), 0);
      candidates.push({
        text,
        title: source.title,
        score: (titleHits * 5) + (hits * 10) + Math.max(0, 4 - order),
        sourceIndex,
        order
      });
    });
  });

  candidates.sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex || a.order - b.order);
  const selected: typeof candidates = [];
  const seen = new Set<string>();
  const perSource = new Map<number, number>();

  for (const item of candidates) {
    const key = normalize(item.text);
    if (!key || seen.has(key)) continue;
    const sourceCount = perSource.get(item.sourceIndex) || 0;
    if (sourceCount >= 3) continue;
    if (selected.length && item.score <= 0) continue;
    selected.push(item);
    seen.add(key);
    perSource.set(item.sourceIndex, sourceCount + 1);
    if (selected.length >= 5) break;
  }

  if (!selected.length) {
    for (let sourceIndex = 0; sourceIndex < sources.length && selected.length < 3; sourceIndex += 1) {
      const source = sources[sourceIndex];
      const first = sourceSegments(source)[0];
      if (first) selected.push({ text: first, title: source.title, score: 0, sourceIndex, order: 0 });
    }
  }

  if (!selected.length) {
    return `No encuentro respaldo suficiente en MASTER para responder con seguridad.\n\nFuente MASTER: ${sources.map((source) => source.title).join("; ")}`;
  }

  const titles = [...new Set(selected.map((item) => item.title))];
  const body = selected.map((item, index) => `${index + 1}. ${item.text}`).join("\n");
  return `Respuesta extractiva basada solo en las fuentes recuperadas de MASTER:\n${body}\n\nFuente MASTER: ${titles.join("; ")}`;
}

function sourceModeResponse(question: string, sources: MasterSource[], configured: boolean, notice: string, remaining?: number) {
  return {
    configured,
    mode: "sources",
    answer: buildSourceOnlyAnswer(question, sources),
    sources,
    notice,
    ...(typeof remaining === "number" ? { remaining } : {})
  };
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
  const sources: MasterSource[] = incoming.map((source: any) => ({
    title: clean(source?.title, 160),
    category: clean(source?.category, 80),
    page: clean(source?.page, 40),
    summary: clean(source?.summary, 700),
    text: clean(source?.text, MAX_SOURCE_TEXT)
  })).filter((source: MasterSource) => source.title && (source.text || source.summary));

  if (!sources.length) {
    return json({
      configured: Boolean(Deno.env.get("OPENAI_API_KEY")),
      mode: "none",
      answer: "No encuentro respaldo suficiente dentro de las fuentes recuperadas de MASTER para responder esa consulta.",
      sources: []
    }, 200, origin);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!apiKey) {
    return json(sourceModeResponse(
      question,
      sources,
      false,
      "La redacción generativa no está configurada; se muestra únicamente contenido extraído de MASTER."
    ), 200, origin);
  }
  if (!looksLikeOpenAIKey(apiKey)) {
    return json(sourceModeResponse(
      question,
      sources,
      false,
      "La redacción generativa no está disponible por una configuración del servidor; se muestra únicamente contenido extraído de MASTER."
    ), 200, origin);
  }

  const quota = await takeQuota(req);
  if (!quota.ok) {
    return json(sourceModeResponse(
      question,
      sources,
      true,
      "La redacción generativa alcanzó su límite temporal; se muestra únicamente contenido extraído de MASTER.",
      quota.remaining
    ), 200, origin);
  }

  const sourceBlock = sources.map((source, index) => [
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
      }),
      signal: AbortSignal.timeout(18000)
    });
  } catch (error) {
    console.error("OpenAI network error", error instanceof Error ? error.name : "error");
    return json(sourceModeResponse(
      question,
      sources,
      true,
      "La redacción generativa no respondió a tiempo; se muestra únicamente contenido extraído de MASTER.",
      quota.remaining
    ), 200, origin);
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
    return json(sourceModeResponse(
      question,
      sources,
      true,
      "La redacción generativa está temporalmente no disponible; se muestra únicamente contenido extraído de MASTER.",
      quota.remaining
    ), 200, origin);
  }

  const answer = extractOutputText(payload);
  if (!answer) {
    return json(sourceModeResponse(
      question,
      sources,
      true,
      "La redacción generativa no devolvió una respuesta utilizable; se muestra únicamente contenido extraído de MASTER.",
      quota.remaining
    ), 200, origin);
  }

  return json({
    configured: true,
    mode: "generative",
    answer,
    sources,
    model,
    remaining: quota.remaining
  }, 200, origin);
});
