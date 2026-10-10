/**
 * Domain types for the deterministic business simulation engine.
 *
 * Everything in this folder is pure TypeScript: the same input always produces
 * the same output, with no network or AI dependency. AI insights are stored
 * separately and never overwrite these computed values.
 */

export type CurrencyCode = "KRW" | "USD";

export type ScenarioKey = "optimistic" | "base" | "pessimistic";

export const SCENARIO_KEYS: ScenarioKey[] = ["optimistic", "base", "pessimistic"];

/** How a scenario bends the base assumptions of the same input. */
export type ScenarioAdjustment = {
  /** Multiplies every revenue stream's unit volume. */
  revenueMultiplier: number;
  /** Multiplies variable cost per unit. */
  unitCostMultiplier: number;
  /** Multiplies recurring fixed costs and marketing spend. */
  fixedCostMultiplier: number;
  /** Shifts every revenue stream's start month (positive = slower ramp). */
  rampOffsetMonths: number;
};

export type InvestmentItem = {
  item: string;
  amount: number;
};

export type FundingSourceType = "equity" | "debt" | "grant" | "self";

export type FundingSource = {
  source: FundingSourceType;
  amount: number;
  /** Annual interest rate in percent. Only meaningful for `debt`. */
  rateAnnual: number;
  /** Months with interest but no principal repayment. Only for `debt`. */
  graceMonths: number;
  /** Month in which the money lands (1 = first month). */
  startMonth: number;
};

export type RevenueStream = {
  name: string;
  unitPrice: number;
  unitCost: number;
  monthlyUnits: number;
  monthlyGrowthPct: number;
  startMonth: number;
};

export type CostItem = {
  item: string;
  monthlyAmount: number;
};

export type PayrollItem = {
  role: string;
  monthlySalary: number;
  headcount: number;
  startMonth: number;
};

export type SimulationInput = {
  currency: CurrencyCode;
  horizonMonths: number;
  initialInvestment: InvestmentItem[];
  funding: FundingSource[];
  revenueStreams: RevenueStream[];
  fixedCosts: CostItem[];
  payroll: PayrollItem[];
  marketingMonthly: number;
  /** Overhead as a percentage of revenue. */
  overheadPct: number;
  taxRatePct: number;
  discountRatePct: number;
  /** Months of revenue held as working capital. */
  workingCapitalMonths: number;
};

export type MonthlyPoint = {
  month: number;
  revenue: number;
  variableCost: number;
  grossProfit: number;
  fixedCost: number;
  payrollCost: number;
  marketingCost: number;
  overheadCost: number;
  operatingProfit: number;
  tax: number;
  netProfit: number;
  capex: number;
  workingCapitalDelta: number;
  debtInterest: number;
  debtRepayment: number;
  financingInflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
};

export type KpiSet = {
  totalInvestment: number;
  /** Deepest cumulative cash deficit — the capital the project actually needs. */
  peakFundingRequirement: number;
  lowestCumulativeCash: number;
  /** First month with a positive operating result, null when never. */
  firstProfitableMonth: number | null;
  /** First month where cumulative cash (including funding) is back to zero. */
  paybackMonths: number | null;
  /** Monthly revenue needed to cover all fixed costs at the final month's margin. */
  breakevenMonthlyRevenue: number | null;
  /** First month cumulative cash falls below zero, null when it never does. */
  cashExhaustedMonth: number | null;
  yearOneRevenue: number;
  horizonRevenue: number;
  horizonOperatingProfit: number;
  horizonNetProfit: number;
  operatingMarginPct: number;
  roiPct: number;
  npv: number;
  irrAnnualPct: number | null;
};

export type YearlyAggregate = {
  year: number;
  revenue: number;
  cost: number;
  operatingProfit: number;
  netProfit: number;
};

export type ScenarioResult = {
  key: ScenarioKey;
  adjustment: ScenarioAdjustment;
  monthly: MonthlyPoint[];
  yearly: YearlyAggregate[];
  kpis: KpiSet;
};

export type SimulationResult = {
  engineVersion: string;
  currency: CurrencyCode;
  horizonMonths: number;
  scenarios: Record<ScenarioKey, ScenarioResult>;
};

/** Where a stated assumption came from. The UI badges these differently. */
export type AssumptionSource = "engine" | "user" | "ai";

export type AssumptionImpact = "high" | "medium" | "low";

export type AssumptionNote = {
  /** Stable id used as a React key and to detect user edits. */
  id: string;
  /** i18n key resolved at render time — the engine stores no display text. */
  labelKey: string;
  params?: Record<string, string | number>;
  source: AssumptionSource;
  impact: AssumptionImpact;
};
