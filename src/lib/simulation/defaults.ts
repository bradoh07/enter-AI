import { SCENARIO_KEYS } from "./types";
import type { CurrencyCode, ScenarioAdjustment, ScenarioKey, SimulationInput } from "./types";

export const ENGINE_VERSION = "1.0.0";

/**
 * Scenario presets. These are the AI-free starting points a user can then edit;
 * edited values are persisted on the project row (`scenario_overrides`).
 */
export const DEFAULT_SCENARIO_ADJUSTMENTS: Record<ScenarioKey, ScenarioAdjustment> = {
  optimistic: {
    revenueMultiplier: 1.2,
    unitCostMultiplier: 0.95,
    fixedCostMultiplier: 1,
    rampOffsetMonths: -2,
  },
  base: {
    revenueMultiplier: 1,
    unitCostMultiplier: 1,
    fixedCostMultiplier: 1,
    rampOffsetMonths: 0,
  },
  pessimistic: {
    revenueMultiplier: 0.72,
    unitCostMultiplier: 1.12,
    fixedCostMultiplier: 1.05,
    rampOffsetMonths: 4,
  },
};

export const createEmptyInput = (
  currency: CurrencyCode = "KRW",
  horizonMonths = 36,
): SimulationInput => ({
  currency,
  horizonMonths,
  initialInvestment: [],
  funding: [],
  revenueStreams: [],
  fixedCosts: [],
  payroll: [],
  marketingMonthly: 0,
  overheadPct: 3,
  taxRatePct: 10,
  discountRatePct: 8,
  workingCapitalMonths: 0,
});

/** Assumption fields a user can set once and reuse for every new project. */
export const PROFILE_ASSUMPTION_KEYS = [
  "taxRatePct",
  "discountRatePct",
  "workingCapitalMonths",
  "overheadPct",
] as const;

export type ProfileAssumptionKey = (typeof PROFILE_ASSUMPTION_KEYS)[number];

export const DEFAULT_PROFILE_ASSUMPTIONS: Record<ProfileAssumptionKey, number> = {
  taxRatePct: 10,
  discountRatePct: 8,
  workingCapitalMonths: 1,
  overheadPct: 3,
};

/** Overlays the profile's saved defaults onto a fresh project input. */
export const applyProfileAssumptions = (
  input: SimulationInput,
  assumptions: unknown,
): SimulationInput => {
  const source = (assumptions ?? {}) as Partial<Record<ProfileAssumptionKey, unknown>>;
  const next = { ...input };

  PROFILE_ASSUMPTION_KEYS.forEach((key) => {
    const value = Number(source[key]);
    if (Number.isFinite(value)) next[key] = value;
  });

  return next;
};

/**
 * Merges stored per-project scenario overrides over the defaults. A partially
 * written or legacy override object therefore still yields a complete, usable
 * set of multipliers.
 */
export const resolveScenarioAdjustments = (
  overrides: unknown,
): Record<ScenarioKey, ScenarioAdjustment> => {
  const source = (overrides ?? {}) as Partial<
    Record<ScenarioKey, Partial<ScenarioAdjustment>>
  >;

  return SCENARIO_KEYS.reduce(
    (accumulator, key) => {
      accumulator[key] = { ...DEFAULT_SCENARIO_ADJUSTMENTS[key], ...(source[key] ?? {}) };
      return accumulator;
    },
    {} as Record<ScenarioKey, ScenarioAdjustment>,
  );
};

/**
 * A neutral starting template for the intake form. It is intentionally labelled
 * as a starting point in the UI: every figure is an editable placeholder, not a
 * researched market value. Row names start empty so nothing reads as a real
 * assumption the user did not make.
 */
export const createStartingInput = (
  currency: CurrencyCode = "KRW",
  horizonMonths = 36,
): SimulationInput => ({
  currency,
  horizonMonths,
  initialInvestment: [{ item: "", amount: 0 }],
  funding: [{ source: "self", amount: 0, rateAnnual: 0, graceMonths: 0, startMonth: 1 }],
  revenueStreams: [
    {
      name: "",
      unitPrice: 0,
      unitCost: 0,
      monthlyUnits: 0,
      monthlyGrowthPct: 3,
      startMonth: 3,
    },
  ],
  fixedCosts: [{ item: "", monthlyAmount: 0 }],
  payroll: [{ role: "", monthlySalary: 0, headcount: 1, startMonth: 1 }],
  marketingMonthly: 0,
  overheadPct: 3,
  taxRatePct: 10,
  discountRatePct: 8,
  workingCapitalMonths: 1,
});
