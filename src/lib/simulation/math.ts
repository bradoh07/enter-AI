/** Numeric helpers shared by the deterministic simulation engine. */

/** Coerce anything into a finite number, falling back to 0. */
export const safeNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Coerce into an integer inside an inclusive range. */
export const clampInt = (value: unknown, min: number, max: number): number => {
  const parsed = Math.round(safeNumber(value, min));
  return Math.min(max, Math.max(min, parsed));
};

/** Coerce into a number clamped to an inclusive range. */
export const clampNumber = (value: unknown, min: number, max: number): number => {
  const parsed = safeNumber(value, min);
  return Math.min(max, Math.max(min, parsed));
};

/** Effective monthly compounding of a rate expressed in percent per month. */
export const growthFactor = (monthlyGrowthPct: number, monthsActive: number): number => {
  const rate = safeNumber(monthlyGrowthPct) / 100;
  const factor = Math.pow(1 + rate, Math.max(0, monthsActive));
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
};

/** Round to a fixed number of decimals without producing -0. */
export const round = (value: number, decimals = 2): number => {
  const safe = safeNumber(value);
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(safe * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};
