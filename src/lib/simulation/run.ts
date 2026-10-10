import type { AssumptionNote, SimulationResult } from "@/lib/simulation/types";
import type { AiInsights } from "@/lib/ai/types";

/**
 * Guards for JSON read back out of `simulation_runs`. A stored run is only
 * trusted when its shape still matches the engine's contract; otherwise the
 * caller recomputes from the input snapshot rather than rendering garbage.
 */
export const parseSimulationResult = (value: unknown): SimulationResult | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SimulationResult>;
  const scenarios = candidate.scenarios;
  if (!scenarios || typeof scenarios !== "object") return null;

  const keys: Array<keyof SimulationResult["scenarios"]> = ["optimistic", "base", "pessimistic"];
  const complete = keys.every((key) => {
    const scenario = scenarios[key];
    return Boolean(scenario && Array.isArray(scenario.monthly) && scenario.kpis);
  });
  if (!complete) return null;

  return candidate as SimulationResult;
};

export const parseAssumptions = (value: unknown): AssumptionNote[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is AssumptionNote =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as AssumptionNote).id === "string" &&
      typeof (entry as AssumptionNote).labelKey === "string",
  );
};

export const parseAiInsights = (value: unknown): AiInsights | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AiInsights>;
  if (!candidate.feasibility || !Array.isArray(candidate.risks)) return null;
  return {
    feasibility: {
      score: Number(candidate.feasibility.score) || 0,
      verdict: candidate.feasibility.verdict ?? "",
      summary: candidate.feasibility.summary ?? "",
    },
    risks: candidate.risks,
    improvements: Array.isArray(candidate.improvements) ? candidate.improvements : [],
    assumptions: Array.isArray(candidate.assumptions) ? candidate.assumptions : [],
    uncertainties: Array.isArray(candidate.uncertainties) ? candidate.uncertainties : [],
  };
};
