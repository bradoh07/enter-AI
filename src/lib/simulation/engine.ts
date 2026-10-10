import { buildYearlyAggregates, computeKpis } from "./metrics";
import { ENGINE_VERSION } from "./defaults";
import { clampInt, growthFactor, round, safeNumber } from "./math";
import type {
  FundingSource,
  MonthlyPoint,
  ScenarioAdjustment,
  ScenarioKey,
  ScenarioResult,
  SimulationInput,
  SimulationResult,
} from "./types";
import { SCENARIO_KEYS } from "./types";

const HORIZON_MIN = 1;
const HORIZON_MAX = 240;

/** Interest and principal repayment per month, indexed by month (1-based). */
const buildDebtSchedule = (funding: FundingSource[], horizon: number) => {
  const interest = new Array<number>(horizon + 1).fill(0);
  const principal = new Array<number>(horizon + 1).fill(0);

  funding
    .filter((source) => source.source === "debt" && safeNumber(source.amount) > 0)
    .forEach((source) => {
      const startMonth = clampInt(source.startMonth, 1, horizon);
      const graceMonths = Math.max(0, Math.round(safeNumber(source.graceMonths)));
      const repaymentStart = Math.min(horizon, startMonth + graceMonths);
      const repaymentMonths = Math.max(1, horizon - repaymentStart + 1);
      const monthlyPrincipal = safeNumber(source.amount) / repaymentMonths;
      const monthlyRate = Math.max(0, safeNumber(source.rateAnnual)) / 100 / 12;

      let balance = safeNumber(source.amount);
      for (let month = startMonth; month <= horizon; month += 1) {
        interest[month] += balance * monthlyRate;
        if (month >= repaymentStart && balance > 0) {
          const payment = Math.min(balance, monthlyPrincipal);
          principal[month] += payment;
          balance -= payment;
        }
      }
    });

  return { interest, principal };
};

/** Every funding source lands as a cash inflow in its start month. */
const buildFinancingInflow = (funding: FundingSource[], horizon: number): number[] => {
  const inflow = new Array<number>(horizon + 1).fill(0);
  funding.forEach((source) => {
    const month = clampInt(source.startMonth, 1, horizon);
    inflow[month] += Math.max(0, safeNumber(source.amount));
  });
  return inflow;
};

export const totalInvestmentOf = (input: SimulationInput): number =>
  input.initialInvestment.reduce((total, item) => total + safeNumber(item.amount), 0);

/**
 * Month-by-month projection for one scenario.
 *
 * Revenue grows from each stream's start month; fixed costs and marketing are
 * bent by the scenario, while payroll stays at face value because headcount is
 * a contractual commitment rather than a scenario variable.
 */
export const buildMonthlySeries = (
  input: SimulationInput,
  adjustment: ScenarioAdjustment,
): MonthlyPoint[] => {
  const horizon = clampInt(input.horizonMonths, HORIZON_MIN, HORIZON_MAX);
  const totalCapex = totalInvestmentOf(input);
  const { interest, principal } = buildDebtSchedule(input.funding, horizon);
  const financingInflow = buildFinancingInflow(input.funding, horizon);

  const fixedCostsMonthly =
    input.fixedCosts.reduce((total, cost) => total + safeNumber(cost.monthlyAmount), 0) *
    adjustment.fixedCostMultiplier;
  const marketingMonthly =
    safeNumber(input.marketingMonthly) * adjustment.fixedCostMultiplier;
  const overheadRate = safeNumber(input.overheadPct) / 100;
  const taxRate = safeNumber(input.taxRatePct) / 100;
  const workingCapitalRatio = Math.max(0, safeNumber(input.workingCapitalMonths)) / 12;

  const points: MonthlyPoint[] = [];
  let cumulativeCash = 0;
  let previousWorkingCapital = 0;

  for (let month = 1; month <= horizon; month += 1) {
    let revenue = 0;
    let variableCost = 0;

    input.revenueStreams.forEach((stream) => {
      const startMonth = Math.max(
        1,
        Math.round(safeNumber(stream.startMonth, 1)) + adjustment.rampOffsetMonths,
      );
      if (month < startMonth) return;

      const units =
        Math.max(0, safeNumber(stream.monthlyUnits)) *
        growthFactor(stream.monthlyGrowthPct, month - startMonth) *
        adjustment.revenueMultiplier;

      revenue += units * safeNumber(stream.unitPrice);
      variableCost += units * safeNumber(stream.unitCost) * adjustment.unitCostMultiplier;
    });

    const payrollCost = input.payroll.reduce(
      (total, item) =>
        month >= Math.max(1, Math.round(safeNumber(item.startMonth, 1)))
          ? total + safeNumber(item.monthlySalary) * Math.max(0, safeNumber(item.headcount))
          : total,
      0,
    );

    const overheadCost = revenue * overheadRate;
    const grossProfit = revenue - variableCost;
    const operatingProfit =
      grossProfit - fixedCostsMonthly - payrollCost - marketingMonthly - overheadCost;
    const tax = operatingProfit > 0 ? operatingProfit * taxRate : 0;
    const netProfit = operatingProfit - tax;

    const capex = month === 1 ? totalCapex : 0;
    const workingCapitalTarget = revenue * workingCapitalRatio;
    const workingCapitalDelta = workingCapitalTarget - previousWorkingCapital;
    previousWorkingCapital = workingCapitalTarget;

    const netCashFlow =
      netProfit +
      financingInflow[month] -
      capex -
      workingCapitalDelta -
      interest[month] -
      principal[month];
    cumulativeCash += netCashFlow;

    points.push({
      month,
      revenue: round(revenue),
      variableCost: round(variableCost),
      grossProfit: round(grossProfit),
      fixedCost: round(fixedCostsMonthly),
      payrollCost: round(payrollCost),
      marketingCost: round(marketingMonthly),
      overheadCost: round(overheadCost),
      operatingProfit: round(operatingProfit),
      tax: round(tax),
      netProfit: round(netProfit),
      capex: round(capex),
      workingCapitalDelta: round(workingCapitalDelta),
      debtInterest: round(interest[month]),
      debtRepayment: round(principal[month]),
      financingInflow: round(financingInflow[month]),
      netCashFlow: round(netCashFlow),
      cumulativeCashFlow: round(cumulativeCash),
    });
  }

  return points;
};

export const computeScenario = (
  input: SimulationInput,
  key: ScenarioKey,
  adjustment: ScenarioAdjustment,
): ScenarioResult => {
  const monthly = buildMonthlySeries(input, adjustment);
  return {
    key,
    adjustment,
    monthly,
    yearly: buildYearlyAggregates(monthly),
    kpis: computeKpis(monthly, totalInvestmentOf(input), input.discountRatePct),
  };
};

/** Full three-scenario result set. This is what gets stored on a simulation run. */
export const computeSimulation = (
  input: SimulationInput,
  adjustments: Record<ScenarioKey, ScenarioAdjustment>,
): SimulationResult => {
  const scenarios = SCENARIO_KEYS.reduce(
    (accumulator, key) => {
      accumulator[key] = computeScenario(input, key, adjustments[key]);
      return accumulator;
    },
    {} as Record<ScenarioKey, ScenarioResult>,
  );

  return {
    engineVersion: ENGINE_VERSION,
    currency: input.currency,
    horizonMonths: clampInt(input.horizonMonths, HORIZON_MIN, HORIZON_MAX),
    scenarios,
  };
};

/** Yearly rows prepared for the comparison chart, one row per year. */
export const buildScenarioComparison = (result: SimulationResult) => {
  const baseYears = result.scenarios.base.yearly;
  return baseYears.map((year) => {
    const row: Record<string, number> = { year: year.year };
    SCENARIO_KEYS.forEach((key) => {
      const match = result.scenarios[key].yearly.find((y) => y.year === year.year);
      row[`${key}Revenue`] = match?.revenue ?? 0;
      row[`${key}OperatingProfit`] = match?.operatingProfit ?? 0;
    });
    return row;
  });
};
