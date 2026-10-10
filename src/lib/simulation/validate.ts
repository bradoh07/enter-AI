import { z } from "zod";

import { createEmptyInput } from "./defaults";
import { clampInt, clampNumber } from "./math";
import type { SimulationInput } from "./types";

const money = z.coerce.number().catch(0);
const percent = z.coerce.number().catch(0);
const monthIndex = z.coerce.number().catch(1).transform((value) => Math.round(value));

const investmentItemSchema = z.object({
  item: z.string().catch(""),
  amount: money,
});

const fundingSchema = z.object({
  source: z.enum(["equity", "debt", "grant", "self"]).catch("self"),
  amount: money,
  rateAnnual: percent,
  graceMonths: monthIndex,
  startMonth: monthIndex,
});

const revenueStreamSchema = z.object({
  name: z.string().catch(""),
  unitPrice: money,
  unitCost: money,
  monthlyUnits: money,
  monthlyGrowthPct: percent,
  startMonth: monthIndex,
});

const costItemSchema = z.object({
  item: z.string().catch(""),
  monthlyAmount: money,
});

const payrollSchema = z.object({
  role: z.string().catch(""),
  monthlySalary: money,
  headcount: money,
  startMonth: monthIndex,
});

/**
 * Tolerant schema for JSON read back out of the database. Every field carries a
 * `.catch()` so a partially written or legacy row degrades to a usable input
 * object instead of throwing inside the render path.
 */
export const simulationInputSchema = z.object({
  currency: z.enum(["KRW", "USD"]).catch("KRW"),
  horizonMonths: z.coerce.number().catch(36).transform((value) => clampInt(value, 1, 240)),
  initialInvestment: z.array(investmentItemSchema).catch([]),
  funding: z.array(fundingSchema).catch([]),
  revenueStreams: z.array(revenueStreamSchema).catch([]),
  fixedCosts: z.array(costItemSchema).catch([]),
  payroll: z.array(payrollSchema).catch([]),
  marketingMonthly: money,
  overheadPct: percent,
  taxRatePct: percent,
  discountRatePct: percent,
  workingCapitalMonths: percent,
});

export const parseSimulationInput = (value: unknown): SimulationInput => {
  const parsed = simulationInputSchema.safeParse(value);
  if (!parsed.success) return createEmptyInput();

  const input = parsed.data as SimulationInput;
  return {
    ...input,
    marketingMonthly: Math.max(0, input.marketingMonthly),
    overheadPct: clampNumber(input.overheadPct, 0, 50),
    taxRatePct: clampNumber(input.taxRatePct, 0, 80),
    discountRatePct: clampNumber(input.discountRatePct, 0, 80),
    workingCapitalMonths: clampNumber(input.workingCapitalMonths, 0, 24),
  };
};

/** True when the input has nothing to compute: no price, no volume, no cost. */
export const isInputEmpty = (input: SimulationInput): boolean => {
  const hasRevenue = input.revenueStreams.some(
    (stream) => stream.unitPrice > 0 && stream.monthlyUnits > 0,
  );
  const hasCost =
    input.fixedCosts.some((cost) => cost.monthlyAmount > 0) ||
    input.payroll.some((item) => item.monthlySalary > 0) ||
    input.marketingMonthly > 0;
  return !hasRevenue && !hasCost;
};
