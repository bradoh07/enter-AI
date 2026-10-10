import { computeScenario } from "./engine";
import { DEFAULT_SCENARIO_ADJUSTMENTS } from "./defaults";
import type { ScenarioAdjustment, ScenarioKey, SimulationInput } from "./types";

export type SensitivityCell = {
  revenueDeltaPct: number;
  costDeltaPct: number;
  horizonNetProfit: number;
  operatingMarginPct: number;
  paybackMonths: number | null;
  roiPct: number;
};

export const SENSITIVITY_DELTAS = [-20, -10, 0, 10, 20];

/**
 * Re-runs the engine for every revenue/cost combination. This is real
 * computation, not an AI estimate — the grid is deterministic and reproducible.
 */
export const computeSensitivity = (
  input: SimulationInput,
  adjustments: Record<ScenarioKey, ScenarioAdjustment>,
  scenarioKey: ScenarioKey = "base",
): SensitivityCell[] => {
  const baseAdjustment = adjustments[scenarioKey] ?? DEFAULT_SCENARIO_ADJUSTMENTS[scenarioKey];
  const cells: SensitivityCell[] = [];

  SENSITIVITY_DELTAS.forEach((revenueDeltaPct) => {
    SENSITIVITY_DELTAS.forEach((costDeltaPct) => {
      const adjustment: ScenarioAdjustment = {
        ...baseAdjustment,
        revenueMultiplier: baseAdjustment.revenueMultiplier * (1 + revenueDeltaPct / 100),
        unitCostMultiplier: baseAdjustment.unitCostMultiplier * (1 + costDeltaPct / 100),
        fixedCostMultiplier: baseAdjustment.fixedCostMultiplier * (1 + costDeltaPct / 100),
      };
      const { kpis } = computeScenario(input, scenarioKey, adjustment);
      cells.push({
        revenueDeltaPct,
        costDeltaPct,
        horizonNetProfit: kpis.horizonNetProfit,
        operatingMarginPct: kpis.operatingMarginPct,
        paybackMonths: kpis.paybackMonths,
        roiPct: kpis.roiPct,
      });
    });
  });

  return cells;
};
