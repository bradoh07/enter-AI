import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { AiInsights, InsightsResult, ScopingResult } from "./types";

const levelSchema = z.enum(["high", "medium", "low"]).catch("medium");

const questionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  help: z.string().catch(""),
  inputType: z
    .enum(["number", "currency", "percent", "text", "select", "list"])
    .catch("number"),
  unit: z.string().catch(""),
  options: z.array(z.string()).catch([]),
  required: z.boolean().catch(false),
  mapsTo: z.string().catch(""),
  sortOrder: z.number().catch(0),
});

const scopingEnvelopeSchema = z.object({
  ok: z.boolean(),
  errorType: z.string().optional(),
  message: z.string().optional(),
  model: z.string().optional(),
  questions: z.array(questionSchema).optional(),
});

const insightsEnvelopeSchema = z.object({
  ok: z.boolean(),
  errorType: z.string().optional(),
  message: z.string().optional(),
  model: z.string().optional(),
  insights: z
    .object({
      feasibility: z.object({
        score: z.coerce.number().catch(50),
        verdict: z.string().catch(""),
        summary: z.string().catch(""),
      }),
      risks: z
        .array(
          z.object({
            title: z.string(),
            category: z.string().catch(""),
            likelihood: levelSchema,
            impact: levelSchema,
            description: z.string().catch(""),
            mitigation: z.string().catch(""),
          }),
        )
        .catch([]),
      improvements: z
        .array(
          z.object({
            title: z.string(),
            description: z.string().catch(""),
            expectedEffect: z.string().catch(""),
          }),
        )
        .catch([]),
      assumptions: z
        .array(
          z.object({
            statement: z.string(),
            impactIfWrong: levelSchema,
          }),
        )
        .catch([]),
      uncertainties: z.array(z.string()).catch([]),
    })
    .optional(),
});

type InvokeOutcome =
  | { kind: "data"; data: unknown }
  | { kind: "failure"; status: "unavailable" | "error"; message: string };

const extractFailureMessage = async (
  error: unknown,
  fallback: string,
): Promise<{ message: string; unavailable: boolean }> => {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const parsed = (await context.json()) as {
        message?: string;
        error?: { message?: string; type?: string } | string;
      };
      const message =
        parsed?.message ??
        (typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message);
      const type =
        typeof parsed?.error === "object" && parsed?.error ? parsed.error.type : undefined;
      return {
        message: message ?? fallback,
        unavailable: context.status === 402 || context.status === 403 || type === "unavailable",
      };
    } catch {
      return { message: fallback, unavailable: context.status === 402 || context.status === 403 };
    }
  }
  return { message: fallback, unavailable: false };
};

const invokeAiFunction = async (
  name: "project-scoping" | "simulation-insights",
  payload: unknown,
  locale: string,
  sessionId: string,
): Promise<InvokeOutcome> => {
  const { data, error } = await supabase.functions.invoke(name, {
    body: { payload, locale },
    headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
  });

  if (error) {
    const { message, unavailable } = await extractFailureMessage(
      error,
      error instanceof Error ? error.message : "AI request failed",
    );
    return { kind: "failure", status: unavailable ? "unavailable" : "error", message };
  }

  return { kind: "data", data };
};

export const requestScopingQuestions = async (
  payload: unknown,
  locale: string,
  sessionId: string,
): Promise<ScopingResult> => {
  const outcome = await invokeAiFunction("project-scoping", payload, locale, sessionId);

  if (outcome.kind === "failure") {
    return { status: outcome.status, message: outcome.message };
  }

  const parsed = scopingEnvelopeSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { status: "error", message: "Unexpected AI response format." };
  }
  if (!parsed.data.ok) {
    return {
      status: parsed.data.errorType === "unavailable" ? "unavailable" : "error",
      message: parsed.data.message ?? "The AI could not generate questions.",
    };
  }
  if (!parsed.data.questions || parsed.data.questions.length === 0) {
    return { status: "error", message: "The AI returned no questions." };
  }

  return {
    status: "ok",
    model: parsed.data.model ?? "",
    questions: parsed.data.questions
      .map((question, index) => ({
        key: question.key,
        label: question.label,
        help: question.help ?? "",
        inputType: question.inputType ?? "number",
        unit: question.unit ?? "",
        options: question.options ?? [],
        required: question.required ?? false,
        mapsTo: question.mapsTo ?? "",
        sortOrder: index,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
};

export const requestSimulationInsights = async (
  payload: unknown,
  locale: string,
  sessionId: string,
): Promise<InsightsResult> => {
  const outcome = await invokeAiFunction("simulation-insights", payload, locale, sessionId);

  if (outcome.kind === "failure") {
    return { status: outcome.status, message: outcome.message };
  }

  const parsed = insightsEnvelopeSchema.safeParse(outcome.data);
  if (!parsed.success) {
    return { status: "error", message: "Unexpected AI response format." };
  }
  if (!parsed.data.ok || !parsed.data.insights) {
    return {
      status: parsed.data.errorType === "unavailable" ? "unavailable" : "error",
      message: parsed.data.message ?? "The AI could not analyse this simulation.",
    };
  }

  const raw = parsed.data.insights;
  const insights: AiInsights = {
    feasibility: {
      score: Math.min(100, Math.max(0, Math.round(raw.feasibility.score))),
      verdict: raw.feasibility.verdict,
      summary: raw.feasibility.summary,
    },
    risks: raw.risks.map((risk) => ({
      title: risk.title,
      category: risk.category ?? "",
      likelihood: risk.likelihood ?? "medium",
      impact: risk.impact ?? "medium",
      description: risk.description ?? "",
      mitigation: risk.mitigation ?? "",
    })),
    improvements: raw.improvements.map((improvement) => ({
      title: improvement.title,
      description: improvement.description ?? "",
      expectedEffect: improvement.expectedEffect ?? "",
    })),
    assumptions: raw.assumptions.map((assumption) => ({
      statement: assumption.statement,
      impactIfWrong: assumption.impactIfWrong ?? "medium",
    })),
    uncertainties: raw.uncertainties,
  };

  return { status: "ok", model: parsed.data.model ?? "", insights };
};
