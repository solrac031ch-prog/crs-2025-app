import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://solrac031ch-prog.github.io",
  "http://127.0.0.1:4173",
  "http://localhost:4173"
]);

const MAX_QUESTION = 900;
const MAX_SOURCES = 5;
const MAX_SOURCE_TEXT = 4200;
const DEFAULT_MODEL = "gpt-5.6-sol";

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

function containsIdentifier(value: string) {
  return [
    /\b\d{1,2}\.?\d{3}\.?\d{3}-[0-9kK]\b/,
    /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
    /\b(?:rut|run|ficha|n[°º]?\s*ficha)\s*[:#-]?\s*[a-z0-9.-]+/i
  ].some((pattern) => pattern.test(value));
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

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origen no autorizado." }, 403, origin);

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
    console.error("OpenAI network error", error);
    return json({ error: "No fue posible contactar el servicio de IA." }, 502, origin);
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    console.error("OpenAI API error", response.status, payload);
    return json({ error: "El servicio de IA no pudo completar la consulta." }, 502, origin);
  }

  const answer = extractOutputText(payload);
  if (!answer) return json({ error: "La IA no devolvió una respuesta utilizable." }, 502, origin);

  return json({
    configured: true,
    answer,
    sources,
    model
  }, 200, origin);
});
