import { DEFAULT_SCENARIO_ADJUSTMENTS } from "./defaults";
import { safeNumber } from "./math";
import type {
  AssumptionNote,
  ScenarioAdjustment,
  ScenarioKey,
  SimulationInput,
} from "./types";

/**
 * Assumption and data-quality notes derived purely from the stored input.
 *
 * The engine never invents market research: every note traces back to a value
 * the user entered or to a modelling convention this engine applies. Notes
 * carry i18n keys, not display text, so they render in the active language.
 */
export const buildEngineAssumptions = (
  input: SimulationInput,
  adjustments: Record<ScenarioKey, ScenarioAdjustment>,
  unknownFields: string[] = [],
): AssumptionNote[] => {
  const notes: AssumptionNote[] = [];

  notes.push({
    id: "engine.horizon",
    labelKey: "assumptions.engine.horizon",
    params: { months: input.horizonMonths },
    source: "engine",
    impact: "medium",
  });

  const growthStreams = input.revenueStreams.filter(
    (stream) => safeNumber(stream.monthlyGrowthPct) !== 0,
  );
  if (growthStreams.length > 0) {
    notes.push({
      id: "engine.growth",
      labelKey: "assumptions.engine.growth",
      params: { rate: safeNumber(growthStreams[0].monthlyGrowthPct) },
      source: "engine",
      impact: "high",
    });
  }

  const earliestStart = input.revenueStreams.length
    ? Math.min(...input.revenueStreams.map((stream) => safeNumber(stream.startMonth, 1)))
    : 1;
  notes.push({
    id: "engine.ramp",
    labelKey: "assumptions.engine.ramp",
    params: { month: earliestStart },
    source: "engine",
    impact: "medium",
  });

  notes.push({
    id: "engine.payrollFixed",
    labelKey: "assumptions.engine.payrollFixed",
    source: "engine",
    impact: "medium",
  });

  notes.push({
    id: "engine.fixedCostScenario",
    labelKey: "assumptions.engine.fixedCostScenario",
    params: {
      multiplier: adjustments.pessimistic.fixedCostMultiplier,
    },
    source: "engine",
    impact: "low",
  });

  notes.push({
    id: "engine.tax",
    labelKey: "assumptions.engine.tax",
    params: { rate: input.taxRatePct },
    source: "engine",
    impact: "medium",
  });

  notes.push({
    id: "engine.discount",
    labelKey: "assumptions.engine.discount",
    params: { rate: input.discountRatePct },
    source: "engine",
    impact: "medium",
  });

  notes.push({
    id: "engine.workingCapital",
    labelKey: "assumptions.engine.workingCapital",
    params: { months: input.workingCapitalMonths },
    source: "engine",
    impact: safeNumber(input.workingCapitalMonths) > 0 ? "high" : "low",
  });

  notes.push({
    id: "engine.cashTiming",
    labelKey: "assumptions.engine.cashTiming",
    source: "engine",
    impact: "medium",
  });

  notes.push({
    id: "engine.noInflation",
    labelKey: "assumptions.engine.noInflation",
    source: "engine",
    impact: "medium",
  });

  const debt = input.funding.filter((source) => source.source === "debt");
  if (debt.length > 0) {
    notes.push({
      id: "engine.debt",
      labelKey: "assumptions.engine.debt",
      params: {
        rate: safeNumber(debt[0].rateAnnual),
        grace: safeNumber(debt[0].graceMonths),
      },
      source: "engine",
      impact: "high",
    });
  }

  notes.push({
    id: "engine.scenarioSpread",
    labelKey: "assumptions.engine.scenarioSpread",
    params: {
      optimistic: Math.round(
        (DEFAULT_SCENARIO_ADJUSTMENTS.optimistic.revenueMultiplier - 1) * 100,
      ),
      pessimistic: Math.round(
        (1 - DEFAULT_SCENARIO_ADJUSTMENTS.pessimistic.revenueMultiplier) * 100,
      ),
    },
    source: "user",
    impact: "high",
  });

  notes.push({
    id: "engine.aiNotApplied",
    labelKey: "assumptions.engine.aiNotApplied",
    source: "engine",
    impact: "medium",
  });

  unknownFields.forEach((field) => {
    notes.push({
      id: `unknown.${field}`,
      labelKey: "assumptions.unknownField",
      // The raw slot key: the panel resolves it to a label via intakeFieldLabel.
      params: { field },
      source: "user",
      impact: "high",
    });
  });

  return notes;
};
