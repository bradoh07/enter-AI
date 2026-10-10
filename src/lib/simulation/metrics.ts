import { safeNumber } from "./math";
import type { KpiSet, MonthlyPoint, YearlyAggregate } from "./types";

const sum = (values: number[]): number => values.reduce((total, v) => total + v, 0);

/** Operating cash flow used for NPV/IRR: accrual profit net of working capital build-up. */
export const operatingCashFlows = (monthly: MonthlyPoint[]): number[] =>
  monthly.map((point) => point.netProfit - point.workingCapitalDelta);

export const buildYearlyAggregates = (monthly: MonthlyPoint[]): YearlyAggregate[] => {
  const years = new Map<number, YearlyAggregate>();

  monthly.forEach((point) => {
    const year = Math.floor((point.month - 1) / 12) + 1;
    const current = years.get(year) ?? {
      year,
      revenue: 0,
      cost: 0,
      operatingProfit: 0,
      netProfit: 0,
    };
    current.revenue += point.revenue;
    current.cost +=
      point.variableCost +
      point.fixedCost +
      point.payrollCost +
      point.marketingCost +
      point.overheadCost;
    current.operatingProfit += point.operatingProfit;
    current.netProfit += point.netProfit;
    years.set(year, current);
  });

  return [...years.values()].sort((a, b) => a.year - b.year);
};

/** Net present value of an unlevered project: operating cash flows minus the initial outlay. */
export const netPresentValue = (
  flows: number[],
  initialInvestment: number,
  monthlyDiscountRate: number,
): number =>
  -safeNumber(initialInvestment) +
  flows.reduce(
    (total, flow, index) =>
      total + safeNumber(flow) / Math.pow(1 + monthlyDiscountRate, index + 1),
    0,
  );

/**
 * Monthly IRR found by bisection, annualised. Returns null when the cash flows
 * never change sign — a project that only ever loses or only ever earns money
 * has no internal rate of return, and reporting 0% there would be a lie.
 */
export const internalRateOfReturn = (
  flows: number[],
  initialInvestment: number,
): number | null => {
  const series = [-safeNumber(initialInvestment), ...flows.map((f) => safeNumber(f))];
  const hasPositive = series.some((v) => v > 0);
  const hasNegative = series.some((v) => v < 0);
  if (!hasPositive || !hasNegative) return null;

  const npvAt = (rate: number): number =>
    series.reduce((total, value, index) => total + value / Math.pow(1 + rate, index), 0);

  let low = -0.9;
  let high = 1;
  let lowValue = npvAt(low);
  const highValue = npvAt(high);
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue)) return null;
  if (lowValue * highValue > 0) return null;

  for (let step = 0; step < 200; step += 1) {
    const mid = (low + high) / 2;
    const midValue = npvAt(mid);
    if (Math.abs(midValue) < 1e-7) {
      low = mid;
      high = mid;
      break;
    }
    if (lowValue * midValue <= 0) {
      high = mid;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  const monthlyRate = (low + high) / 2;
  const annual = Math.pow(1 + monthlyRate, 12) - 1;
  return Number.isFinite(annual) ? annual * 100 : null;
};

export const computeKpis = (
  monthly: MonthlyPoint[],
  totalInvestment: number,
  discountRatePct: number,
): KpiSet => {
  const last = monthly[monthly.length - 1];
  const horizonRevenue = sum(monthly.map((p) => p.revenue));
  const horizonOperatingProfit = sum(monthly.map((p) => p.operatingProfit));
  const horizonNetProfit = sum(monthly.map((p) => p.netProfit));

  const cumulative = monthly.map((p) => p.cumulativeCashFlow);
  const lowestCumulativeCash = cumulative.length > 0 ? Math.min(...cumulative) : 0;

  const firstProfitableMonth =
    monthly.find((p) => p.operatingProfit > 0)?.month ?? null;
  const paybackMonths =
    monthly.find((p) => p.cumulativeCashFlow >= 0)?.month ?? null;
  const cashExhaustedMonth =
    monthly.find((p) => p.cumulativeCashFlow < 0)?.month ?? null;

  // Contribution margin after revenue-linked overhead, used for the break-even revenue.
  const finalMarginRatio =
    last && last.revenue > 0
      ? (last.revenue - last.variableCost - last.overheadCost) / last.revenue
      : 0;
  const finalFixedCost = last
    ? last.fixedCost + last.payrollCost + last.marketingCost
    : 0;
  const breakevenMonthlyRevenue =
    finalMarginRatio > 0 ? finalFixedCost / finalMarginRatio : null;

  const flows = operatingCashFlows(monthly);
  const monthlyDiscountRate = Math.max(0, safeNumber(discountRatePct)) / 100 / 12;

  return {
    totalInvestment: safeNumber(totalInvestment),
    peakFundingRequirement: Math.max(0, -lowestCumulativeCash),
    lowestCumulativeCash,
    firstProfitableMonth,
    paybackMonths,
    breakevenMonthlyRevenue,
    cashExhaustedMonth,
    yearOneRevenue: sum(monthly.slice(0, 12).map((p) => p.revenue)),
    horizonRevenue,
    horizonOperatingProfit,
    horizonNetProfit,
    operatingMarginPct: horizonRevenue > 0 ? (horizonOperatingProfit / horizonRevenue) * 100 : 0,
    roiPct:
      safeNumber(totalInvestment) > 0
        ? (horizonNetProfit / safeNumber(totalInvestment)) * 100
        : 0,
    npv: netPresentValue(flows, totalInvestment, monthlyDiscountRate),
    irrAnnualPct: internalRateOfReturn(flows, totalInvestment),
  };
};
