// AI scoping questions for a new business project.
//
// The model is asked for follow-up questions tailored to the project type and
// scale. It never produces financial figures — the deterministic engine in
// src/lib/simulation owns all numbers. When the AI call fails, this function
// reports the failure instead of returning invented questions, so the app can
// fall back to its static baseline question set and say so.
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id",
};

const MODEL_ID = "anthropic/claude-sonnet-4.5";
const AI_ENDPOINT = "https://api.enter.pro/code/api/v1/ai/messages";
const PROJECT_ATTRIBUTION = "05ec850cfd0c437693d94e73004f7b5e";

/** Slots the deterministic engine can consume directly. */
const ENGINE_SLOTS = [
  "pricePerUnit",
  "monthlyUnits",
  "monthlyGrowthPct",
  "unitCost",
  "initialInvestmentTotal",
  "monthlyFixedCost",
  "headcount",
  "averageSalary",
  "marketingMonthly",
  "equityAmount",
  "debtAmount",
  "debtRatePct",
  "graceMonths",
  "taxRatePct",
  "discountRatePct",
  "overheadPct",
  "workingCapitalMonths",
  "horizonMonths",
];

const questionSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(60)
    .transform((value) => value.replace(/[^a-zA-Z0-9_]/g, "_")),
  label: z.string().min(1).max(200),
  help: z.string().max(300).default(""),
  inputType: z
    .enum(["number", "currency", "percent", "text", "select", "list"])
    .catch("number"),
  unit: z.string().max(24).default(""),
  options: z.array(z.string().max(80)).max(12).default([]),
  required: z.boolean().default(false),
  mapsTo: z.string().max(60).default(""),
});

const responseSchema = z.object({
  questions: z.array(questionSchema).min(1).max(12),
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
    "You are a business feasibility analyst preparing an intake form.",
    "Given the project idea and the applicant profile, list the additional questions an analyst must ask before modelling costs, revenue and cash flow.",
    "",
    "Rules:",
    `- Write every label and help text in ${language}.`,
    "- Ask between 4 and 10 questions. Prefer the questions that most change the financial outcome.",
    "- Tailor the questions to the sector, business model, company size and stage. Do not ask generic questions that are already answered below.",
    "- Ask for figures in the project's currency. Ask for ranges only when a single number is genuinely unavailable.",
    `- When a question maps to one of these engine slots, put that slot key in "mapsTo": ${ENGINE_SLOTS.join(", ")}.`,
    '- "mapsTo" is an empty string for a question that is context only.',
    '- "inputType" is one of: number, currency, percent, text, select, list. Use "select" only with an "options" array.',
    "- Never propose a financial result, projection, margin or valuation. You are only collecting inputs.",
    "",
    "Answer with a single JSON object and nothing else:",
    '{"questions":[{"key":"unit_price","label":"...","help":"...","inputType":"currency","unit":"KRW","options":[],"required":true,"mapsTo":"pricePerUnit"}]}',
    "",
    "Project and applicant:",
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
      console.error("project-scoping: AI token is not configured");
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
        max_tokens: 4096,
        temperature: 0.3,
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
      console.error("project-scoping upstream error", upstream.status, message);
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
      console.error("project-scoping: empty completion");
      return json({
        ok: false,
        errorType: "error",
        message: "The AI returned an empty response.",
      });
    }

    const parsed = responseSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      console.error("project-scoping: shape mismatch", parsed.error.message);
      return json({
        ok: false,
        errorType: "error",
        message: "The AI response did not match the expected question format.",
      });
    }

    const questions = parsed.data.questions
      .filter((question) => question.inputType !== "select" || question.options.length > 0)
      .map((question, index) => ({
        ...question,
        mapsTo: ENGINE_SLOTS.includes(question.mapsTo) ? question.mapsTo : "",
        sortOrder: index,
      }));

    if (questions.length === 0) {
      return json({
        ok: false,
        errorType: "error",
        message: "The AI did not produce usable questions.",
      });
    }

    return json({ ok: true, model: MODEL_ID, questions });
  } catch (error) {
    console.error("project-scoping failed", error);
    return json({
      ok: false,
      errorType: "error",
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
});
