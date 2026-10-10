// AI interpretation of an already-computed simulation.
//
// The deterministic engine owns every number. This function receives those
// finished figures as facts and asks the model for judgement only: risks and
// mitigations, feasibility, improvements, and the assumptions behind its own
// reasoning. The model is explicitly forbidden from recalculating or restating
// new numbers, so nothing here can masquerade as a computed value.
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id",
};

const MODEL_ID = "anthropic/claude-sonnet-4.5";
const AI_ENDPOINT = "https://api.enter.pro/code/api/v1/ai/messages";
const PROJECT_ATTRIBUTION = "05ec850cfd0c437693d94e73004f7b5e";

const level = z.enum(["high", "medium", "low"]).catch("medium");

const insightSchema = z.object({
  feasibility: z.object({
    score: z.coerce.number().catch(50).transform((v) => Math.min(100, Math.max(0, Math.round(v)))),
    verdict: z.string().max(120).catch(""),
    summary: z.string().max(1200).catch(""),
  }),
  risks: z
    .array(
      z.object({
        title: z.string().max(160),
        category: z.string().max(60).catch(""),
        likelihood: level,
        impact: level,
        description: z.string().max(800).catch(""),
        mitigation: z.string().max(800).catch(""),
      }),
    )
    .max(10)
    .catch([]),
  improvements: z
    .array(
      z.object({
        title: z.string().max(160),
        description: z.string().max(800).catch(""),
        expectedEffect: z.string().max(400).catch(""),
      }),
    )
    .max(10)
    .catch([]),
  assumptions: z
    .array(
      z.object({
        statement: z.string().max(400),
        impactIfWrong: level,
      }),
    )
    .max(12)
    .catch([]),
  uncertainties: z.array(z.string().max(400)).max(12).catch([]),
});

const extractJson = (text: string): unknown => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The AI response did not contain a JSON object.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
};

const buildPrompt = (payload: Record<string, unknown>, locale: string) => {
  const language = locale.startsWith("ko") ? "Korean" : "English";
  return [
    "You are a management consultant reviewing a business feasibility study.",
    "The financial figures below were computed by a deterministic model. Treat them as given facts.",
    "",
    "Rules:",
    `- Write every string in ${language}.`,
    "- Never invent, recompute or restate financial figures. Refer to the given results qualitatively (for example \"the pessimistic case never recovers its investment\").",
    "- Ground every risk in the supplied project and figures. No boilerplate risk that would apply to any business.",
    "- Each risk needs a concrete mitigation the founder can act on.",
    "- 'feasibility.score' is a 0-100 judgement of execution feasibility given the figures, not a valuation.",
    "- 'assumptions' are the beliefs your own judgement depends on, and 'uncertainties' are what the supplied data cannot tell you. Be explicit about what is missing.",
    "- If the supplied data is too thin to judge a point, say so in 'uncertainties' instead of guessing.",
    "",
    "Answer with a single JSON object and nothing else:",
    '{"feasibility":{"score":0,"verdict":"","summary":""},',
    '"risks":[{"title":"","category":"","likelihood":"high","impact":"high","description":"","mitigation":""}],',
    '"improvements":[{"title":"","description":"","expectedEffect":""}],',
    '"assumptions":[{"statement":"","impactIfWrong":"medium"}],',
    '"uncertainties":[""]}',
    "",
    "Project, inputs and computed results:",
    JSON.stringify(payload),
  ].join("\n");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const token = Deno.env.get("AI_API_TOKEN_05ec850cfd0c");
    if (!token) {
      console.error("simulation-insights: AI token is not configured");
      return json({
        ok: false,
        errorType: "unavailable",
        message: "AI capability is not configured for this project.",
      });
    }

    const body = await req.json();
    const locale: string = typeof body?.locale === "string" ? body.locale : "ko";
    const payload = body?.payload ?? {};
    const sessionId = req.headers.get("X-Session-ID")?.trim() || crypto.randomUUID();

    const upstream = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Session-ID": sessionId,
        "X-Enter-Project-ID": PROJECT_ATTRIBUTION,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: 8192,
        temperature: 0.2,
        stream: false,
        messages: [{ role: "user", content: buildPrompt(payload, locale) }],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      let message = `AI service error (${upstream.status})`;
      let errorType = "error";
      try {
        const parsed = JSON.parse(text);
        message = parsed?.error?.message ?? message;
        errorType = parsed?.error?.type ?? errorType;
      } catch {
        // Non-JSON upstream body — keep the status-derived message.
      }
      console.error("simulation-insights upstream error", upstream.status, message);
      return json({
        ok: false,
        errorType: upstream.status === 402 || upstream.status === 403 ? "unavailable" : errorType,
        message,
      });
    }

    const completion = await upstream.json();
    const text = Array.isArray(completion?.content)
      ? completion.content
          .filter((block: { type?: string }) => block?.type === "text")
          .map((block: { text?: string }) => block.text ?? "")
          .join("")
      : "";

    if (!text.trim()) {
      console.error("simulation-insights: empty completion");
      return json({
        ok: false,
        errorType: "error",
        message: "The AI returned an empty response.",
      });
    }

    const parsed = insightSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      console.error("simulation-insights: shape mismatch", parsed.error.message);
      return json({
        ok: false,
        errorType: "error",
        message: "The AI response did not match the expected analysis format.",
      });
    }

    return json({ ok: true, model: MODEL_ID, insights: parsed.data });
  } catch (error) {
    console.error("simulation-insights failed", error);
    return json({
      ok: false,
      errorType: "error",
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
});
