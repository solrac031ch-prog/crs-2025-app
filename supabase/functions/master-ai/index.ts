import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://solrac031ch-prog.github.io",
  "http://127.0.0.1:4173",
  "http://localhost:4173"
]);
const APP_PUBLISHABLE_KEY = "sb_publishable_sjDVmSUC3o1qtc50_xemoQ_ZZObT1y9";
const MAX_QUESTION = 900;
const MAX_SOURCES = 5;
const MAX_SOURCE_TEXT = 5200;

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

function containsIdentifier(value: string) {
  return [
    /\b\d{1,2}\.?\d{3}\.?\d{3}-[0-9kK]\b/,
    /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
    /\b(?:rut|run|ficha|n[°º]?\s*ficha)\s*[:#-]?\s*[a-z0-9.-]+/i
  ].some((pattern) => pattern.test(value));
}

function isProjectClient(req: Request) {
  return (req.headers.get("apikey") || "") === APP_PUBLISHABLE_KEY;
}

function buildAnswer(sources: MasterSource[]) {
  const source = sources[0];
  if (!source) return "No encuentro respaldo suficiente en MASTER para responder con seguridad.";
  const lines = [`Según MASTER — ${source.title}`];
  if (source.summary) lines.push("", source.summary);
  const textLines = source.text.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 12);
  if (textLines.length) lines.push("", ...textLines);
  lines.push("", `Fuente MASTER: ${source.title}${source.page ? ` · ${source.page}` : ""}`);
  return lines.join("\n");
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
  })).filter((source: MasterSource) => source.title && (source.summary || source.text));

  if (!sources.length) {
    return json({
      configured: false,
      mode: "none",
      answer: "No encuentro respaldo suficiente dentro de las fuentes recuperadas de MASTER para responder esa consulta.",
      sources: []
    }, 200, origin);
  }

  return json({
    configured: false,
    mode: "sources",
    zero_cost: true,
    answer: buildAnswer(sources),
    sources,
    notice: "Compatibilidad local: esta función no llama a OpenAI ni a ningún proveedor de IA de pago."
  }, 200, origin);
});
